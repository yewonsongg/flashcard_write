import { create } from 'zustand';
import { tabDefinitions } from './tabDefinitions';
import type { TabModel, TabPayloadMap, TabType } from '@/shared/tabTypes';

interface TabsState {
  tabs: TabModel[];
  activeTabId: string | null;

  openTab: <T extends TabType>(type: T, payload: TabPayloadMap[T]) => void;
  updateTabPayload: <T extends TabType>(type: T, payload: TabPayloadMap[T]) => void;
  setActiveTabId: (id: string) => void;
  closeTab: (id: string) => void;
  closeOtherTabs: (id: string) => void;
  closeAllTabs: () => void;
}

const buildTab = <T extends TabType>(type: T, payload: TabPayloadMap[T]): TabModel<T> => {
  const definition = tabDefinitions[type];
  return {
    id: definition.getId(payload),
    type,
    title: definition.getTitle(payload),
    payload,
  };
};

export const useTabsStore = create<TabsState>((set) => ({
  tabs: [],
  activeTabId: null,

  openTab: (type, payload) => {
    const nextTab = buildTab(type, payload);
    set((state) => {
      const existingIndex = state.tabs.findIndex((tab) => tab.id === nextTab.id);
      if (existingIndex !== -1) {
        const nextTabs = [...state.tabs];
        nextTabs[existingIndex] = { ...nextTabs[existingIndex], ...nextTab, payload: nextTab.payload };
        return { tabs: nextTabs, activeTabId: nextTab.id };
      }

      return {
        tabs: [...state.tabs, nextTab],
        activeTabId: nextTab.id,
      };
    });
  },

  updateTabPayload: (type, payload) => {
    const updatedTab = buildTab(type, payload);
    set((state) => ({
      tabs: state.tabs.map((tab) => tab.id === updatedTab.id ? { ...tab, ...updatedTab } : tab),
    }));
  },

  setActiveTabId: (id) => set({ activeTabId: id }),

  closeTab: (id) => {
    set((state) => {
      const { tabs, activeTabId } = state;
      const idx = tabs.findIndex((t) => t.id === id);
      if (idx === -1) {
        return state;
      }

      const nextTabs = tabs.filter((t) => t.id !== id);
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
    });
  },
}));
