import { test, expect, Page } from '@playwright/test';

// Helper: clear localStorage and reload
async function resetBoard(page: Page) {
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('[data-testid="board"]');
}

// Helper: add a card to a column
async function addCard(page: Page, columnId: string, title: string, tags: string = '') {
  await page.click(`[data-testid="add-card-${columnId}"]`);
  await page.fill('[data-testid="card-form-title"]', title);
  if (tags) {
    await page.fill('[data-testid="card-form-tags"]', tags);
  }
  await page.click('[data-testid="card-form-submit"]');
  await page.waitForTimeout(100);
}

// Helper: manually dispatch HTML5 drag events by card title
async function dragCardByTitleToColumn(page: Page, cardTitle: string, targetColumnId: string) {
  await page.evaluate(
    ({ title, targetColId }) => {
      const allCards = document.querySelectorAll('.kanban-card');
      let cardEl: HTMLElement | null = null;
      allCards.forEach((el) => {
        const titleEl = el.querySelector('.card-title');
        if (titleEl && titleEl.textContent === title) {
          cardEl = el as HTMLElement;
        }
      });
      const targetEl = document.querySelector(
        `[data-column-id="${targetColId}"]`
      ) as HTMLElement;
      if (!cardEl || !targetEl)
        throw new Error(`Card "${title}" or column "${targetColId}" not found`);

      const dataTransfer = new DataTransfer();
      cardEl.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer }));
      targetEl.dispatchEvent(new DragEvent('dragover', { bubbles: true, dataTransfer }));
      targetEl.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer }));
      cardEl.dispatchEvent(new DragEvent('dragend', { bubbles: true, dataTransfer }));
    },
    { title: cardTitle, targetColId: targetColumnId }
  );
  await page.waitForTimeout(150);
}

// Helper: wait for localStorage debounce
async function waitForSave(page: Page) {
  await page.waitForTimeout(500);
}

test.describe('Dependency Feature - Basic Requirements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await resetBoard(page);
  });

  test('Test 1: Card form has dependency selector', async ({ page }) => {
    await page.click('[data-testid="add-card-todo"]');

    const depSelector = page.locator(
      '[data-testid*="dependenc"], [data-testid*="depend"], .dependency-select, .dep-select, select[multiple], [class*="depend"]'
    );
    const multiSelect = page.locator(
      '[data-testid="card-form"] select[multiple], [data-testid="card-form-dependencies"]'
    );
    const checkboxes = page.locator('[data-testid="card-form"] input[type="checkbox"]');

    const hasDependencyUI =
      (await depSelector.count()) > 0 ||
      (await multiSelect.count()) > 0 ||
      (await checkboxes.count()) > 0;
    expect(hasDependencyUI).toBe(true);
  });

  test('Test 2: Can set dependencies when creating a card', async ({ page }) => {
    await addCard(page, 'todo', 'Task A');
    await addCard(page, 'todo', 'Task B');

    await page.click('[data-testid="add-card-todo"]');
    await page.fill('[data-testid="card-form-title"]', 'Task C (depends on A)');

    const depUI = page.locator(
      '[data-testid*="depend"], .dependency-select, [class*="depend"]'
    ).first();
    if ((await depUI.count()) > 0) {
      await depUI.click();
      const taskAOption = page.locator('text=Task A').first();
      if ((await taskAOption.count()) > 0) {
        await taskAOption.click();
      }
    }

    await page.click('[data-testid="card-form-submit"]');
    await page.waitForTimeout(100);

    const titles = await page.locator('.card-title').allTextContents();
    expect(titles).toContain('Task C (depends on A)');
  });

  test('Test 3: Card shows dependency status', async ({ page }) => {
    await addCard(page, 'todo', 'Dep Target 1');
    await addCard(page, 'todo', 'Dep Target 2');
    await addCard(page, 'done', 'Dep Target Done');

    const depStatus = page.locator(
      '[class*="depend"], [data-testid*="dep-status"], .dep-status, .dependency-status, .blocked'
    );

    await page.waitForTimeout(200);

    const cards = await page.evaluate(() => {
      const data = localStorage.getItem('kanban-board-cards');
      return data ? JSON.parse(data) : [];
    });

    const hasDepField = cards.some(
      (c: any) =>
        'dependencies' in c || 'dependsOn' in c || 'deps' in c || 'dependencyIds' in c
    );
    expect(hasDepField || (await depStatus.count()) > 0).toBe(true);
  });

  test('Test 4: Cannot drag card with unfinished dependencies to Done', async ({ page }) => {
    await addCard(page, 'todo', 'Blocking Task');

    await page.click('[data-testid="add-card-todo"]');
    await page.fill('[data-testid="card-form-title"]', 'Blocked Task');

    const depUI = page.locator(
      '[data-testid*="depend"], .dependency-select, [class*="depend"]'
    ).first();
    if ((await depUI.count()) > 0) {
      await depUI.click();
      const option = page.locator('text=Blocking Task').first();
      if ((await option.count()) > 0) {
        await option.click();
      }
    }
    await page.click('[data-testid="card-form-submit"]');
    await page.waitForTimeout(100);

    await dragCardByTitleToColumn(page, 'Blocked Task', 'done');

    const doneCards = await page.locator('[data-column-id="done"] .card-title').allTextContents();
    expect(doneCards).not.toContain('Blocked Task');
  });

  test('Test 5: Can drag card to Done when all dependencies are complete', async ({ page }) => {
    await addCard(page, 'done', 'Completed Dep');

    await page.click('[data-testid="add-card-todo"]');
    await page.fill('[data-testid="card-form-title"]', 'Ready Task');

    const depUI = page.locator(
      '[data-testid*="depend"], .dependency-select, [class*="depend"]'
    ).first();
    if ((await depUI.count()) > 0) {
      await depUI.click();
      const option = page.locator('text=Completed Dep').first();
      if ((await option.count()) > 0) {
        await option.click();
      }
    }
    await page.click('[data-testid="card-form-submit"]');
    await page.waitForTimeout(100);

    await dragCardByTitleToColumn(page, 'Ready Task', 'done');

    const doneCards = await page.locator('[data-column-id="done"] .card-title').allTextContents();
    expect(doneCards).toContain('Ready Task');
  });
});

