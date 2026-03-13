import { createContext, useContext, ReactNode } from 'react';
import { Card, Column, ColumnId, Priority, FilterState } from '../types';
import { useBoard } from '../hooks/useBoard';
import { useFilter } from '../hooks/useFilter';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { DragEvent } from 'react';

interface BoardContextValue {
  // Board state
  cards: Card[];
  columns: Column[];
  getColumnCards: (columnId: ColumnId, cardList?: Card[]) => Card[];
  addCard: (title: string, description: string, tags: string[], priority: Priority, columnId: ColumnId) => void;
  updateCard: (cardId: string, updates: Partial<Omit<Card, 'id' | 'createdAt'>>) => void;
  deleteCard: (cardId: string) => void;
  moveCard: (cardId: string, targetColumnId: ColumnId) => void;

  // Filter state
  filter: FilterState;
  filteredCards: Card[];
  allTags: string[];
  toggleTag: (tag: string) => void;
  setPriority: (priority: Priority | null) => void;
  setSearch: (search: string) => void;
  clearFilter: () => void;
  isFiltering: boolean;

  // Drag and drop
  dragCardId: React.RefObject<string | null>;
  handleDragStart: (e: DragEvent<HTMLDivElement>, cardId: string) => void;
  handleDragEnd: (e: DragEvent<HTMLDivElement>) => void;
  handleDragOver: (e: DragEvent<HTMLDivElement>, columnId: ColumnId) => void;
  handleDrop: (e: DragEvent<HTMLDivElement>, targetColumnId: ColumnId) => void;
}

const BoardContext = createContext<BoardContextValue | null>(null);

export function BoardProvider({ children }: { children: ReactNode }) {
  const board = useBoard();
  const filterState = useFilter(board.cards);
  const dragAndDrop = useDragAndDrop({
    cards: board.cards,
    onMoveCard: board.moveCard,
  });

  const value: BoardContextValue = {
    ...board,
    ...filterState,
    ...dragAndDrop,
  };

  return (
    <BoardContext.Provider value={value}>{children}</BoardContext.Provider>
  );
}

export function useBoardContext(): BoardContextValue {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error('useBoardContext must be used within a BoardProvider');
  }
  return context;
}
