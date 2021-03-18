/**
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import cn from 'classnames';
import electron, { ipcRenderer, remote } from 'electron';
import React, { useContext, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import tinycolor from 'tinycolor2';
import styles from './app.module.scss';
import { renderCustomColorFormatString } from './color-formatting';
import { Sidebar } from './sidebar';

import {
  getCloseSearchableValues,
  getSearchableValuesByHex,
  prepareSearchableValues
} from './search-util';
import { CancelIcon, MoreVertIcon } from './icons';

const { Menu } = remote;

const DEFAULT_VALUE_COPY_FORMAT = {
  format: '$HUE $VALUE',
  transform: 'Xx',
};

export const config = ipcRenderer.sendSync('get-config');

export const colorverse = ipcRenderer.sendSync('get-colorverse');

export const GlobalContext = React.createContext({});

let lastCopiedColor = null;

const defaultNamespace = Object.keys(colorverse)[0];

class App extends React.Component {
  state = {
    selectedView: {
      type: 'hue',
      namespace: defaultNamespace,
      hue: Object.keys(colorverse[defaultNamespace].colors)[0]
    },
  };

  sidebarRef = React.createRef();

  contentRef = React.createRef();

  constructor() {
    super();
    prepareSearchableValues(colorverse);
  }

  async componentDidUpdate() {
    this.resize();
  }

  resize = async () => {
    await new Promise(resolve => setTimeout(resolve));

    if (!this.sidebarRef.current || !this.contentRef.current) {
      return;
    }

    let sb = this.sidebarRef.current;
    let ca = this.contentRef.current;
    let sidebarHeight = sb.children[sb.children.length - 1].getBoundingClientRect().bottom
      + parseInt(window.getComputedStyle(sb).paddingBottom);
    let contentHeight = ca.children[ca.children.length - 1].getBoundingClientRect().bottom
      + parseInt(window.getComputedStyle(ca).paddingBottom);
    let height = Math.floor(Math.min(Math.max(sidebarHeight, contentHeight), 800));
    if (height !== this._lastHeight) {
      ipcRenderer.sendSync('set-height', height);
      this._lastHeight = height;
    }
  }

  componentDidMount() {
    const setIsDarkMode = isDarkMode => {
      document.body.classList.toggle(styles.isDarkMode, isDarkMode);
      this.setState({ isDarkMode });
    };

    setIsDarkMode(!!document.location.search.includes('darkMode=true'));

    electron.ipcRenderer.on('dark-mode-updated', (event, isDarkMode) => {
      setIsDarkMode(isDarkMode);
    });

    electron.ipcRenderer.on('update-downloaded', (event, releaseName) => {
      this.setState({ updateAvailable: { releaseName } });
    });

    let toggleHash = event => this.setState({ hideHash: !!event.altKey });
    window.addEventListener('keydown', toggleHash);
    window.addEventListener('keyup', toggleHash);
    window.addEventListener('focus', () => {
      let clipboardText = searchColorFromClipboard(lastCopiedColor);
      if (clipboardText) {
        this.setState({
          selectedView: { type: 'search' },
          clipboardText
        });
      }
    });
  }

  render() {
    let { updateAvailable, isDarkMode, selectedView, clipboardText } = this.state;

    let trayAttached = !document.location.search.includes('uiMode=tray-attached');
    return <GlobalContext.Provider value={{
      hideHash: this.state.hideHash,
      isDarkMode,
      selectedView,
      resize: () => this.resize(),
      setSelectedView: selectedView => this.setState({ selectedView }),
    }}>
      <Sidebar ref={this.sidebarRef} />
      <div className={styles.contentArea}>
        {/* Search */}
        {selectedView.type === 'search' && <div ref={this.contentRef} className={styles.searchSection}>
          <SearchView inboundSearchText={clipboardText} />
        </div>}
        {/* Anything but search */}
        {selectedView.type === 'hue' && <div ref={this.contentRef} className={styles.valueList}>
          <ValueList namespace={selectedView.namespace} hueName={selectedView.hue} />
        </div>}
      </div>
      {trayAttached && <div className={styles.closeButton} onClick={() => {
        electron.remote.getCurrentWindow().hide();
        electron.ipcRenderer.send('on-hide');
      }}>
        <CancelIcon />
      </div>}
      {!trayAttached && <div className={styles.menuButton} onClick={() => {
        electron.ipcRenderer.send('show-overflow-menu');
      }}>
        <MoreVertIcon />
      </div>}
      {updateAvailable && <div className={styles.updateBanner} onClick={() => electron.ipcRenderer.send('install-update')}>
        Update to v{updateAvailable.releaseName}
      </div>}
    </GlobalContext.Provider>;
  }
}