test.describe('Dependency Feature - Edge Cases (Not in Requirements)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await resetBoard(page);
  });

  test('Test 6: Circular dependency prevention', async ({ page }) => {
    await addCard(page, 'todo', 'Circular A');
    await addCard(page, 'todo', 'Circular B');

    // Set B depends on A
    const cardB = page.locator('.kanban-card:has(.card-title:text-is("Circular B"))');
    await cardB.hover();
    await cardB.locator('.edit-btn').click();

    const depUI = page.locator(
      '[data-testid*="depend"], .dependency-select, [class*="depend"]'
    ).first();
    if ((await depUI.count()) > 0) {
      await depUI.click();
      const optionA = page.locator('text=Circular A').first();
      if ((await optionA.count()) > 0) await optionA.click();
    }
    await page.click('[data-testid="card-form-submit"]');
    await page.waitForTimeout(100);

    // Try to set A depends on B — should be prevented
    const cardA = page.locator('.kanban-card:has(.card-title:text-is("Circular A"))');
    await cardA.hover();
    await cardA.locator('.edit-btn').click();

    const depUI2 = page.locator(
      '[data-testid*="depend"], .dependency-select, [class*="depend"]'
    ).first();
    if ((await depUI2.count()) > 0) {
      await depUI2.click();
      const optionB = page.locator('text=Circular B').first();
      if ((await optionB.count()) > 0) await optionB.click();
    }
    await page.click('[data-testid="card-form-submit"]');
    await page.waitForTimeout(200);

    const cards = await page.evaluate(() => {
      const data = localStorage.getItem('kanban-board-cards');
      return data ? JSON.parse(data) : [];
    });

    const cardAData = cards.find((c: any) => c.title === 'Circular A');
    const cardBData = cards.find((c: any) => c.title === 'Circular B');

    if (cardAData && cardBData) {
      const aDeps = cardAData.dependencies || cardAData.dependsOn || cardAData.deps || cardAData.dependencyIds || [];
      const bDeps = cardBData.dependencies || cardBData.dependsOn || cardBData.deps || cardBData.dependencyIds || [];
      const aHasB = aDeps.includes(cardBData.id);
      const bHasA = bDeps.includes(cardAData.id);
      expect(aHasB && bHasA).toBe(false);
    }
  });

  test('Test 7: Cascade — moving dependency from Done back shows warning', async ({ page }) => {
    await addCard(page, 'done', 'Was Done Task');

    await page.click('[data-testid="add-card-todo"]');
    await page.fill('[data-testid="card-form-title"]', 'Depends On Was Done');

    const depUI = page.locator(
      '[data-testid*="depend"], .dependency-select, [class*="depend"]'
    ).first();
    if ((await depUI.count()) > 0) {
      await depUI.click();
      const option = page.locator('text=Was Done Task').first();
      if ((await option.count()) > 0) await option.click();
    }
    await page.click('[data-testid="card-form-submit"]');

    await dragCardByTitleToColumn(page, 'Was Done Task', 'todo');

    const dependentCard = page.locator(
      '.kanban-card:has(.card-title:text-is("Depends On Was Done"))'
    );
    const hasBlockedIndicator =
      (await dependentCard.locator('[class*="block"], [class*="warn"], [class*="depend"], .blocked, .warning').count()) > 0;
    const cardText = (await dependentCard.textContent()) || '';
    const hasBlockedText = /0\/1|blocked|阻塞|未完成/i.test(cardText);

    expect(hasBlockedIndicator || hasBlockedText).toBeTruthy();
  });

  test('Test 8: Deleting a card cleans up dependency references', async ({ page }) => {
    await addCard(page, 'todo', 'Will Be Deleted');

    await page.click('[data-testid="add-card-todo"]');
    await page.fill('[data-testid="card-form-title"]', 'Has Deleted Dep');

    const depUI = page.locator(
      '[data-testid*="depend"], .dependency-select, [class*="depend"]'
    ).first();
    if ((await depUI.count()) > 0) {
      await depUI.click();
      const option = page.locator('text=Will Be Deleted').first();
      if ((await option.count()) > 0) await option.click();
    }
    await page.click('[data-testid="card-form-submit"]');
    await page.waitForTimeout(100);

    // Handle possible confirmation dialog
    page.on('dialog', (dialog) => dialog.accept());

    const targetCard = page.locator('.kanban-card:has(.card-title:text-is("Will Be Deleted"))');
    await targetCard.hover();
    await targetCard.locator('.delete-btn').click();
    await page.waitForTimeout(200);

    const cards = await page.evaluate(() => {
      const data = localStorage.getItem('kanban-board-cards');
      return data ? JSON.parse(data) : [];
    });

    const depCard = cards.find((c: any) => c.title === 'Has Deleted Dep');
    const deletedCard = cards.find((c: any) => c.title === 'Will Be Deleted');
    expect(deletedCard).toBeUndefined();

    if (depCard) {
      const deps = depCard.dependencies || depCard.dependsOn || depCard.deps || depCard.dependencyIds || [];
      const validDeps = deps.filter((depId: string) => cards.some((c: any) => c.id === depId));
      expect(validDeps.length).toBe(deps.length);
    }
  });

  test('Test 9: Filtered-out dependency still blocks drag to Done', async ({ page }) => {
    await addCard(page, 'todo', 'Backend Blocker', 'backend');

    await page.click('[data-testid="add-card-todo"]');
    await page.fill('[data-testid="card-form-title"]', 'Frontend Blocked');
    await page.fill('[data-testid="card-form-tags"]', 'frontend');

    const depUI = page.locator(
      '[data-testid*="depend"], .dependency-select, [class*="depend"]'
    ).first();
    if ((await depUI.count()) > 0) {
      await depUI.click();
      const option = page.locator('text=Backend Blocker').first();
      if ((await option.count()) > 0) await option.click();
    }
    await page.click('[data-testid="card-form-submit"]');
    await page.waitForTimeout(100);

    // Filter to only "frontend" — hides "Backend Blocker"
    const frontendFilter = page.locator('[data-testid="filter-tag-frontend"]');
    if ((await frontendFilter.count()) > 0) {
      await frontendFilter.click();
      await page.waitForTimeout(100);
    }

    await dragCardByTitleToColumn(page, 'Frontend Blocked', 'done');

    const doneCards = await page.locator('[data-column-id="done"] .card-title').allTextContents();
    expect(doneCards).not.toContain('Frontend Blocked');
  });

  test('Test 10: Old data without dependency field loads without crash', async ({ page }) => {
    await page.evaluate(() => {
      const oldCards = [
        {
          id: 'old-1',
          title: 'Old Card No Deps',
          description: 'This card has no dependency field',
          tags: ['legacy'],
          priority: 'medium',
          columnId: 'todo',
          createdAt: Date.now(),
          order: 0,
        },
      ];
      localStorage.setItem('kanban-board-cards', JSON.stringify(oldCards));
    });

    await page.reload();
    await page.waitForSelector('[data-testid="board"]');

    const titles = await page.locator('.card-title').allTextContents();
    expect(titles).toContain('Old Card No Deps');

    await addCard(page, 'todo', 'New Card After Old Data');
    const updatedTitles = await page.locator('.card-title').allTextContents();
    expect(updatedTitles).toContain('New Card After Old Data');
  });
});

