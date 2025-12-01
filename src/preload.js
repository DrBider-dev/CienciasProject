const { contextBridge, ipcRenderer } = require('electron');

// API solo para funciones IPC
contextBridge.exposeInMainWorld('electronAPI', {
  navigateTo: (pagePath) => ipcRenderer.send('navigate-to', pagePath),
  saveFile: (data, options) => ipcRenderer.invoke('save-file', data, options),
  openFile: (options) => ipcRenderer.invoke('open-file', options),
  printImage: (dataURL) => ipcRenderer.invoke('print-image', dataURL),
});
