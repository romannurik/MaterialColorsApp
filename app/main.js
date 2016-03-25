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
const positioner = require('electron-positioner')
const argv = require('yargs').argv;
const fs = require('fs');

const app = electron.app;
const autoUpdater = electron.autoUpdater;

const UPDATE_FEED_URL = 'http://roman-update-service.appspot.com/s/check_updates';

const DEV_MODE = argv.dev;

let mainWindow;
let mainWindowPositioner;
let trayIcon;

app.on('ready', () => {

  trayIcon = new electron.Tray(__dirname + '/assets/TrayIconTemplate.png');
  trayIcon.setToolTip(app.getName());

  mainWindow = new electron.BrowserWindow({
    width: 200,
    height: 12 * 2 /* padding */
          + 12 + 8 /* heading */
          + (32 + 2) * 14 /* 14 values */,
    resizable: false,
    skipTaskbar: true,
    movable: false,
    maximizable: false,
    fullscreenable: false,
    frame: false
  });

  mainWindow['hide']();
  mainWindow.loadURL(`file://${__dirname}/index.html`);
  mainWindow.on('closed', () => mainWindow = null);

  mainWindowPositioner = new positioner(mainWindow);

  if (DEV_MODE) {
    mainWindow.webContents.openDevTools({ detach: true });
  }

  trayIcon.on('click', function(event, bounds) {
    mainWindow[mainWindow.isVisible() ? 'hide' : 'show']();
    mainWindowPositioner.move('trayCenter', bounds);
  })

  if (!DEV_MODE) {
    checkForAppUpdates();
  }
});


app.on('window-all-closed', () => app.quit());

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
