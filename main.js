const {
  app, Tray, Menu, BrowserWindow, ipcMain,
} = require('electron');
const path = require('path');
const {
  reset, get, rm, add,
} = require('./dns');

let trayItem = null;
let promptWindow = null;

// bootstrap the menu
const main = () => get()
  .then(buildMenuFromDNS)
  .then(menu => trayItem.setContextMenu(menu));

/* menu items */

const promptHtml = `
  <input id="val" type="text" placeholder="#.#.#.#"></input>
  <button
    onclick="require('electron').ipcRenderer.send('prompt-response', document.getElementById('val').value);window.close()"
  >
    Add
  </button>
`;

const menuAdd = {
  label: 'Add',
  click() {
    promptWindow = new BrowserWindow({
      width: 200,
      height: 50,
      backgroundColor: '#D6D8DC',
      show: false,
    });
    promptWindow.loadURL(`data:text/html,${promptHtml}`);
    promptWindow.once('ready-to-show', () => {
      promptWindow.show();
    });
    // add listener for prompt input
    ipcMain.on('prompt-response', (event, ip) => {
      add(ip).then(main);
      // tear down prompt window safely
      promptWindow = null;
    });
  },
};

const menuReset = {
  label: 'Reset to OS defaults',
  click() {
    reset().then(main);
  },
};

const menuQuit = {
  label: 'Quit',
  accelerator: 'CommandOrControl+Q',
  selector: 'terminate:',
  click() {
    app.quit();
    app.exit();
  },
};

const buildMenuFromDNS = ips => Menu.buildFromTemplate([
  ...ips
    .map(ip => ({
      label: `remove ${ip}`,
      click() {
        rm(ip).then(main);
      },
    })),
  menuAdd,
  menuReset,
  menuQuit,
]);

app.on('ready', () => {
  // keep one window open so that the app doesn't quit when the add promptcloses
  new BrowserWindow({ show: false });
  // instantiate the tray item
  trayItem = new Tray(path.join(__dirname, 'icon.png'));
  trayItem.setToolTip('View your DNS Server(s)');
  // bootstrap the logic
  main();
});

app.on('quit', () => {
  app.quit();
  app.exit();
});

