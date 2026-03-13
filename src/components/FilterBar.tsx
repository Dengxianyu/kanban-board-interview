import { useBoardContext } from '../context/BoardContext';
import { Priority } from '../types';

const priorities: { value: Priority; label: string }[] = [
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
];

export function FilterBar() {
  const {
    filter,
    allTags,
    toggleTag,
    setPriority,
    setSearch,
    clearFilter,
    isFiltering,
  } = useBoardContext();

  return (
    <div className="filter-bar" data-testid="filter-bar">
      <div className="filter-section">
        <input
          type="text"
          value={filter.search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索卡片..."
          className="search-input"
          data-testid="search-input"
        />
      </div>

      <div className="filter-section">
        <span className="filter-label">标签：</span>
        <div className="filter-tags">
          {allTags.map((tag) => (
            <button
              key={tag}
              className={`filter-tag ${filter.tags.includes(tag) ? 'active' : ''}`}
              onClick={() => toggleTag(tag)}
              data-testid={`filter-tag-${tag}`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <span className="filter-label">优先级：</span>
        <div className="filter-priorities">
          {priorities.map((p) => (
            <button
              key={p.value}
              className={`filter-priority ${filter.priority === p.value ? 'active' : ''}`}
              onClick={() =>
                setPriority(filter.priority === p.value ? null : p.value)
              }
              data-testid={`filter-priority-${p.value}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {isFiltering && (
        <button
          className="btn btn-clear"
          onClick={clearFilter}
          data-testid="clear-filter"
        >
          清除筛选
        </button>
      )}
    </div>
  );
}
