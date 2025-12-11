import { contextBridge, ipcRenderer } from 'electron';
import type { Database } from '../shared/flashcards/types.js';

const flashcardsApi = {
  loadDatabase: (): Promise<Database> => ipcRenderer.invoke('flashcards:load'),
  saveDatabase: (database: Database): Promise<{ status: 'ok' }> =>
    ipcRenderer.invoke('flashcards:save', database),
  getDatabasePath: (): Promise<string> => ipcRenderer.invoke('flashcards:path'),
};

contextBridge.exposeInMainWorld('flashcards', flashcardsApi);
