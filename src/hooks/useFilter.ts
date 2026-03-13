import { useState, useMemo, useCallback } from 'react';
import { Card, FilterState, Priority } from '../types';

const initialFilter: FilterState = {
  tags: [],
  priority: null,
  search: '',
};

export function useFilter(cards: Card[]) {
  const [filter, setFilter] = useState<FilterState>(initialFilter);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    cards.forEach((card) => card.tags.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [cards]);

  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      if (filter.tags.length > 0) {
        if (!filter.tags.some((tag) => card.tags.includes(tag))) {
          return false;
        }
      }
      if (filter.priority && card.priority !== filter.priority) {
        return false;
      }
      if (filter.search) {
        const q = filter.search.toLowerCase();
        if (
          !card.title.toLowerCase().includes(q) &&
          !card.description.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [cards, filter]);

  const toggleTag = useCallback((tag: string) => {
    setFilter((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  }, []);

  const setPriority = useCallback((priority: Priority | null) => {
    setFilter((prev) => ({ ...prev, priority }));
  }, []);

  const setSearch = useCallback((search: string) => {
    setFilter((prev) => ({ ...prev, search }));
  }, []);

  const clearFilter = useCallback(() => {
    setFilter(initialFilter);
  }, []);

  const isFiltering = filter.tags.length > 0 || filter.priority !== null || filter.search !== '';

  return {
    filter,
    filteredCards,
    allTags,
    toggleTag,
    setPriority,
    setSearch,
    clearFilter,
    isFiltering,
  };
}
