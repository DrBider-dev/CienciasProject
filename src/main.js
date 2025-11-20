const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, // protege el entorno del renderer
      nodeIntegration: false  // evita acceso directo a Node en el frontend
    }
  });

  mainWindow.loadFile('src/Index/index.html');
}

// Escuchamos cuando el renderer (frontend) pide navegar
ipcMain.on('navigate-to', (event, pagePath) => {
  mainWindow.loadFile(pagePath);
});

// Guardar archivo
ipcMain.handle('save-file', async (event, data, options = {}) => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    filters: options.filters || [{ name: 'All Files', extensions: ['*'] }]
  });

  if (canceled || !filePath) return { success: false };

  try {
    fs.writeFileSync(filePath, data, 'utf-8');
    return { success: true };
  } catch (e) {
    console.error('Error saving file:', e);
    return { success: false, error: e.message };
  }
});

// Abrir archivo
ipcMain.handle('open-file', async (event, options = {}) => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: options.filters || [{ name: 'All Files', extensions: ['*'] }]
  });

  if (canceled || filePaths.length === 0) return { success: false };

  try {
    const content = fs.readFileSync(filePaths[0], 'utf-8');
    return { success: true, content };
  } catch (e) {
    console.error('Error reading file:', e);
    return { success: false, error: e.message };
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});