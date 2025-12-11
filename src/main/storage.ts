import { app } from 'electron';
import { promises as fs } from 'node:fs';
import { dirname, join } from 'node:path';

import { createLogger } from '../shared/logger.js';
import { DEFAULT_DATABASE } from '../shared/flashcards/defaultData.js';
import type { Database } from '../shared/flashcards/types.js';

const log = createLogger({ context: 'main:storage' });
const DATA_FILE_NAME = 'flashcards.json';

export function getDatabaseFilePath(): string {
  return join(app.getPath('userData'), DATA_FILE_NAME);
}

async function ensureFileExists(filePath: string): Promise<void> {
  try {
    await fs.access(filePath);
  } catch {
    await fs.mkdir(dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(DEFAULT_DATABASE, null, 2), 'utf8');
    log.info(`Created flashcard database at ${filePath}`);
  }
}

export async function loadDatabase(): Promise<Database> {
  const filePath = getDatabaseFilePath();
  await ensureFileExists(filePath);

  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw) as Database;

    // minimal shape validation
    if (!parsed || typeof parsed !== 'object' || !('decks' in parsed) || !('cards' in parsed)) {
      throw new Error('Invalid flashcard database shape');
    }

    return parsed;
  } catch (error) {
    log.warn('Failed to read flashcard database; restoring defaults', error);
    await saveDatabase(DEFAULT_DATABASE);
    return DEFAULT_DATABASE;
  }
}

export async function saveDatabase(database: Database): Promise<void> {
  const filePath = getDatabaseFilePath();
  await fs.mkdir(dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(database, null, 2), 'utf8');
  log.debug(`Saved flashcard database to ${filePath}`);
}
