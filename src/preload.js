const { contextBridge, ipcRenderer } = require('electron');

// Exponemos funciones seguras al entorno del navegador
contextBridge.exposeInMainWorld('electronAPI', {
  navigateTo: (pagePath) => ipcRenderer.send('navigate-to', pagePath),
  saveFile: (data, options) => ipcRenderer.invoke('save-file', data, options),
  openFile: (options) => ipcRenderer.invoke('open-file', options)
});
