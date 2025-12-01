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

// Imprimir
ipcMain.handle('print-image', async (event, dataURL) => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    webPreferences: { nodeIntegration: false, contextIsolation: true }
  });

  const html = `
    <!doctype html>
    <html>
      <head><meta charset="utf-8"/>
      <style>
        html,body{margin:0;padding:0}
        img{display:block;width:100%;height:auto}
        @page{size:auto;margin:10mm}
        body{-webkit-print-color-adjust:exact}
      </style>
      </head>
      <body><img src="${dataURL}" /></body>
    </html>
  `;

  await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));

  try {
    // 1) Intentar impresión silenciosa (predeterminada)
    const silentResult = await new Promise((resolve) => {
      win.webContents.print({ silent: true, printBackground: true }, (success, failureReason) => {
        resolve({ success, failureReason });
      });
    });

    if (silentResult.success) {
      win.destroy();
      return { status: 'printed' };
    }

    // Si la impresión silenciosa falla, intentar UNA vez la impresión con diálogo (no silenciosa).
    // Esto permite al usuario elegir impresora si silent falló por permisos/configuración.
    const nonSilentResult = await new Promise((resolve) => {
      win.webContents.print({ silent: false, printBackground: true }, (success, failureReason) => {
        resolve({ success, failureReason });
      });
    });

    if (nonSilentResult.success) {
      // Se imprimió correctamente con diálogo
      win.destroy();
      return { status: 'printed' };
    }

    // Si el usuario canceló el diálogo de impresión, failureReason suele contener 'cancel' o 'cancelled'
    const reason = (nonSilentResult.failureReason || '').toString().toLowerCase();
    if (reason.includes('cancel') || reason.includes('cancelled') || reason.includes('canceled')) {
      // El usuario canceló => no abrir diálogo de guardado a PDF, devolvemos cancelled
      win.destroy();
      return { status: 'cancelled' };
    }

    // Si llegamos aquí: la impresión silenciosa y la no silenciosa fallaron por otras razones (no cancel)
    // Generamos el PDF y pedimos guardar UNA vez.
    const pdfBuffer = await win.webContents.printToPDF({ printBackground: true });

    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Guardar captura como PDF para impresión',
      defaultPath: path.join(app.getPath('documents'), 'exportacion.pdf'),
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });

    if (!canceled && filePath) {
      await fs.writeFile(filePath, pdfBuffer);
      win.destroy();
      return { status: 'saved', filePath };
    }

    // Usuario canceló guardar PDF
    win.destroy();
    return { status: 'cancelled' };

  } catch (err) {
    console.error('Error en print-image:', err);
    try { win.destroy(); } catch (e) { }
    return { status: 'error', message: err.message || String(err) };
  }
});




app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});