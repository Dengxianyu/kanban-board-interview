import { useState } from 'react';
import { Card, ColumnId, Priority } from '../types';
import { useBoardContext } from '../context/BoardContext';

interface CardFormProps {
  card?: Card;
  columnId?: ColumnId;
  onClose: () => void;
}

export function CardForm({ card, columnId, onClose }: CardFormProps) {
  const { addCard, updateCard } = useBoardContext();
  const isEditing = !!card;

  const [title, setTitle] = useState(card?.title ?? '');
  const [description, setDescription] = useState(card?.description ?? '');
  const [tagsInput, setTagsInput] = useState(card?.tags.join(', ') ?? '');
  const [priority, setPriority] = useState<Priority>(card?.priority ?? 'medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (isEditing && card) {
      updateCard(card.id, { title, description, tags, priority });
    } else if (columnId) {
      addCard(title, description, tags, priority, columnId);
    }
    onClose();
  };

  return (
    <form className="card-form" onSubmit={handleSubmit} data-testid="card-form">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="卡片标题"
        className="form-input"
        autoFocus
        data-testid="card-form-title"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="描述（可选）"
        className="form-textarea"
        rows={2}
        data-testid="card-form-description"
      />
      <input
        type="text"
        value={tagsInput}
        onChange={(e) => setTagsInput(e.target.value)}
        placeholder="标签（逗号分隔）"
        className="form-input"
        data-testid="card-form-tags"
      />
      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value as Priority)}
        className="form-select"
        data-testid="card-form-priority"
      >
        <option value="low">低优先级</option>
        <option value="medium">中优先级</option>
        <option value="high">高优先级</option>
      </select>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" data-testid="card-form-submit">
          {isEditing ? '保存' : '添加'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          取消
        </button>
      </div>
    </form>
  );
}
