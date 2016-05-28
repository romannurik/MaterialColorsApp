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

const $ = require('jquery');

const electron = require('electron');
const remote = electron.remote;
const Menu = remote.Menu;
const MenuItem = remote.MenuItem;

const tinycolor = require('tinycolor2');
const nunjucks = require('nunjucks');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const CONFIG_FILENAME = '.materialcolorapp.yaml';


class MaterialColors {
  constructor() {
    this.$sidebar = null;
    this.$contentArea = null;
    this.$_cache = {};
    this._lastCopiedColor = null;

    this.COLORS = require('./colors.js');

    this._allMaterialValues = [];
    Object.keys(this.COLORS).map(hueName =>
        Object.keys(this.COLORS[hueName]).map(valueName =>
            this._allMaterialValues.push(
                Object.assign({ hueName, valueName }, this.COLORS[hueName][valueName]))));

    this.CLASS_NAMES = {
      closeButton: 'close-button',
      colorTile: 'color-tile',
      colorTileAlpha: 'color-tile-alpha',
      colorTileHex: 'color-tile-hex',
      colorTileHueName: 'color-tile-hue-name',
      colorTileValueName: 'color-tile-value-name',
      contentArea: 'content-area',
      hue: 'hue',
      hueIcon: 'hue-icon',
      hueIconSelector: 'hue-icon-selector',
      hueLabel: 'hue-label',
      isHidden: 'is-hidden',
      isSelected: 'is-selected',
      isWhite: 'is-white',
      isLarge: 'is-large',
      searchButton: 'search-button',
      searchHelpText: 'search-help-text',
      searchIcon: 'search-icon',
      searchInput: 'search-input',
      searchLabel: 'search-label',
      searchResults: 'search-results',
      searchSection: 'search-section',
      sidebar: 'sidebar',
      updateBanner: 'update-banner',
      valueHeading: 'value-heading',
      valueList: 'value-list',
      notFoundIcon: 'not-found-icon',
      notFoundLabel: 'not-found-label',
      matchingMaterialLabel: 'matching-material-label',
    };

    this._init();
  }

  _init() {
    this.$sidebar = $(`.${this.CLASS_NAMES.sidebar}`);
    this.$contentArea = $(`.${this.CLASS_NAMES.contentArea}`);
    this.$searchSection = $(`.${this.CLASS_NAMES.searchSection}`);
    this.$valueList = $(`.${this.CLASS_NAMES.valueList}`);

    this._CONFIG = this._loadConfig();
    this._buildUi();

    $(`.${this.CLASS_NAMES.closeButton}`).click(() => {
      electron.remote.getCurrentWindow().hide();
      electron.ipcRenderer.send('update-ui-mode');
    });

    electron.ipcRenderer.on('update-downloaded', (event, releaseName) => {
      $('<div>')
          .addClass(this.CLASS_NAMES.updateBanner)
          .text(`Install v${releaseName}`)
          .click(() => electron.ipcRenderer.send('install-update'))
          .appendTo('body');
    });

    $(window).on('keydown keyup', event =>
        $(`.${this.CLASS_NAMES.colorTile}`).trigger('refresh-tile', {
          hideHash: !!event.altKey
        }));

    $(window).on('focus', () => this._searchColorFromClipboard());
  }

  _buildUi() {
    let firstHueName;

    let $searchButton = $('<div>')
        .addClass(`${this.CLASS_NAMES.searchButton}`)
        .click(() => this._selectSearchMode())
        .appendTo(this.$sidebar);

    let $searchIcon = $('<div>')
        .addClass(this.CLASS_NAMES.searchIcon)
        .append($(`
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>`))
        .appendTo($searchButton);

    $('<div>')
        .addClass(this.CLASS_NAMES.searchLabel)
        .text('Search')
        .appendTo($searchButton);

    for (let hueName in this.COLORS) {
      let color = this.COLORS[hueName];
      if (!firstHueName) {
        firstHueName = hueName;
      }

      let $hue = $('<div>')
          .addClass(`${this.CLASS_NAMES.hue} ${this.CLASS_NAMES.hue}-${hueName}`)
          .click(() => this._selectHue(hueName))
          .appendTo(this.$sidebar);

      let $hueIcon = $('<div>')
          .addClass(this.CLASS_NAMES.hueIcon)
          .css('background-color', color['500'].hex)
          .appendTo($hue);

      $('<div>')
          .addClass(this.CLASS_NAMES.hueIconSelector)
          .css('background-color', color['700'].hex)
          .appendTo($hueIcon);

      $('<div>')
          .addClass(this.CLASS_NAMES.hueLabel)
          .text(this._getDisplayLabelForHue(hueName))
          .appendTo($hue);
    }

    this._selectHue(firstHueName);
  }

