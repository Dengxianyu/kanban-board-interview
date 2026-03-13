import { useRef, useCallback, DragEvent } from 'react';
import { Card, ColumnId } from '../types';

interface UseDragAndDropOptions {
  cards: Card[];
  onMoveCard: (cardId: string, targetColumnId: ColumnId) => void;
}

export function useDragAndDrop({ cards, onMoveCard }: UseDragAndDropOptions) {
  const dragCardId = useRef<string | null>(null);
  const dragOverColumnId = useRef<ColumnId | null>(null);

  const handleDragStart = useCallback(
    (e: DragEvent<HTMLDivElement>, cardId: string) => {
      dragCardId.current = cardId;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', cardId);

      const target = e.currentTarget;
      requestAnimationFrame(() => {
        target.style.opacity = '0.5';
      });
    },
    []
  );

  const handleDragEnd = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.currentTarget.style.opacity = '1';
    dragCardId.current = null;
    dragOverColumnId.current = null;
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>, columnId: ColumnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    dragOverColumnId.current = columnId;
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>, targetColumnId: ColumnId) => {
      e.preventDefault();
      const cardId = dragCardId.current;
      if (!cardId) return;

      const card = cards.find((c) => c.id === cardId);
      if (!card) return;

      if (card.columnId !== targetColumnId) {
        onMoveCard(cardId, targetColumnId);
      }

      dragCardId.current = null;
      dragOverColumnId.current = null;
    },
    [cards, onMoveCard]
  );

  return {
    dragCardId,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
  };
}
