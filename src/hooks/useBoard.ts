import { useState, useCallback } from 'react';
import { Card, Column, ColumnId, Priority } from '../types';
import { loadCards } from '../utils/storage';
import { generateSeedCards } from '../utils/seed';
import { generateId } from '../utils/id';
import { useLocalStorage } from './useLocalStorage';

const columns: Column[] = [
  { id: 'todo', title: '待办' },
  { id: 'in-progress', title: '进行中' },
  { id: 'done', title: '已完成' },
];

function getInitialCards(): Card[] {
  const saved = loadCards();
  if (saved && saved.length > 0) return saved;
  return generateSeedCards();
}

export function useBoard() {
  const [cards, setCards] = useState<Card[]>(getInitialCards);

  useLocalStorage(cards);

  const getColumnCards = useCallback(
    (columnId: ColumnId, cardList?: Card[]) => {
      const source = cardList ?? cards;
      return source
        .filter((c) => c.columnId === columnId)
        .sort((a, b) => a.order - b.order);
    },
    [cards]
  );

  const addCard = useCallback(
    (title: string, description: string, tags: string[], priority: Priority, columnId: ColumnId) => {
      setCards((prev) => {
        const maxOrder = prev
          .filter((c) => c.columnId === columnId)
          .reduce((max, c) => Math.max(max, c.order), -1);

        const newCard: Card = {
          id: generateId(),
          title,
          description,
          tags,
          priority,
          columnId,
          createdAt: Date.now(),
          order: maxOrder + 1,
        };
        return [...prev, newCard];
      });
    },
    []
  );

  const updateCard = useCallback(
    (cardId: string, updates: Partial<Omit<Card, 'id' | 'createdAt'>>) => {
      setCards((prev) =>
        prev.map((card) => (card.id === cardId ? { ...card, ...updates } : card))
      );
    },
    []
  );

  const deleteCard = useCallback((cardId: string) => {
    setCards((prev) => prev.filter((card) => card.id !== cardId));
  }, []);

  const moveCard = useCallback((cardId: string, targetColumnId: ColumnId) => {
    const maxOrder = cards
      .filter((c) => c.columnId === targetColumnId)
      .reduce((max, c) => Math.max(max, c.order), -1);

    setCards(
      cards.map((card) =>
        card.id === cardId
          ? { ...card, columnId: targetColumnId, order: maxOrder + 1 }
          : card
      )
    );
  }, [cards]);

  return {
    cards,
    columns,
    getColumnCards,
    addCard,
    updateCard,
    deleteCard,
    moveCard,
  };
}
