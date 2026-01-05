import { useEffect, useState, useMemo } from 'react';
import { PracticeSession } from './PracticeSession';
import { useSearchStore } from './useSearchStore';
import type { Deck, DeckCard } from '@/shared/flashcards/types';

export function PracticeView({ deck }: { deck: Deck }) {
  const [cards, setCards] = useState<DeckCard[]>([]);

  const searchQuery = useSearchStore((state) => state.getSearchQuery(deck.id));
  const sortSettings = useSearchStore((state) => state.getSortSettings(deck.id));

  // Load cards from database
  useEffect(() => {
    let cancelled = false;

    const loadCardsForDeck = async () => {
      try {
        if (window.flashcards) {
          const db = await window.flashcards.loadDatabase();
          if (cancelled) return;

          const deckInDb = db.decks[deck.id];
          const cardIds = deckInDb?.cardIds ?? deck.cardIds;
          const loadedCards = cardIds
            .map((id) => db.cards[id])
            .filter((card): card is DeckCard => Boolean(card));

          setCards(loadedCards);
          return;
        }
      } catch (error) {
        console.error('Failed to load cards for practice', error);
      }

      setCards(deck.cardIds.map((id) => ({ id, front: '', back: '' })));
    };

    loadCardsForDeck();

    const handler = () => loadCardsForDeck();
    window.addEventListener('flashcards:database-updated', handler);

    return () => {
      cancelled = true;
      window.removeEventListener('flashcards:database-updated', handler);
    };
  }, [deck.id, deck.cardIds]);

  // Filter cards based on search query
  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) {
      return cards;
    }

    const query = searchQuery.toLowerCase();
    return cards.filter((card) => {
      const frontMatch = card.front.toLowerCase().includes(query);
      const backMatch = card.back.toLowerCase().includes(query);
      return frontMatch || backMatch;
    });
  }, [cards, searchQuery]);

  // Sort filtered cards based on sort settings
  const sortedAndFilteredCards = useMemo(() => {
    const toSort = [...filteredCards];

    if (sortSettings.sortMode === 'default') {
      return toSort;
    }

    toSort.sort((a, b) => {
      let comparison = 0;

      switch (sortSettings.sortMode) {
        case 'createdDate':
          comparison = (a.createdAt || '').localeCompare(b.createdAt || '');
          break;
        case 'editedDate':
          comparison = (a.updatedAt || '').localeCompare(b.updatedAt || '');
          break;
        case 'frontText':
          comparison = a.front.localeCompare(b.front);
          break;
        case 'backText':
          comparison = a.back.localeCompare(b.back);
          break;
      }

      return sortSettings.sortOrder === 'asc' ? comparison : -comparison;
    });

    return toSort;
  }, [filteredCards, sortSettings]);

  // Extract valid card IDs from sorted and filtered cards
  const validCardIds = useMemo(() => {
    return sortedAndFilteredCards.map((card) => card.id);
  }, [sortedAndFilteredCards]);

  return <PracticeSession deck={deck} validCardIds={validCardIds} />;
}
