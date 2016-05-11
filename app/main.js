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

const IS_IOS = process.platform == 'darwin';

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


function updateUiMode() {
  // Build or teardown tray
  if (isTrayMode) {
    if (!trayIcon) {
      trayIcon = new electron.Tray(__dirname + '/assets/TrayIconTemplate.png');
      trayIcon.setToolTip(app.getName());
    }
  } else if (trayIcon) {
    trayIcon.destroy();
    trayIcon = null;
  }

  // Build or teardown dock
  if (app.dock) {
    if (!isTrayMode) {
      app.dock.show();
    } else {
      app.dock.hide();
    }
  }

  // Update menu
  var menuItems = [];

  if (isTrayMode) {
    menuItems.push({
      label: mainWindow.isVisible() ? 'Hide Colors' : 'Show Colors',
      click: () => {
        mainWindow[mainWindow.isVisible() ? 'hide' : 'show']();
        updateUiMode();
      }
    });
  }

  if (IS_IOS) {
    menuItems.push({
      label: isTrayMode ? 'Switch to Normal App Mode' : 'Switch to Menu Bar Mode',
      click: () => {
        isTrayMode = !isTrayMode;
        updateUiMode();
      }
    });
  }

  menuItems.push({ type: 'separator' });
  if (IS_IOS) {
    menuItems.push({label: 'About ' + app.getName(), role: 'about'});
  }

  if (isTrayMode) {
    menuItems.push({ label: 'Quit', click: () => app.quit() });
  }

  var contextMenu = electron.Menu.buildFromTemplate(menuItems);

  if (isTrayMode) {
    trayIcon.setContextMenu(contextMenu);
    mainWindow.setAlwaysOnTop(true);
  } else {
    app.dock.setMenu(contextMenu);
    mainWindow.setAlwaysOnTop(false);
  }

  //electron.Menu.setApplicationMenu(contextMenu);
  writePrefs();
}


function readPrefs() {
  try {
    var prefStr = fs.readFileSync(app.getPath('userData') + '/prefs.json');
    if (prefStr) {
      var json = JSON.parse(prefStr);
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
