import { useBoardContext } from '../context/BoardContext';
import { clearCards } from '../utils/storage';

export function Toolbar() {
  const { cards } = useBoardContext();

  const handleReset = () => {
    if (window.confirm('确定要重置看板吗？所有数据将被清除。')) {
      clearCards();
      window.location.reload();
    }
  };

  return (
    <div className="toolbar" data-testid="toolbar">
      <h1 className="app-title">📋 看板</h1>
      <div className="toolbar-info">
        <span className="card-count">共 {cards.length} 张卡片</span>
        <button className="btn btn-danger" onClick={handleReset}>
          重置看板
        </button>
      </div>
    </div>
  );
}