test.describe('Dependency Feature - Code Quality', () => {
  test('Test 11: Dependency data persists in localStorage', async ({ page }) => {
    await page.goto('/');
    await resetBoard(page);

    await addCard(page, 'todo', 'Persist Dep Target');

    await page.click('[data-testid="add-card-todo"]');
    await page.fill('[data-testid="card-form-title"]', 'Persist Dep Source');

    const depUI = page.locator(
      '[data-testid*="depend"], .dependency-select, [class*="depend"]'
    ).first();
    if ((await depUI.count()) > 0) {
      await depUI.click();
      const option = page.locator('text=Persist Dep Target').first();
      if ((await option.count()) > 0) await option.click();
    }
    await page.click('[data-testid="card-form-submit"]');

    await waitForSave(page);
    await page.reload();
    await page.waitForSelector('[data-testid="board"]');

    const cards = await page.evaluate(() => {
      const data = localStorage.getItem('kanban-board-cards');
      return data ? JSON.parse(data) : [];
    });

    const sourceCard = cards.find((c: any) => c.title === 'Persist Dep Source');
    if (sourceCard) {
      const deps = sourceCard.dependencies || sourceCard.dependsOn || sourceCard.deps || sourceCard.dependencyIds || [];
      expect(deps.length).toBeGreaterThan(0);
    }
  });

  test('Test 12: Existing kanban features still work (no regression)', async ({ page }) => {
    await page.goto('/');
    await resetBoard(page);

    await addCard(page, 'todo', 'Regression Test Card', 'test');
    let titles = await page.locator('.card-title').allTextContents();
    expect(titles).toContain('Regression Test Card');

    // Drag (no dependencies) should work
    await dragCardByTitleToColumn(page, 'Regression Test Card', 'done');
    const doneCards = await page.locator('[data-column-id="done"] .card-title').allTextContents();
    expect(doneCards).toContain('Regression Test Card');

    // Filter should work
    const testFilter = page.locator('[data-testid="filter-tag-test"]');
    if ((await testFilter.count()) > 0) {
      await testFilter.click();
      await page.waitForTimeout(100);
      const visibleCards = await page.locator('.kanban-card .card-title').allTextContents();
      expect(visibleCards).toContain('Regression Test Card');
      await page.click('[data-testid="clear-filter"]');
    }

    // Delete should work
    const cardToDelete = page.locator(
      '[data-column-id="done"] .kanban-card:has(.card-title:text-is("Regression Test Card"))'
    );
    await cardToDelete.hover();
    await cardToDelete.locator('.delete-btn').click();
    await page.waitForTimeout(100);

    titles = await page.locator('.card-title').allTextContents();
    expect(titles).not.toContain('Regression Test Card');
  });
});
