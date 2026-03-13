import { test, expect, Page } from '@playwright/test';

// Helper: clear localStorage and reload
async function resetBoard(page: Page) {
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('[data-testid="board"]');
}

// Helper: add a card to a column
async function addCard(
  page: Page,
  columnId: string,
  title: string,
  tags: string = '',
  priority: string = 'medium'
) {
  await page.click(`[data-testid="add-card-${columnId}"]`);
  await page.fill('[data-testid="card-form-title"]', title);
  if (tags) {
    await page.fill('[data-testid="card-form-tags"]', tags);
  }
  if (priority !== 'medium') {
    await page.selectOption('[data-testid="card-form-priority"]', priority);
  }
  await page.click('[data-testid="card-form-submit"]');
  await page.waitForTimeout(100);
}

// Helper: manually dispatch HTML5 drag events (reliable for native DnD)
async function dragCardToColumn(
  page: Page,
  cardSelector: string,
  targetColumnId: string
) {
  await page.evaluate(
    ({ cardSel, targetColId }) => {
      const cardEl = document.querySelector(cardSel) as HTMLElement;
      const targetEl = document.querySelector(
        `[data-column-id="${targetColId}"]`
      ) as HTMLElement;
      if (!cardEl || !targetEl)
        throw new Error(`Card "${cardSel}" or column "${targetColId}" not found`);

      const dataTransfer = new DataTransfer();

      cardEl.dispatchEvent(
        new DragEvent('dragstart', { bubbles: true, dataTransfer })
      );
      targetEl.dispatchEvent(
        new DragEvent('dragover', { bubbles: true, dataTransfer })
      );
      targetEl.dispatchEvent(
        new DragEvent('drop', { bubbles: true, dataTransfer })
      );
      cardEl.dispatchEvent(
        new DragEvent('dragend', { bubbles: true, dataTransfer })
      );
    },
    { cardSel: cardSelector, targetColId: targetColumnId }
  );
  await page.waitForTimeout(150);
}

// Helper: wait for localStorage debounce to complete
async function waitForSave(page: Page) {
  await page.waitForTimeout(500);
}

// Helper: get cards from localStorage
async function getStoredCards(page: Page) {
  return page.evaluate(() => {
    const data = localStorage.getItem('kanban-board-cards');
    return data ? JSON.parse(data) : null;
  });
}

