import { useBoardContext } from '../context/BoardContext';
import { Column } from './Column';

export function Board() {
  const { columns } = useBoardContext();

  return (
    <div className="kanban-board" data-testid="board">
      {columns.map((column) => (
        <Column key={column.id} column={column} />
      ))}
    </div>
  );
}
