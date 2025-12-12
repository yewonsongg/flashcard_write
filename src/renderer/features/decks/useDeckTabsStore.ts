import { create } from 'zustand';
import { DeckTab, Deck } from '@/shared/flashcards/types';

interface DeckTabsState {
  tabs: DeckTab[];
  activeTabId: string | null;

  openDeckInTab: (deck: Deck) => void;
  setActiveTabId: (id: string) => void;
  closeTab: (id: string) => void;
  closeOtherTabs: (id: string) => void;
  closeAllTabs: () => void;
  refreshDeck: (deck: Deck) => void;
}

export const useDeckTabsStore = create<DeckTabsState>((set, get) => ({
  tabs: [],
  activeTabId: null,

  setActiveTabId: (id) => {
    set({ activeTabId: id});
  },

  openDeckInTab: (deck) => {
    set((state) => {
      const existing = state.tabs.find((t) => t.id === deck.id);
      if (existing) { return { ...state, activeTabId: existing.id, };}
      const newTab: DeckTab = { id: deck.id, deck, };
      return {
        tabs: [...state.tabs, newTab],
        activeTabId: newTab.id, 
      };
    });
  },

  closeTab: (id) => {
    set((state) => {
      const { tabs, activeTabId } = state;
      const idx = tabs.findIndex((t) => t.id === id);
      if (idx === -1) {
        return state;
      }
      const nextTabs = tabs.filter((t) => t.id !== id);
      // if we closed the active tab, pick a neighbor or null
      let nextActiveId = activeTabId;
      if (activeTabId === id) {
        const neighbor = nextTabs[idx] || nextTabs[idx - 1] || null;
        nextActiveId = neighbor ? neighbor.id : null;
      }

      return {
        tabs: nextTabs,
        activeTabId: nextActiveId,
      };
    });
  },

  closeOtherTabs: (id) => {
    set((state) => {
      const keep = state.tabs.find((t) => t.id === id);
      if (!keep) { return state; }
      return { 
        tabs: [keep],
        activeTabId: keep.id,
      };
    });
  },

  closeAllTabs: () => {
    set({
      tabs: [],
      activeTabId: null,
    })
  },

  refreshDeck: (deck) => {
    set((state) => ({
      tabs: state.tabs.map((t) => t.id === deck.id ? { ...t, deck } : t),
    }));
  }
}))