  _selectSearchMode() {
    this.$sidebar
        .find(`.${this.CLASS_NAMES.hue}.${this.CLASS_NAMES.isSelected}`)
        .removeClass(this.CLASS_NAMES.isSelected);
    this.$sidebar
        .find(`.${this.CLASS_NAMES.searchButton}`)
        .addClass(this.CLASS_NAMES.isSelected);

    $(`.${this.CLASS_NAMES.searchSection}`).removeClass(this.CLASS_NAMES.isHidden);
    $(`.${this.CLASS_NAMES.valueList}`).addClass(this.CLASS_NAMES.isHidden);

    if (this.$_cache['search']) {
      // if search is already rendered.
      $(`.${this.CLASS_NAMES.searchInput}`).select();
    } else {
      // first time here? build search ui.

      // title
      $('<div>')
          .addClass(this.CLASS_NAMES.valueHeading)
          .text('Search')
          .appendTo(this.$searchSection);

      // search text input
      let $searchInput = $('<input>')
          .addClass(this.CLASS_NAMES.searchInput)
          .on('input', event => this._onSearchInput(event))
          .attr('placeholder', 'Color code or name')
          .appendTo(this.$searchSection);

      // search result area
      this.$searchResults = $('<div>')
          .addClass(this.CLASS_NAMES.searchResults)
          .appendTo(this.$searchSection);

      // help text
      this.$searchHelpText = $('<div>')
          .addClass(this.CLASS_NAMES.searchHelpText)
          .text(`Search by material color name or hex value.
                 Copy any color code format to the clipboard
                 to detect the color name.`)
          .appendTo(this.$searchResults);

      $searchInput.focus();

      this.$_cache['search'] = this.$searchSection.children();
    }
  }

  _selectHue(hueName) {
    // Toggle selected hue
    this.$sidebar.find(`.${this.CLASS_NAMES.hue}.${this.CLASS_NAMES.isSelected}`)
        .removeClass(this.CLASS_NAMES.isSelected);
    this.$sidebar.find(`.${this.CLASS_NAMES.searchButton}`)
        .removeClass(this.CLASS_NAMES.isSelected);
    this.$sidebar.find(`.${this.CLASS_NAMES.hue}-${hueName}`)
        .addClass(this.CLASS_NAMES.isSelected);

    $(`.${this.CLASS_NAMES.searchSection}`).addClass(this.CLASS_NAMES.isHidden);
    $(`.${this.CLASS_NAMES.valueList}`).removeClass(this.CLASS_NAMES.isHidden);

    // Empty value list
    this.$valueList.empty();

    $('<div>')
        .addClass(this.CLASS_NAMES.valueHeading)
        .text(this._getDisplayLabelForHue(hueName))
        .appendTo(this.$valueList);

    // for each value in the hue
    let color = this.COLORS[hueName];
    for (let valueName in this.COLORS[hueName]) {
      color[valueName].valueName = valueName;
      color[valueName].hueName = hueName;
      this._buildValueTile(color[valueName])
          .appendTo(this.$valueList);
    }

    // TODO(abhiomkar): use this dom cache instead of re-rendering.
    this.$_cache[hueName] = this.$valueList.children();
  }

  _onSearchInput(e) {
    let value = e.target.value;
    let inputColor = tinycolor(value);

    if (!value) {
      // search input is empty.
      this.$searchResults
        .empty()
        .append(this.$searchHelpText);
    } else if (inputColor.isValid()) {
      // search input is valid.
      let hex = inputColor.toHexString();
      let alpha = inputColor.getAlpha();
      let materialValues = this._getMaterialValuesByHex(hex);
      let $colorTile;
      this.$searchResults.empty();

      if (materialValues.length) {
        // material color
        materialValues.forEach(value => {
          // update material color with alpha.
          if (alpha) {
            value = Object.assign({alpha}, value);
          }

          this._buildValueTile(value, true).appendTo(this.$searchResults);
        });
      } else {
        // Non-material color.
        this._buildValueTile({ hex, alpha, white: inputColor.isDark() }, true)
            .appendTo(this.$searchResults);

        $('<div>')
            .addClass(this.CLASS_NAMES.matchingMaterialLabel)
            .text('Nearest Material colors')
            .appendTo(this.$searchResults);

        // suggest a closest material color
        this._getCloseMaterialValues(inputColor)
            .forEach(val => this._buildValueTile(val, true).appendTo(this.$searchResults));
      }
    } else {
      // not found
      this.$searchResults.empty();

      $('<div>')
          .addClass(this.CLASS_NAMES.notFoundIcon)
          .append($(`
            <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" fill="#000000">
                <path d="M0 0h24v24H0z" fill="none"/>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>`))
          .appendTo(this.$searchResults);

      $('<div>')
          .addClass(this.CLASS_NAMES.notFoundLabel)
          .text('Unknown color')
          .appendTo(this.$searchResults);
    }
  }