/**
 * Renders the search + search results view
 */
function SearchView({ inboundSearchText }) {
  let [searchText, setSearchText] = useState('');
  let [searchResults, setSearchResults] = useState(null);
  let [similarResults, setSimilarResults] = useState(null);

  useEffect(() => {
    inboundSearchText && setSearchText(inboundSearchText);
  }, [inboundSearchText]);

  useEffect(() => {
    let searchColor = tinycolor(searchText);

    if (searchColor.isValid()) {
      // search input is valid.
      let hex = searchColor.toHexString();
      let alpha = searchColor.getAlpha();
      let results = getSearchableValuesByHex(hex);

      if (results.length) {
        // material color
        setSearchResults(results.map(value => ({
          // update material color with alpha.
          alpha: alpha ? alpha : value.alpha,
          ...value,
        })));
        setSimilarResults(null);
      } else {
        setSearchResults([{ hex, alpha }]);
        setSimilarResults(getCloseSearchableValues(searchColor));
      }
    } else {
      setSearchResults(null);
      setSimilarResults(null);
    }
  }, [searchText]);

  return <>
    <div className={styles.valueHeading}>Search</div>
    <input className={styles.searchInput}
      ref={node => node && node.focus()}
      value={searchText}
      onInput={ev => setSearchText(ev.currentTarget.value)}
      placeholder="Color code or name" />
    {searchText && <div className={styles.searchResults}>
      {searchResults && searchResults.map(value =>
        <ValueTile large key={`${value.name},${value.hex}`} value={value} />)}
      {similarResults && <>
        <div className={styles.matchingMaterialLabel}>Similar colors</div>
        {similarResults.map(value =>
          <ValueTile large key={`${value.name},${value.hex}`} value={value} />)}
      </>}
      {!searchResults && <>
        <div className={styles.notFoundIcon}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" fill="#000000">
            <path d="M0 0h24v24H0z" fill="none" />
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
          </svg>
        </div>
        <div className={styles.notFoundLabel}>Unknown color</div>
      </>}
    </div>}
    {!searchText &&
      <div className={styles.searchHelpText}>
        Search by color name or hex value.
        Copy a color to the clipboard to find its name.
      </div>}
  </>;
}

/**
 * Renders all the color tiles for the given hue
 */
function ValueList({ namespace, hueName }) {
  let color = colorverse[namespace].colors[hueName];
  return <>
    <div className={styles.valueHeading}>{displayLabelForHue(hueName)}</div>
    {Object.entries(color)
      .filter(([valueName]) => !valueName.startsWith('_'))
      .map(([valueName, color]) =>
        <ValueTile key={valueName} value={{
          hueName,
          valueName,
          ...color,
        }} />)}
    {(color._groups || []).map(group =>
      <div key={group.title} className={styles.valueGroup}>
        {group.title && <div className={styles.valueGroupHeading}>{group.title}</div>}
        {group.colors.map(color =>
          <ValueTile key={color.name} value={{
            groupName: group.title,
            valueName: color.name,
            hueName,
            ...color
          }} />
        )}
      </div>)}
  </>;
}

/**
 * Renders an individual color value tile
 */
