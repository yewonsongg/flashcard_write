import type { Database } from './types.js';

/**
 * Default database contents that ship with the app.
 * Used both to seed the on-disk JSON and as a safe fallback
 * if the file is missing or unreadable.
 */
export const DEFAULT_DATABASE: Database = {
  decks: {
    deck_1: {
      id: 'deck_1',
      name: 'French',
      cardIds: ['card_1', 'card_2'],
      pinned: false,
      createdAt: '2025-01-01T12:00:00.000Z',
      updatedAt: '2025-01-02T12:00:00.000Z',
      lastOpenedAt: '2025-01-03T12:00:00.000Z',
    },
    deck_2: {
      id: 'deck_2',
      name: 'Biology',
      cardIds: [],
      pinned: false,
      createdAt: '2025-01-04T12:00:00.000Z',
      updatedAt: '2025-01-04T12:00:00.000Z',
      lastOpenedAt: '2025-01-04T12:00:00.000Z',
    },
    deck_3: {
      id: 'deck_3',
      name: 'Korean',
      cardIds: [],
      pinned: false,
      createdAt: '2025-01-05T12:00:00.000Z',
      updatedAt: '2025-01-05T12:00:00.000Z',
      lastOpenedAt: '2025-01-05T12:00:00.000Z',
    },
    deck_4: {
      id: 'deck_4',
      name: 'Neuroscience',
      cardIds: [],
      pinned: false,
      createdAt: '2025-01-06T12:00:00.000Z',
      updatedAt: '2025-01-06T12:00:00.000Z',
      lastOpenedAt: '2025-01-06T12:00:00.000Z',
    },
    deck_5: {
      id: 'deck_5',
      name: 'Chemistry',
      cardIds: [],
      pinned: false,
      createdAt: '2025-01-07T12:00:00.000Z',
      updatedAt: '2025-01-07T12:00:00.000Z',
      lastOpenedAt: '2025-01-07T12:00:00.000Z',
    },
    deck_6: {
      id: 'deck_6',
      name: 'Calculus',
      cardIds: [],
      pinned: false,
      createdAt: '2025-01-08T12:00:00.000Z',
      updatedAt: '2025-01-08T12:00:00.000Z',
      lastOpenedAt: '2025-01-08T12:00:00.000Z',
    },
    deck_7: {
      id: 'deck_7',
      name: '6 7',
      cardIds: [],
      pinned: false,
      createdAt: '2025-01-09T12:00:00.000Z',
      updatedAt: '2025-01-09T12:00:00.000Z',
      lastOpenedAt: '2025-01-09T12:00:00.000Z',
    },
    deck_8: {
      id: 'deck_8',
      name: 'Skibidi',
      cardIds: [],
      pinned: false,
      createdAt: '2025-01-10T12:00:00.000Z',
      updatedAt: '2025-01-10T12:00:00.000Z',
      lastOpenedAt: '2025-01-10T12:00:00.000Z',
    },
  },
  cards: {
    card_1: {
      id: 'card_1',
      front: 'bonjour',
      back: 'hello',
    },
    card_2: {
      id: 'card_2',
      front: 'au revoir',
      back: 'goodbye',
    },
  },
};
