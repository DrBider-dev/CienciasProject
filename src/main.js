const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

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

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});