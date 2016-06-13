/*
 * Copyright 2016 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const electron = require('electron');
const argv = require('yargs').argv;
const fs = require('fs');

const app = electron.app;
const autoUpdater = electron.autoUpdater;

const UPDATE_FEED_URL = 'http://roman-update-service.appspot.com/s/check_updates';

const DEV_MODE = argv.dev;

const IS_MAC = process.platform == 'darwin';


let isTrayMode = true;
let mainWindow;
let trayIcon;


let shouldQuit = app.makeSingleInstance(() => {
  mainWindow.show();
  mainWindow.focus();
});


if (shouldQuit) {
  app.quit();
  return;
}


app.on('ready', () => {
  mainWindow = new electron.BrowserWindow({
    backgroundColor: '#fff',
    width: 200,
    height: 12 * 2 /* padding */
          + 12 + 8 /* heading */
          + (32 + 2) * 14 /* 14 values */,
    resizable: false,
    skipTaskbar: true,
    maximizable: false,
    fullscreenable: false,
    frame: false
  });

  mainWindow.loadURL(`file://${__dirname}/index.html`);
  mainWindow.showInactive();
  updateUiMode();

  if (DEV_MODE) {
    mainWindow.webContents.openDevTools({ detach: true });
  }

  mainWindow.on('show', () => updateUiMode());
  mainWindow.on('hide', () => updateUiMode());
  mainWindow.on('closed', () => mainWindow = null);

  if (!DEV_MODE) {
    checkForAppUpdates();
  }
});


app.on('window-all-closed', () => app.quit());


app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
  if (!mainWindow.isVisible()) {
    mainWindow.show();
    mainWindow.focus();
  }
});


electron.ipcMain.on('update-ui-mode', updateUiMode);


electron.ipcMain.on('get-home-directory', event => event.returnValue = app.getPath('home'));


function updateUiMode() {
  // Build or teardown tray
  if (isTrayMode) {
    if (!trayIcon) {
      trayIcon = new electron.Tray(__dirname + '/assets/TrayIconTemplate.png');
      trayIcon.setToolTip(app.getName());
      trayIcon.on('right-click', () => {
        mainWindow[mainWindow.isVisible() ? 'hide' : 'show']();
      });
    }
  } else if (trayIcon) {
    trayIcon.destroy();
    trayIcon = null;
  }

  // Build or teardown dock
  if (IS_MAC && app.dock) {
    if (!isTrayMode) {
      app.dock.show();
    } else {
      app.dock.hide();
    }
  }

  // Update menu
  const {HELP_MENU, EDIT_MENU, WINDOW_MENU, SEPARATOR_MENU_ITEM} = require('./standard-menus.js');

  const showHideMenuItem = {
    label: mainWindow.isVisible() ? 'Hide Colors' : 'Show Colors',
    accelerator: 'Command+H',
    click: () => {
      mainWindow[mainWindow.isVisible() ? 'hide' : 'show']();
      updateUiMode();
    }
  };

  const switchModeMacMenuItem = {
    label: isTrayMode ? 'Switch to Normal App Mode' : 'Switch to Menu Bar Mode',
    click: () => {
      isTrayMode = !isTrayMode;
      updateUiMode();
    }
  };

  const aboutMacMenuItem = {
    label: 'About ' + app.getName(),
    role: 'about'
  };

  const quitMenuItem = {
    label: 'Quit',
    accelerator: 'Command+Q',
    click: () => app.quit()
  };

  if (isTrayMode) {
    mainWindow.setAlwaysOnTop(true);
    trayIcon.setContextMenu(electron.Menu.buildFromTemplate([]
        .concat([showHideMenuItem])
        .concat(IS_MAC ? [switchModeMacMenuItem] : [])
        .concat([SEPARATOR_MENU_ITEM])
        .concat(IS_MAC ? [aboutMacMenuItem] : [])
        .concat([quitMenuItem])));

  } else {
    mainWindow.setAlwaysOnTop(false);
  }

  if (IS_MAC) {
    app.dock.setMenu(electron.Menu.buildFromTemplate([
      switchModeMacMenuItem,
      aboutMacMenuItem
    ]));

    // build the app menu
    electron.Menu.setApplicationMenu(electron.Menu.buildFromTemplate([]
        .concat([
          {
            label: 'app', // automatically set to title
            submenu: [
              showHideMenuItem,
              switchModeMacMenuItem,
              SEPARATOR_MENU_ITEM,
              aboutMacMenuItem,
              quitMenuItem
            ]
          },
          EDIT_MENU,
          WINDOW_MENU,
          HELP_MENU])));
  }

  writePrefs();
}


function readPrefs() {
  try {
    let prefStr = fs.readFileSync(app.getPath('userData') + '/prefs.json');
    if (prefStr) {
      let json = JSON.parse(prefStr);
      isTrayMode = !!json.isTrayMode;
    }
  } catch (e) {}
}


function writePrefs() {
  fs.writeFileSync(app.getPath('userData') + '/prefs.json', JSON.stringify({
    isTrayMode: isTrayMode
  }));
}


function checkForAppUpdates() {
  let packageInfo = require('./package.json');

  let query = {
    version: app.getVersion(),
    bundleId: packageInfo.appBundleId
  };

  let qs = Object.keys(query)
      .map(k => k + '=' + encodeURIComponent(query[k]))
      .join('&');

  autoUpdater.setFeedURL(UPDATE_FEED_URL + '?' + qs);
  autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName, releaseDate, updateURL) => {
    mainWindow.webContents.send('update-downloaded', releaseName);
    electron.ipcMain.on('install-update', () => autoUpdater.quitAndInstall());
  });
  autoUpdater.on('error', error => {
    console.error('Error updating: ' + error);
    // electron.dialog.showErrorBox('error', error.toString());
  });
  autoUpdater.checkForUpdates();
}


readPrefs();
