const SEPARATOR_MENU_ITEM = { type: 'separator' };

const HELP_MENU = {
  label: 'Help',
  role: 'help',
  submenu: []
};

// needed for Cmd+C, Cmd+V, etc. to work in text fields on mac
// (https://github.com/electron/electron/issues/1718)
const EDIT_MENU = {
  label: 'Edit',
  submenu: [
    {
      label: 'Undo',
      accelerator: 'Command+Z',
      selector: 'undo:'
    },
    {
      label: 'Redo',
      accelerator: 'Shift+Command+Z',
      selector: 'redo:'
    },
    SEPARATOR_MENU_ITEM,
    {
      label: 'Cut',
      accelerator: 'Command+X',
      selector: 'cut:'
    },
    {
      label: 'Copy',
      accelerator: 'Command+C',
      selector: 'copy:'
    },
    {
      label: 'Paste',
      accelerator: 'Command+V',
      selector: 'paste:'
    },
    {
      label: 'Select All',
      accelerator: 'Command+A',
      selector: 'selectAll:'
    },
  ]
};

const WINDOW_MENU = {
  label: 'Window',
  submenu: [
    {
      label: 'Minimize',
      accelerator: 'Command+M',
      selector: 'performMiniaturize:'
    },
    {
      label: 'Close',
      accelerator: 'Command+W',
      selector: 'performClose:'
    }
  ]
};

module.exports = {HELP_MENU, EDIT_MENU, WINDOW_MENU, SEPARATOR_MENU_ITEM};
