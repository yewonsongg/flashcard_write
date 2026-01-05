import type { Database } from './types.js';

/**
 * Default database contents that ship with the app.
 * Used both to seed the on-disk JSON and as a safe fallback
 * if the file is missing or unreadable.
 */
export const DEFAULT_DATABASE: Database = {
  decks: {},
  cards: {},
};
