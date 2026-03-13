import { useState, DragEvent } from 'react';
import { Column as ColumnType } from '../types';
import { useBoardContext } from '../context/BoardContext';
import { Card } from './Card';
import { CardForm } from './CardForm';

interface ColumnProps {
  column: ColumnType;
}

export function Column({ column }: ColumnProps) {
  const { getColumnCards, filteredCards, handleDragOver, handleDrop } = useBoardContext();
  const [isAdding, setIsAdding] = useState(false);

  const columnCards = getColumnCards(column.id, filteredCards);

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    handleDragOver(e, column.id);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    handleDrop(e, column.id);
  };

  return (
    <div
      className="kanban-column"
      onDragOver={onDragOver}
      onDrop={onDrop}
      data-testid={`column-${column.id}`}
      data-column-id={column.id}
    >
      <div className="column-header">
        <h2 className="column-title">
          {column.title}
          <span className="column-count">{columnCards.length}</span>
        </h2>
        <button
          className="btn btn-add"
          onClick={() => setIsAdding(true)}
          data-testid={`add-card-${column.id}`}
        >
          + 添加卡片
        </button>
      </div>

      <div className="column-body">
        {isAdding && (
          <CardForm columnId={column.id} onClose={() => setIsAdding(false)} />
        )}
        {columnCards.map((card) => (
          <Card key={card.id} card={card} />
        ))}
        {columnCards.length === 0 && !isAdding && (
          <div className="column-empty">拖拽卡片到这里</div>
        )}
      </div>
    </div>
  );
}