test.describe('Bug Fix - Data Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await resetBoard(page);
  });

  test('Test 1: Adding a card persists after normal reload (wait for debounce)', async ({ page }) => {
    await addCard(page, 'todo', 'Persist Test Card', 'test');
    await waitForSave(page);

    await page.reload();
    await page.waitForSelector('[data-testid="board"]');

    const titles = await page.locator('.card-title').allTextContents();
    expect(titles).toContain('Persist Test Card');
  });

  test('Test 2: Adding a card and reloading IMMEDIATELY persists (beforeunload save)', async ({ page }) => {
    // Targets Bug 1: stale closure in beforeunload handler.
    // If beforeunload saves stale initial cards, the new card is lost.
    await addCard(page, 'todo', 'Quick Reload Card');

    // Reload within the 300ms debounce window — beforeunload should save latest data
    await page.reload();
    await page.waitForSelector('[data-testid="board"]');

    const titles = await page.locator('.card-title').allTextContents();
    expect(titles).toContain('Quick Reload Card');
  });

  test('Test 3: Rapidly adding multiple cards then immediate reload preserves all', async ({ page }) => {
    // Another Bug 1 trigger with multiple rapid additions
    await addCard(page, 'todo', 'Rapid A');
    await addCard(page, 'todo', 'Rapid B');
    await addCard(page, 'todo', 'Rapid C');

    // Immediate reload — beforeunload must save ALL three cards
    await page.reload();
    await page.waitForSelector('[data-testid="board"]');

    const titles = await page.locator('.card-title').allTextContents();
    expect(titles).toContain('Rapid A');
    expect(titles).toContain('Rapid B');
    expect(titles).toContain('Rapid C');
  });

  test('Test 4: Dragging a card persists after waiting for save', async ({ page }) => {
    const firstCard = page.locator('[data-column-id="todo"] .kanban-card').first();
    const cardTitle = await firstCard.locator('.card-title').textContent();
    const cardId = await firstCard.getAttribute('data-card-id');

    await dragCardToColumn(page, `[data-card-id="${cardId}"]`, 'done');
    await waitForSave(page);

    await page.reload();
    await page.waitForSelector('[data-testid="board"]');

    const doneCards = await page.locator('[data-column-id="done"] .card-title').allTextContents();
    expect(doneCards).toContain(cardTitle);
  });

  test('Test 5: Add card then immediately drag another — both operations persist', async ({ page }) => {
    // Targets Bug 2: if moveCard uses stale `cards` (non-functional setState),
    // the drag operation can overwrite the add operation.
    await addCard(page, 'todo', 'Just Added Card');

    // Immediately drag an existing card
    const existingCard = page.locator('[data-column-id="todo"] .kanban-card').first();
    const existingTitle = await existingCard.locator('.card-title').textContent();
    const existingId = await existingCard.getAttribute('data-card-id');

    if (existingTitle !== 'Just Added Card' && existingId) {
      await dragCardToColumn(page, `[data-card-id="${existingId}"]`, 'in-progress');
    }

    await waitForSave(page);
    await page.reload();
    await page.waitForSelector('[data-testid="board"]');

    // BOTH the add and the drag should persist
    const allTitles = await page.locator('.card-title').allTextContents();
    expect(allTitles).toContain('Just Added Card');

    if (existingTitle && existingTitle !== 'Just Added Card') {
      const inProgressTitles = await page.locator(
        '[data-column-id="in-progress"] .card-title'
      ).allTextContents();
      expect(inProgressTitles).toContain(existingTitle);
    }
  });

  test('Test 6: Multiple drags in quick succession all persist', async ({ page }) => {
    const todoCards = page.locator('[data-column-id="todo"] .kanban-card');
    const count = await todoCards.count();

    if (count >= 2) {
      const card1Id = await todoCards.nth(0).getAttribute('data-card-id');
      const card1Title = await todoCards.nth(0).locator('.card-title').textContent();
      const card2Id = await todoCards.nth(1).getAttribute('data-card-id');
      const card2Title = await todoCards.nth(1).locator('.card-title').textContent();

      if (card1Id) await dragCardToColumn(page, `[data-card-id="${card1Id}"]`, 'in-progress');
      if (card2Id) await dragCardToColumn(page, `[data-card-id="${card2Id}"]`, 'done');

      await waitForSave(page);
      await page.reload();
      await page.waitForSelector('[data-testid="board"]');

      if (card1Title) {
        const ipTitles = await page.locator('[data-column-id="in-progress"] .card-title').allTextContents();
        expect(ipTitles).toContain(card1Title);
      }
      if (card2Title) {
        const doneTitles = await page.locator('[data-column-id="done"] .card-title').allTextContents();
        expect(doneTitles).toContain(card2Title);
      }
    }
  });

  test('Test 7: Edit card persists after reload', async ({ page }) => {
    const firstCard = page.locator('.kanban-card').first();
    await firstCard.hover();
    await firstCard.locator('.edit-btn').click();

    await page.fill('[data-testid="card-form-title"]', 'Edited Title XYZ');
    await page.click('[data-testid="card-form-submit"]');

    await waitForSave(page);
    await page.reload();
    await page.waitForSelector('[data-testid="board"]');

    const titles = await page.locator('.card-title').allTextContents();
    expect(titles).toContain('Edited Title XYZ');
  });

  test('Test 8: Delete card persists after reload', async ({ page }) => {
    const firstCard = page.locator('.kanban-card').first();
    const cardTitle = await firstCard.locator('.card-title').textContent();
    const initialCount = await page.locator('.kanban-card').count();

    await firstCard.hover();
    await firstCard.locator('.delete-btn').click();

    await waitForSave(page);
    await page.reload();
    await page.waitForSelector('[data-testid="board"]');

    const newCount = await page.locator('.kanban-card').count();
    expect(newCount).toBe(initialCount - 1);
    const titles = await page.locator('.card-title').allTextContents();
    expect(titles).not.toContain(cardTitle);
  });

  test('Test 9: Debounce works — rapid operations do not cause excessive writes', async ({ page }) => {
    await page.evaluate(() => {
      const originalSetItem = Storage.prototype.setItem;
      (window as any).__storageWriteCount = 0;
      Storage.prototype.setItem = function (key: string, value: string) {
        if (key === 'kanban-board-cards') {
          (window as any).__storageWriteCount++;
        }
        return originalSetItem.call(this, key, value);
      };
    });

    await addCard(page, 'todo', 'Count Card 1');
    await addCard(page, 'todo', 'Count Card 2');
    await addCard(page, 'todo', 'Count Card 3');

    await page.waitForTimeout(800);

    const writeCount = await page.evaluate(() => (window as any).__storageWriteCount);
    expect(writeCount).toBeLessThanOrEqual(5);
    expect(writeCount).toBeGreaterThanOrEqual(1);

    const cards = await getStoredCards(page);
    const titles = cards.map((c: any) => c.title);
    expect(titles).toContain('Count Card 1');
    expect(titles).toContain('Count Card 2');
    expect(titles).toContain('Count Card 3');
  });

  test('Test 10: Drag then immediate reload preserves result (beforeunload)', async ({ page }) => {
    // Combines Bug 1 + Bug 2: drag (may use stale state) then reload immediately
    const firstCard = page.locator('[data-column-id="todo"] .kanban-card').first();
    const cardTitle = await firstCard.locator('.card-title').textContent();
    const cardId = await firstCard.getAttribute('data-card-id');

    if (cardId) {
      await dragCardToColumn(page, `[data-card-id="${cardId}"]`, 'done');
      // Immediate reload — beforeunload must save the drag result
      await page.reload();
      await page.waitForSelector('[data-testid="board"]');

      const doneCards = await page.locator('[data-column-id="done"] .card-title').allTextContents();
      expect(doneCards).toContain(cardTitle);
    }
  });
});
