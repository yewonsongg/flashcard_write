export interface Deck {
  id: string;
  name: string;
  cardIds: string[];
  pinned: boolean;

  createdAt: string;      // ISO timestamp
  updatedAt: string;      // for "last modified" sort
  lastOpenedAt: string;   // for "last opened" sort
}

export interface DeckTab {
  id: string;
  deck: Deck;
  isPreview?: boolean;
}

export interface Card {
  id: string;
  front: string;
  back: string;
}

export interface Database {
  decks: Record<string, Deck>;
  cards: Record<string, Card>;
}

export type SortMode = 'name' | 'cardCount' | 'lastOpened' | 'lastModified';

export type SortOrder = 'asc' | 'desc';