import { Card } from '../types';

const STORAGE_KEY = 'kanban-board-cards';

export function loadCards(): Card[] | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveCards(cards: Card[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  } catch (e) {
    console.error('Failed to save cards to localStorage:', e);
  }
}

export function clearCards(): void {
  localStorage.removeItem(STORAGE_KEY);
}
