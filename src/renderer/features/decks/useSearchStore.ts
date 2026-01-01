import { create } from 'zustand';

interface SearchStoreState {
  searchQueryByDeckId: Record<string, string>;
  setSearchQuery: (deckId: string, query: string) => void;
  getSearchQuery: (deckId: string) => string;
  clearSearchQuery: (deckId: string) => void;
}

export const useSearchStore = create<SearchStoreState>((set, get) => ({
  searchQueryByDeckId: {},

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
}));
