import { useEffect, useRef, useCallback } from 'react';
import { Card } from '../types';
import { saveCards } from '../utils/storage';

const DEBOUNCE_MS = 300;

export function useLocalStorage(cards: Card[]) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardsRef = useRef(cards);

  // Keep ref in sync with latest cards
  cardsRef.current = cards;

  const debouncedSave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      saveCards(cardsRef.current);
      timerRef.current = null;
    }, DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    debouncedSave();
  }, [cards, debouncedSave]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      saveCards(cardsRef.current);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        saveCards(cardsRef.current);
      }
    };
  }, []);
}
