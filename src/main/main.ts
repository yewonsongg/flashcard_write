import { app, BrowserWindow, ipcMain } from 'electron';
import { createLogger } from '../shared/logger.js';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDatabaseFilePath, loadDatabase, saveDatabase } from './storage.js';
import type { Database } from '../shared/flashcards/types.js';

const log = createLogger({ context: 'main' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  log.info('Creating main window');

  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    webPreferences: {
      preload: join(__dirname, '../preload/preload/index.js')
    }
  });

  if(!app.isPackaged) {
    // dev: load vite dev server
    await mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // prod: load built renderer (Vite output)
    const indexHtml = join(__dirname, '../../dist/renderer/index.html');
    await mainWindow.loadFile(indexHtml);
  }


  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function registerIpcHandlers() {
  ipcMain.handle('flashcards:load', async () => {
    try {
      return await loadDatabase();
    } catch (error) {
      log.error('Failed to load flashcard database', error);
      throw error;
    }
  });

  ipcMain.handle('flashcards:save', async (_event, database: Database) => {
    try {
      await saveDatabase(database);
      return { status: 'ok' as const };
    } catch (error) {
      log.error('Failed to save flashcard database', error);
      throw error;
    }
  });

  ipcMain.handle('flashcards:path', () => getDatabaseFilePath());
}

app.whenReady()
  .then(async () => {
    await loadDatabase(); // ensure the file exists before the renderer asks for it
    registerIpcHandlers();
    await createWindow();
  });

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
