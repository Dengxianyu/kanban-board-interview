import { useEffect, useRef, useCallback } from 'react';
import { Card } from '../types';
import { saveCards } from '../utils/storage';

const DEBOUNCE_MS = 300;

export function useLocalStorage(cards: Card[]) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedSave = useCallback((cardsToSave: Card[]) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      saveCards(cardsToSave);
      timerRef.current = null;
    }, DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    debouncedSave(cards);
  }, [cards, debouncedSave]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      saveCards(cards);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        saveCards(cards);
      }
    };
  }, []);
}
