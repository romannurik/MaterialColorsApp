/*
 * Copyright 2018 Google Inc.
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

const EventEmitter = require('events');
const electron = require('electron');
const electronPositioner = require('electron-positioner');
const argv = require('yargs').argv;
const fs = require('fs');
const {app, autoUpdater, systemPreferences, Menu} = electron;

const {UPDATE_FEED_URL} = require('./config');
const DEV_MODE = argv.dev;
const IS_MAC = process.platform == 'darwin';

const COLORS = require('./colors.js');


const UI_MODES = {
  TRAY: 'tray',
  TRAY_ATTACHED: 'tray-attached',
  NORMAL: 'normal'
};

let uiMode = IS_MAC ? null : UI_MODES.TRAY;
let mainWindow;
let mainWindowPositioner;
let trayIcon;
let trayMenu;
let openAtLogin;

const eventBus = new EventEmitter();

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    mainWindow.show();
    mainWindow.focus();
    eventBus.emit('show-hide');
  });
}


app.on('ready', () => {
  // this setting doesn't seem to change instantly, so don't rely on it
  // for showing the checkbox state in the menu
  openAtLogin = !!app.getLoginItemSettings().openAtLogin;

  readPrefs();
  setupUiMode(uiMode, {firstRun: true});
  if (!DEV_MODE) {
    try {
      checkForAppUpdates();
    } catch (e){
      console.error(e);
    }
  }
});


app.on('window-all-closed', () => {
  app.quit();
});


app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (!mainWindow) {
    setupUiMode(uiMode);
  }
  if (mainWindow && !mainWindow.isVisible()) {
    mainWindow.show();
    mainWindow.focus();
  }
});

if(IS_MAC) {
  systemPreferences.subscribeNotification(
      'AppleInterfaceThemeChangedNotification',
      () => updateMainWindowDarkMode());
}

electron.ipcMain.on('on-hide', () => eventBus.emit('show-hide'));

electron.ipcMain.on('show-overflow-menu', () => {
  trayMenu.popup();
});


electron.ipcMain.on('get-home-directory', event => event.returnValue = app.getPath('home'));


eventBus.on('show-hide', () => {
  setupMenus();

  if (trayIcon && uiMode == UI_MODES.TRAY_ATTACHED) {
    trayIcon.setHighlightMode(isVisible() ? 'always' : 'never');
  }
});


function updateMainWindowDarkMode() {
  if (!mainWindow) {
    return;
  }

  let darkMode = systemPreferences.isDarkMode();
  mainWindow.webContents.send('dark-mode-updated', darkMode);
  mainWindow.setBackgroundColor(darkMode ? '#3c3c3c' : '#fff');
}


function setupUiMode(newUiMode, {fromUser, firstRun} = {}) {
  uiMode = newUiMode;

  setupMainWindow({firstRun});
  setupTray();
  setupDock();
  setupMenus();

  if (fromUser) {
    writePrefs();
  }
}


function computeMainWindowHeight() {
  const SIDEBAR_VERT_PADDING = 8;
  const SIDEBAR_HUE_MIN_HEIGHT = 22;
  const SIDEBAR_SEARCH_MIN_HEIGHT = 22;
  const SIDEBAR_SEPARATOR_HEIGHT = 17;

  let numColors = Object.keys(COLORS).length;
  let numSeparators = Object.values(COLORS).filter(({_startGroup}) => !!_startGroup).length;

  let sidebarMinHeight = SIDEBAR_VERT_PADDING * 2 +
      + SIDEBAR_SEARCH_MIN_HEIGHT
      + SIDEBAR_HUE_MIN_HEIGHT * numColors
      + SIDEBAR_SEPARATOR_HEIGHT * numSeparators;

  const MAIN_VERT_PADDING = 12;
  const HEADING_HEIGHT = 12 + 8; // with padding
  const VALUE_HEIGHT = 32 + 2; // with padding
  const NUM_VALUES = 14; // usually 14 total values

  let mainMinHeight = MAIN_VERT_PADDING * 2
      + HEADING_HEIGHT
      + VALUE_HEIGHT * NUM_VALUES;

  return Math.max(mainMinHeight, sidebarMinHeight);
}


function setupMainWindow({firstRun}) {
  if (!mainWindow) {
    mainWindow = new electron.BrowserWindow({
      transparent: true,
      width: 200,
      height: computeMainWindowHeight(),
      resizable: false,
      skipTaskbar: true,
      maximizable: false,
      fullscreenable: false,
      frame: false,
      webPreferences: {
        nodeIntegration: true,
      }
    });

    updateMainWindowDarkMode();

    if (uiMode == UI_MODES.NORMAL) {
      mainWindow.show();
    } else {
      // when starting in tray mode, don't show it
      if (firstRun) {
        mainWindow.hide();
      }
    }

    mainWindow.on('show', () => eventBus.emit('show-hide'));
    mainWindow.on('hide', () => eventBus.emit('show-hide'));
    mainWindow.on('blur', () => {
      if (uiMode == UI_MODES.TRAY_ATTACHED) {
        toggleVisibility(false)
      }
    });
    mainWindow.on('closed', () => app.quit());

    mainWindowPositioner = new electronPositioner(mainWindow);

    if (DEV_MODE) {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
      // triggers blur, which hides the window in tray-attached mode
    }
  }

  let darkMode = systemPreferences.isDarkMode();
  mainWindow.setAlwaysOnTop(uiMode == UI_MODES.TRAY || uiMode == UI_MODES.TRAY_ATTACHED);
  mainWindow.loadURL(`file://${__dirname}/index.html?uiMode=${uiMode}&darkMode=${darkMode}`);
  mainWindow.setMovable(uiMode != UI_MODES.TRAY_ATTACHED);
}


function setupTray() {
  // first tear it down
  if (trayIcon) {
    trayIcon.destroy();
    trayIcon = null;
  }

  if (uiMode != UI_MODES.TRAY && uiMode != UI_MODES.TRAY_ATTACHED) {
    return;
  }

  trayIcon = new electron.Tray(__dirname + '/assets/TrayIconTemplate.png');
  trayIcon.setToolTip(app.getName());
  if (uiMode == UI_MODES.TRAY_ATTACHED) {
    trayIcon.on('click', (evt, trayBounds) => {
      toggleVisibility();
      mainWindowPositioner.move('trayCenter', trayBounds);
    });
    trayIcon.on('right-click', () => {
      trayIcon.popUpContextMenu(trayMenu);
    });

    // position main window to bounds
    let trayBounds = trayIcon.getBounds();
    mainWindowPositioner.move('trayCenter', trayBounds);
  } else if (uiMode == UI_MODES.TRAY) {
    // click to be set later as part of menu setup
    if(IS_MAC) {
      trayIcon.on('right-click', () => {
        toggleVisibility();
      });
    } else {
      trayIcon.on('click', () => {
        toggleVisibility();
      });
    }
  }
}


function setupDock() {
  if (!IS_MAC || !app.dock) {
    return;
  }

  if (uiMode == UI_MODES.NORMAL) {
    app.dock.show();
  } else {
    app.dock.hide();
  }
}


function setupMenus() {
  if (!mainWindow) {
    return;
  }

  const {HELP_MENU, EDIT_MENU, WINDOW_MENU, SEPARATOR_MENU_ITEM} = require('./standard-menus.js');

  const showHideMenuItem = {
    label: isVisible() ? 'Hide Colors' : 'Show Colors',
    accelerator: 'Command+H',
    click: () => {
      toggleVisibility();
    }
  };

  const switchModeMacMenuItem = {
    label: 'App Mode',
    submenu: [
      {
        label: 'Normal',
        type: 'checkbox',
        checked: uiMode == UI_MODES.NORMAL,
        click: () => setupUiMode(UI_MODES.NORMAL, {fromUser: true}),
      },
      {
        label: 'Menu Bar',
        type: 'checkbox',
        checked: uiMode == UI_MODES.TRAY,
        click: () => setupUiMode(UI_MODES.TRAY, {fromUser: true}),
      },
      {
        label: 'Menu Bar (Attached)',
        type: 'checkbox',
        checked: uiMode == UI_MODES.TRAY_ATTACHED,
        click: () => setupUiMode(UI_MODES.TRAY_ATTACHED, {fromUser: true}),
      },
    ]
  };

  const openAtLoginMenuItem = {
    label: 'Open at Login',
    type: 'checkbox',
    checked: openAtLogin,
    click: () => {
      openAtLogin = !openAtLogin;

      // TODO: if the user chooses Options > Open at Login in the dock
      // we don't have a chance to update the custom app menus :-/
      app.setLoginItemSettings({
        openAtLogin,
        openAsHidden: true
      });
      setupMenus();
    },
  };

  const aboutMacMenuItem = {
    label: 'About ' + app.getName(),
    role: 'about'
  };

  const quitMenuItem = {
    label: 'Quit',
    accelerator: 'Command+Q',
    click: () => app.quit(),
  };
  
  if (uiMode == UI_MODES.TRAY || uiMode == UI_MODES.TRAY_ATTACHED) {
    trayMenu = Menu.buildFromTemplate([
        showHideMenuItem,
        ...(IS_MAC ? [switchModeMacMenuItem] : []),
        SEPARATOR_MENU_ITEM,
        openAtLoginMenuItem,
        ...(IS_MAC ? [aboutMacMenuItem] : []),
        quitMenuItem]);
    if (uiMode == UI_MODES.TRAY) {
      trayIcon.setContextMenu(trayMenu);
    }
  }

  if (IS_MAC) {
    app.dock.setMenu(Menu.buildFromTemplate([
      switchModeMacMenuItem,
      aboutMacMenuItem
    ]));

    // build the app menu
    Menu.setApplicationMenu(Menu.buildFromTemplate([
        {
          label: 'app', // automatically set to title
          submenu: [
            showHideMenuItem,
            switchModeMacMenuItem,
            SEPARATOR_MENU_ITEM,
            openAtLoginMenuItem,
            aboutMacMenuItem,
            quitMenuItem
          ]
        },
        EDIT_MENU,
        WINDOW_MENU,
        HELP_MENU]));
  }
}


function readPrefs() {
  uiMode = IS_MAC ? UI_MODES.NORMAL : UI_MODES.TRAY;
  try {
    let prefStr = fs.readFileSync(app.getPath('userData') + '/prefs.json');
    if (prefStr) {
      let prefs = JSON.parse(prefStr);
      uiMode = prefs.uiMode;
      if (!uiMode && 'isTrayMode' in prefs) {
        uiMode = prefs.isTrayMode ? UI_MODES.TRAY : UI_MODES.NORMAL;
      }
    }
  } catch (e) {}
}


function writePrefs() {
  fs.writeFileSync(app.getPath('userData') + '/prefs.json', JSON.stringify({
    uiMode
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


function isVisible() {
  return mainWindow && mainWindow.isVisible();
}


function toggleVisibility(makeVisible) {
  if (makeVisible === undefined) {
    makeVisible = !isVisible();
  }

  if (!makeVisible && mainWindow) {
    mainWindow.hide();
  }
  if (makeVisible) {
    if (!mainWindow) {
      // TODO: do we need to handle this?
    }

    mainWindow.show();
  }
}
