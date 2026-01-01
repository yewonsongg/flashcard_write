import { create } from 'zustand';
import type { CardSortMode, CardSortOrder } from '@/shared/flashcards/types';

interface DeckSortSettings {
  sortMode: CardSortMode;
  sortOrder: CardSortOrder;
}

interface SearchStoreState {
  searchQueryByDeckId: Record<string, string>;
  sortSettingsByDeckId: Record<string, DeckSortSettings>;

  setSearchQuery: (deckId: string, query: string) => void;
  getSearchQuery: (deckId: string) => string;
  clearSearchQuery: (deckId: string) => void;

  setSortMode: (deckId: string, mode: CardSortMode) => void;
  setSortOrder: (deckId: string, order: CardSortOrder) => void;
  getSortSettings: (deckId: string) => DeckSortSettings;
}

const DEFAULT_SORT_SETTINGS: DeckSortSettings = {
  sortMode: 'default',
  sortOrder: 'asc',
};

export const useSearchStore = create<SearchStoreState>((set, get) => ({
  searchQueryByDeckId: {},
  sortSettingsByDeckId: {},

  setSearchQuery: (deckId, query) =>
    set((state) => ({
      searchQueryByDeckId: {
        ...state.searchQueryByDeckId,
        [deckId]: query,
      },
    })),

  getSearchQuery: (deckId) =>
    get().searchQueryByDeckId[deckId] || '',

  clearSearchQuery: (deckId) =>
    set((state) => {
      const updated = { ...state.searchQueryByDeckId };
      delete updated[deckId];
      return { searchQueryByDeckId: updated };
    }),

  setSortMode: (deckId, mode) =>
    set((state) => ({
      sortSettingsByDeckId: {
        ...state.sortSettingsByDeckId,
        [deckId]: {
          ...state.sortSettingsByDeckId[deckId],
          sortMode: mode,
        },
      },
    })),

  setSortOrder: (deckId, order) =>
    set((state) => ({
      sortSettingsByDeckId: {
        ...state.sortSettingsByDeckId,
        [deckId]: {
          ...state.sortSettingsByDeckId[deckId],
          sortOrder: order,
        },
      },
    })),

  getSortSettings: (deckId) => {
    const settings = get().sortSettingsByDeckId[deckId];
    return settings || DEFAULT_SORT_SETTINGS;
  },
}));
