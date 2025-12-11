import type { Database } from '../shared/flashcards/types';

declare global {
  interface Window {
    flashcards?: {
      loadDatabase: () => Promise<Database>;
      saveDatabase: (database: Database) => Promise<{ status: 'ok' } | void>;
      getDatabasePath?: () => Promise<string>;
    };
  }
}

export {};