function ValueTile({ value, large }) {
  let { hideHash, isDarkMode, setSelectedView } = useContext(GlobalContext);
  let isWhite;
  let tc = tinycolor(value.hex);

  let tileColor = value.alpha
    ? tc.setAlpha(value.alpha).toString()
    : value.hex;

  isWhite = (value.alpha && value.alpha < 0.5)
    ? isDarkMode
    : tc.isDark();

  let hexText = value.hex.toUpperCase().substring(hideHash ? 1 : 0);
  return <div
    className={cn(styles.colorTile, {
      [styles.isWhite]: !!isWhite,
      [styles.isLarge]: !!large
    })}
    style={{ '--tile-color': tileColor }}
    onContextMenu={ev => {
      ev.preventDefault();
      showValueContextMenu(value.hex, value.hueName, value.groupName, value.valueName, value.alpha);
    }}>
    <div className={styles.colorTileHex}
      onClick={() => {
        electron.clipboard.writeText(hexText);
        lastCopiedColor = hexText;
      }}>
      {hexText}
    </div>

    {(value.name || value.valueName) &&
      <div className={styles.colorTileValueName}
        onClick={() => {
          let valueCopyFormat = (config.copyFormats && config.copyFormats.length)
            ? config.copyFormats[0]
            : DEFAULT_VALUE_COPY_FORMAT;
          let copyText = renderCustomColorFormatString(valueCopyFormat, {
            hueName: value.hueName,
            groupName: value.groupName || null,
            valueName: value.name || value.valueName,
            alpha: value.alpha,
          });
          electron.clipboard.writeText(copyText);
          lastCopiedColor = copyText;
        }}>
        {value.name || value.valueName.toUpperCase()}
      </div>}

    {(value.hueName && large) &&
      <span className={styles.colorTileHueName}
        onClick={() => setSelectedView({ type: 'hue', namespace: value.namespace, hue: value.hueName })}>
        {displayLabelForHue(value.hueName) + (value.groupName ? ` – ${value.groupName}` : '')}
      </span>}

    {!!(value.alpha && value.alpha < 1 && large) &&
      <span className={styles.colorTileAlpha}>
        Alpha {Math.round(value.alpha * 100)}%
      </span>}
  </div>
}

export function displayLabelForHue(hueName) {
  return hueName.split('-')
    .map(s => s.charAt(0).toUpperCase() + s.substring(1))
    .join(' ');
}


function showValueContextMenu(hexValue, hueName, groupName, valueName, alpha) {
  let tc = tinycolor(hexValue);

  let formatToMenuItemTemplate_ = format => ({
    label: `Copy ${format}`,
    click: () => {
      electron.clipboard.writeText(format);
      lastCopiedColor = format;
    }
  });

  let menuTemplate = [
    tc.toHexString().toUpperCase(),
    tc.toHex().toUpperCase(),
    tc.toRgbString(),
    tc.toHslString()
  ].map(formatToMenuItemTemplate_);

  if (alpha && alpha < 1) {
    tc.setAlpha(alpha);
    menuTemplate = [
      ...menuTemplate,
      { type: 'separator' },
      ...[
        tc.toHex8String().toUpperCase(),
        tc.toHex8().toUpperCase(),
        tc.toRgbString(),
        tc.toHslString()
      ].map(formatToMenuItemTemplate_)
    ];
  }

  if (valueName) {
    let valueFormatTemplates = (config.copyFormats && config.copyFormats.length)
      ? config.copyFormats
      : [DEFAULT_VALUE_COPY_FORMAT];
    menuTemplate = [
      ...menuTemplate,
      { type: 'separator' },
      ...valueFormatTemplates
        .map(format => renderCustomColorFormatString(format, { hueName, groupName, valueName, alpha }))
        .map(formatToMenuItemTemplate_)
    ];
  }

  Menu.buildFromTemplate(menuTemplate)
    .popup(electron.remote.getCurrentWindow());
}

function searchColorFromClipboard(lastCopiedColor) {
  let clipboardText = electron.clipboard.readText();

  // if not previously copied from app itself.
  if (clipboardText === lastCopiedColor) {
    return;
  }

  lastCopiedColor = clipboardText;

  if (tinycolor(clipboardText).isValid()) {
    return clipboardText;
  }
}

ReactDOM.render(<App />, document.getElementById('app'));