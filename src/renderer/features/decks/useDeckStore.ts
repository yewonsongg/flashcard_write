import { create } from 'zustand';

import { DEFAULT_DATABASE } from '@/shared/flashcards/defaultData';
import type { Database, Deck } from '@/shared/flashcards/types';

type DeleteResult = {
  previous: Database;
  updated: Database;
  deckName: string;
  cardCount: number;
};

type RenameResult = {
  previous: Database;
  updated: Database;
  deck: Deck;
}

interface DeckStoreState {
  database: Database | null;
  loadError: string | null;
  loading: boolean;

  loadDatabase: () => Promise<void>;
  renameDeck: (deckId: string, newName: string) => Promise<RenameResult | null>;
  deleteDeck: (deckId: string) => Promise<DeleteResult | null>;
  restoreDatabase: (db: Database) => Promise<void>;
  setDatabase: (db: Database) => void;
}

export const useDeckStore = create<DeckStoreState>((set, get) => ({
  database: null,
  loadError: null,
  loading: false,

  setDatabase: (db) => set({ database: db, loadError: null }),

  loadDatabase: async () => {
    set({ loading: true });
    try {
      if (!window.flashcards) {
        set({
          database: DEFAULT_DATABASE,
          loadError: 'Flashcards preload API is not available. Showing defaults.',
          loading: false,
        });
        return;
      }

      const db = await window.flashcards.loadDatabase();
      set({ database: db, loadError: null, loading: false });
    } catch (error) {
      console.error('Failed to load flashcard database', error);
      set({
        database: DEFAULT_DATABASE,
        loadError: 'Unable to load decks from disk. Showing defaults.',
        loading: false,
      });
    }
  },

  renameDeck: async (deckId, newName) => {
    const current = get().database;
    if (!current) return null;
    
    const deck = current.decks[deckId];
    if (!deck) return null;

    const trimmedName = newName.trim();
    if (!trimmedName || trimmedName === deck.name) {
      return null; 
    }

    const previous = current;
    const updatedDeck = {
      ...deck, 
      name: trimmedName,
      updatedAt: new Date().toISOString(),
    };

    const updated: Database = {
      decks: { ...current.decks, [deckId]: updatedDeck },
      cards: current.cards,
    };

    set({ database: updated });

    try {
      await window.flashcards?.saveDatabase(updated);
      window.dispatchEvent(new CustomEvent('flashcards:database-updated'));
      return { previous, updated, deck: updatedDeck };
    } catch (error) {
      console.error('Failed to save deck rename', error);
      set({ database: previous }); 
      throw error;
    }
  },

  deleteDeck: async (deckId) => {
    const current = get().database;
    if (!current) return null;

    const deck = current.decks[deckId];
    if (!deck) return null;

    const previous = current;
    const updated: Database = {
      decks: { ...current.decks },
      cards: { ...current.cards },
    };

    delete updated.decks[deckId];
    deck.cardIds.forEach((cardId) => {
      delete updated.cards[cardId];
    });

    set({ database: updated });

    try {
      await window.flashcards?.saveDatabase(updated);
      window.dispatchEvent(new CustomEvent('flashcards:database-updated'));
      return {
        previous,
        updated,
        deckName: deck.name,
        cardCount: deck.cardIds.length,
      };
    } catch (error) {
      console.error('Failed to save flashcard database after deleting deck', error);
      set({ database: previous });
      throw error;
    }
  },

  restoreDatabase: async (db) => {
    set({ database: db, loadError: null });
    try {
      await window.flashcards?.saveDatabase(db);
      window.dispatchEvent(new CustomEvent('flashcards:database-updated'));
    } catch (error) {
      console.error('Failed to restore flashcard database', error);
    }
  },
}));
