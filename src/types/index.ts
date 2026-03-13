export type Priority = 'low' | 'medium' | 'high';

export type ColumnId = 'todo' | 'in-progress' | 'done';

export interface Card {
  id: string;
  title: string;
  description: string;
  tags: string[];
  priority: Priority;
  columnId: ColumnId;
  createdAt: number;
  order: number;
}

export interface Column {
  id: ColumnId;
  title: string;
}

export interface BoardState {
  cards: Card[];
  columns: Column[];
}

export interface FilterState {
  tags: string[];
  priority: Priority | null;
  search: string;
}