  _showValueContextMenu(hexValue, alpha) {
    let withHash = hexValue;
    let noHash = hexValue.replace(/#/g, '');

    let formats = [];
    formats.push(withHash);
    formats.push(noHash);
    formats.push(`rgb(${
        parseInt(noHash.substring(0, 2), 16)}, ${
        parseInt(noHash.substring(2, 4), 16)}, ${
        parseInt(noHash.substring(4, 6), 16)})`);

    if (alpha && alpha < 1) {
      formats.push(`rgba(${
          parseInt(noHash.substring(0, 2), 16)}, ${
          parseInt(noHash.substring(2, 4), 16)}, ${
          parseInt(noHash.substring(4, 6), 16)}, .${
          (alpha * 100).toFixed(0)})`);
    }

    let menu = Menu.buildFromTemplate(
        formats.map(format => ({
          label: `Copy ${format}`,
          click: () => {
            electron.clipboard.writeText(format);
            this._lastCopiedColor = format;
          }
        })));
    menu.popup(remote.getCurrentWindow());
  }

  _buildValueTile(value, largeTile) {
    const ALPHA = value.alpha && value.alpha.toString();
    const HEX = value.hex;
    const VALUE = value.valueName && value.valueName.toString();
    const HUE = value.hueName && value.hueName.toString();

    let $colorTile = $('<div>')
        .addClass(this.CLASS_NAMES.colorTile)
        .toggleClass(this.CLASS_NAMES.isWhite, !!value.white)
        .toggleClass(this.CLASS_NAMES.isLarge, !!largeTile)
        .css('background-color', value.hex)
        .contextmenu(event => {
          event.preventDefault();
          this._showValueContextMenu(value.hex, value.alpha);
        });

    let $hex = $('<div>')
        .addClass(this.CLASS_NAMES.colorTileHex)
        .text(value.hex.toUpperCase())
        .click(() => {
            electron.clipboard.writeText($hex.text());
            this._lastCopiedColor = $hex.text();
        })
        .appendTo($colorTile);

    $colorTile.on('refresh-tile', (event, opts) =>
        $hex.text(value.hex.toUpperCase().substring((opts && opts.hideHash) ? 1 : 0)));

    if (value.valueName) {
      $('<div>')
          .addClass(this.CLASS_NAMES.colorTileValueName)
          .text(value.valueName.toUpperCase())
          .click(() => {
            let copyText = nunjucks.renderString(
                this._CONFIG.value_copy_format || "--{{HUE}}-{{VALUE}}",
                {ALPHA, HEX, VALUE, HUE});
            electron.clipboard.writeText(copyText);
            this._lastCopiedColor = copyText;
          })
          .appendTo($colorTile);
    }

    if (value.hueName && largeTile) {
      $('<span>')
          .addClass(this.CLASS_NAMES.colorTileHueName)
          .text(this._getDisplayLabelForHue(value.hueName))
          .click(() => this._selectHue(value.hueName))
          .appendTo($colorTile);
    }

    if (value.alpha && value.alpha < 1 && largeTile) {
        $('<span>')
          .addClass(this.CLASS_NAMES.colorTileAlpha)
            .text(`Alpha ${parseInt(value.alpha * 100)}%`)
            .appendTo($colorTile);
    }

    return $colorTile;
  }

  _getDisplayLabelForHue(hueName) {
    return hueName.split('-')
        .map(s => s.charAt(0).toUpperCase() + s.substring(1))
        .join(' ');
  }

  _getColorDifference(colorAValue, colorBValue) {
    let colorA = tinycolor(colorAValue);
    let colorB = tinycolor(colorBValue);

    // Color difference based on CIE76 formula.
    // Wiki: https://en.wikipedia.org/wiki/Color_difference#CIE76

    return Math.sqrt(Math.pow(colorA._r - colorB._r, 2) + // red
                     Math.pow(colorA._g - colorB._g, 2) + // green
                     Math.pow(colorA._b - colorB._b, 2)); // blue
  }

  _getMaterialValuesByHex(hex) {
    return this._allMaterialValues
        .filter(value => value.hex.toLowerCase() === hex.toLowerCase());
  }

  _getCloseMaterialValues(inputColor) {
    return this._allMaterialValues
        .map(value => ({ value, difference: this._getColorDifference(inputColor, value.hex) }))
        .sort((a, b) => (a.difference - b.difference))
        .slice(0, 3)
        .map(obj => obj.value);
  }

  _searchColorFromClipboard() {
    let clipboardText = electron.clipboard.readText();

    // if not previously copied from app itself.
    if (clipboardText !== this._lastCopiedColor) {
      let color = tinycolor(clipboardText);

      if (color.isValid()) {
        this._selectSearchMode();

        let $searchInput = this.$searchSection.find(`.${this.CLASS_NAMES.searchInput}`);

        $searchInput
            .val(clipboardText)
            .trigger('input');

        setTimeout(() => $searchInput.select(), 100);
      }

      this._lastCopiedColor = clipboardText;
    }
  }

  _loadConfig() {
    const configFilePath = path.join(this._getHomeDirectory(), CONFIG_FILENAME);

    try {
      return yaml.safeLoad(fs.readFileSync(configFilePath, 'utf8')) || {};
    } catch(e) {
      // return empty config if config file doesn't exists.
      return {};
    }
  }

  _getHomeDirectory() {
    return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
  }
} // class MaterialColors

new MaterialColors();
