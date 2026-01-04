export interface Deck {
  id: string;
  name: string;
  cardIds: string[];
  pinned: boolean;

  createdAt: string;      // ISO timestamp
  updatedAt: string;      // for "last modified" sort
  lastOpenedAt: string;   // for "last opened" sort
}

export interface DeckCard {
  id: string;
  front: string;
  back: string;
  createdAt?: string;     // ISO timestamp (optional for backward compatibility)
  updatedAt?: string;     // ISO timestamp (optional for backward compatibility)
  stats?: {
    correctCount: number
    incorrectCount: number
    lastPracticedA?: string
  }
}

export interface Database {
  decks: Record<string, Deck>;
  cards: Record<string, DeckCard>;
}

export type SortMode = 'name' | 'cardCount' | 'lastOpened' | 'lastModified';

export type SortOrder = 'asc' | 'desc';

export type CardSortMode = 'createdDate' | 'editedDate' | 'frontText' | 'backText' | 'default';

export type CardSortOrder = 'asc' | 'desc';
