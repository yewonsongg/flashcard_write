import type { ReactNode } from 'react';
import type { Deck } from './flashcards/types.js';

export type TabType = 'deck' | 'practice';

export type TabPayloadMap = {
  deck: Deck;
  practice: Deck;
};

export type TabModel<T extends TabType = TabType> = {
  id: string;
  type: T;
  title: string;
  payload: TabPayloadMap[T];
};

export type TabDefinition<T extends TabType = TabType> = {
  type: T;
  getId: (payload: TabPayloadMap[T]) => string;
  getTitle: (payload: TabPayloadMap[T]) => string;
};

export type TabRegistry = {
  [K in TabType]: TabDefinition<K>;
};

export type TabRenderer<T extends TabType = TabType> = (tab: TabModel<T>) => ReactNode;

export type TabRendererRegistry = {
  [K in TabType]: TabRenderer<K>;
};
