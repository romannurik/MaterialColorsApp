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
const remote = require('remote');
const Menu = remote.require('menu');
const MenuItem = remote.require('menu-item');


class MaterialColors {
  constructor() {
    this.$hues = null;
    this.$values = null;

    this.COLORS = require('./colors.js');
    this.CLASS_NAMES = {
      hues: 'hues',
      hue: 'hue',
      hueIcon: 'hue-icon',
      hueIconSelector: 'hue-icon-selector',
      hueLabel: 'hue-label',
      values: 'values',
      valueHeading: 'value-heading',
      value: 'value',
      valueName: 'value-name',
      valueHex: 'value-hex',
      closeButton: 'close-button',
      updateBanner: 'update-banner',
      isSelected: 'is-selected',
      isWhite: 'is-white',
      search: 'search',
      searchIcon: 'search-icon',
      searchLabel: 'search-label',
    };

    this._init();
  }

  _init() {
    this.$hues = $(`.${this.CLASS_NAMES.hues}`);
    this.$values = $(`.${this.CLASS_NAMES.values}`);

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
  }

  _buildUi() {
    let firstHue;
    let greyColor = this.COLORS['grey'];

    let $search = $('<div>')
        .addClass(`${this.CLASS_NAMES.search}`)
        .click(() => this._searchMode())
        .appendTo(this.$hues);

    let $searchIcon = $('<div>')
        .addClass(this.CLASS_NAMES.searchIcon)
        .css('background-color', greyColor['500'])
        .appendTo($search);

    $('<div>')
        .addClass(this.CLASS_NAMES.searchLabel)
        .text('Search')
        .appendTo($search);

    for (let hue in this.COLORS) {
      let color = this.COLORS[hue];
      if (!firstHue) {
        firstHue = hue;
      }

      let $hue = $('<div>')
          .addClass(`${this.CLASS_NAMES.hue} ${this.CLASS_NAMES.hue}-${hue}`)
          .click(() => this._selectHue(hue))
          .appendTo(this.$hues);

      let $hueIcon = $('<div>')
          .addClass(this.CLASS_NAMES.hueIcon)
          .css('background-color', color['500'].color)
          .appendTo($hue);

      $('<div>')
          .addClass(this.CLASS_NAMES.hueIconSelector)
          .css('background-color', color['700'].color)
          .appendTo($hueIcon);

      $('<div>')
          .addClass(this.CLASS_NAMES.hueLabel)
          .text(this._getDisplayLabelForHue(hue))
          .appendTo($hue);
    }

    this._selectHue(firstHue);
  }

  _searchMode() {
    // Toggle selected hue
    this.$hues.find(`.${this.CLASS_NAMES.hue}.${this.CLASS_NAMES.isSelected}`)
        .removeClass(this.CLASS_NAMES.isSelected);
    this.$hues.find(`.${this.CLASS_NAMES.search}`)
        .addClass(this.CLASS_NAMES.isSelected);

    // Empty values
    this.$values.find('*').remove();

    $('<div>')
        .addClass(this.CLASS_NAMES.valueHeading)
        .text('Search')
        .appendTo(this.$values);
  }

  _selectHue(hue) {
    // Toggle selected hue
    this.$hues.find(`.${this.CLASS_NAMES.hue}.${this.CLASS_NAMES.isSelected}`)
        .removeClass(this.CLASS_NAMES.isSelected);
    this.$hues.find(`.${this.CLASS_NAMES.search}.${this.CLASS_NAMES.isSelected}`)
        .removeClass(this.CLASS_NAMES.isSelected);
    this.$hues.find(`.${this.CLASS_NAMES.hue}-${hue}`)
        .addClass(this.CLASS_NAMES.isSelected);

    // Empty values
    this.$values.find('*').remove();

    $('<div>')
        .addClass(this.CLASS_NAMES.valueHeading)
        .text(this._getDisplayLabelForHue(hue))
        .appendTo(this.$values);

    for (let value in this.COLORS[hue]) {
      let color = this.COLORS[hue];

      let $value = $('<div>')
          .addClass(this.CLASS_NAMES.value)
          .toggleClass(this.CLASS_NAMES.isWhite, !!color[value].white)
          .css('background-color', color[value].color)
          .appendTo(this.$values);

      $('<div>')
          .addClass(this.CLASS_NAMES.valueName)
          .text(value.toUpperCase())
          .contextmenu(event => {
            event.preventDefault();
            this._showValueContextMenu(color[value].color);
          })
          .appendTo($value);

      $('<div>')
          .addClass(this.CLASS_NAMES.valueHex)
          .text(color[value].color.toUpperCase())
          .click(() => electron.clipboard.writeText(color[value].color.toUpperCase()))
          .appendTo($value);
    }
  }

  _showValueContextMenu(color) {
    let withHash = color;
    let noHash = color.replace(/#/g, '');
    let rgb = `rgb(${
        parseInt(noHash.substring(0, 2), 16)}, ${
        parseInt(noHash.substring(2, 4), 16)}, ${
        parseInt(noHash.substring(4, 6), 16)})`;

    let formats = [];
    formats.push(withHash);
    formats.push(noHash);
    formats.push(rgb);

    let menu = Menu.buildFromTemplate(
        formats.map(format => ({
          label: `Copy ${format}`,
          click: () => electron.clipboard.writeText(format)
        })));
    menu.popup(remote.getCurrentWindow());
  }

  _getDisplayLabelForHue(hue) {
    return hue.split('-')
        .map(s => s.charAt(0).toUpperCase() + s.substring(1))
        .join(' ');
  }
}

new MaterialColors();
