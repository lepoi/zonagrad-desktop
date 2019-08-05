const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

const path = require('path');
const isDev = require('electron-is-dev');
// const config = window.require('electron-config');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    show: false,
    width: 1366,
    height: 768,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      preload: __dirname + '/preload.js'
    }
  });
  
  mainWindow.loadURL(isDev ?
    'http://localhost:3000' :
    `file://${path.join(__dirname, '../build/index.html')}`
  );
  
  mainWindow.on('closed', _ => mainWindow = null);
  mainWindow.on('ready-to-show', _ => mainWindow.show())
  // if (isDev) {
    // Open the DevTools.
    //BrowserWindow.addDevToolsExtension('<location to your react chrome extension>');
    mainWindow.webContents.openDevTools();
  // }
}


app.on('ready', createWindow);

app.on('browser-window-created', (_, window) => {
  window.setMenu(null);
  window.maximize();
});

app.on('window-all-closed', _ => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', _ => {
  if (mainWindow === null) {
    createWindow();
  }
});
