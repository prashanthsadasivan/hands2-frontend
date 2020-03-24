const { menubar } = require('menubar');
const { app, ipcMain, BrowserWindow } = require('electron');

let url
if (process.env.NODE_ENV === 'DEV') {
  url = 'http://localhost:8080/'
} else {
  url = `file://${process.cwd()}/dist/index.html`
}
let icon = `file://${process.cwd()}/dist/favicon.png`
function createWindow () {
  // Create the browser window.
  let win = new BrowserWindow({
    width: 400,
    height: 300,
    webPreferences: {
      nodeIntegration: true
    },
    alwaysOnTop: true,
  })
  ipcMain.on('app_mounted', (event) => {
    console.log('menubar app_mounted');
    event.reply('ready', win); // send to renderer
  });

  win.loadURL(url);

  // Open the DevTools.
  win.webContents.openDevTools()
}


app.whenReady().then(createWindow)

//const mb = menubar({
//  index: url,
//  icon: icon,
//  browserWindow: {
//    webPreferences: {
//      nodeIntegration: true,
//    },
//    alwaysOnTop: true,
//  },
//});
//
//mb.on('ready', () => {
//  mb.on('after-create-window', () => {
//    mb.window.openDevTools();
//    console.log('app is ready');
//  });
//  // your app code here
//});
