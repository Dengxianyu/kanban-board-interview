import { useState, DragEvent } from 'react';
import { Card as CardType, Priority } from '../types';
import { useBoardContext } from '../context/BoardContext';
import { CardForm } from './CardForm';

const priorityColors: Record<Priority, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e',
};

const priorityLabels: Record<Priority, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

interface CardProps {
  card: CardType;
}

export function Card({ card }: CardProps) {
  const { handleDragStart, handleDragEnd, deleteCard } = useBoardContext();
  const [isEditing, setIsEditing] = useState(false);

  const onDragStart = (e: DragEvent<HTMLDivElement>) => {
    handleDragStart(e, card.id);
  };

  if (isEditing) {
    return (
      <CardForm
        card={card}
        onClose={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div
      className="kanban-card"
      draggable
      onDragStart={onDragStart}
      onDragEnd={handleDragEnd}
      data-card-id={card.id}
      data-testid={`card-${card.id}`}
    >
      <div className="card-header">
        <h3 className="card-title">{card.title}</h3>
        <div className="card-actions">
          <button
            className="card-btn edit-btn"
            onClick={() => setIsEditing(true)}
            title="编辑"
            data-testid={`edit-btn-${card.id}`}
          >
            ✏️
          </button>
          <button
            className="card-btn delete-btn"
            onClick={() => deleteCard(card.id)}
            title="删除"
            data-testid={`delete-btn-${card.id}`}
          >
            🗑️
          </button>
        </div>
      </div>

      {card.description && (
        <p className="card-description">{card.description}</p>
      )}

      <div className="card-footer">
        <div className="card-tags">
          {card.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
        <span
          className="priority-badge"
          style={{ backgroundColor: priorityColors[card.priority] }}
        >
          {priorityLabels[card.priority]}
        </span>
      </div>
    </div>
  );
}
