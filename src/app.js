const { menubar } = require('menubar');
const { ipcMain } = require('electron');

let url
if (process.env.NODE_ENV === 'DEV') {
  url = 'http://localhost:8080/'
} else {
  url = `file://${process.cwd()}/dist/index.html`
}
let icon = `file://${process.cwd()}/dist/favicon.png`

const mb = menubar({
  index: url,
  icon: icon,
  browserWindow: {
    webPreferences: {
      nodeIntegration: true,
    },
  },
});

mb.on('ready', () => {
  mb.on('after-create-window', () => {
    mb.window.openDevTools();
    ipcMain.on('app_mounted', (event) => {
      console.log('menubar app_mounted');
      event.reply('ready', mb); // send to renderer
    });
    console.log('app is ready');
  });
  // your app code here
});
