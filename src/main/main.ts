import { app, BrowserWindow } from 'electron';
import { createLogger } from '../shared/logger.js';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

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
    // prod: load built renderer
    const indexHtml = join(__dirname, '../renderer/index.html');
    await mainWindow.loadFile(indexHtml);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady()
  .then(async () => {
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