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
var tinycolor = require("tinycolor2");
var _ = require('lodash');


class MaterialColors {
  constructor() {
    this.$sidebar = null;
    this.$contentArea = null;
    this.$_cache = {};

    this.COLORS = require('./colors.js');
    this.CLASS_NAMES = {
      sidebar: 'sidebar',
      hue: 'hue',
      hueIcon: 'hue-icon',
      hueIconSelector: 'hue-icon-selector',
      hueLabel: 'hue-label',
      contentArea: 'content-area',
      valueHeading: 'value-heading',
      value: 'value',
      valueName: 'value-name',
      valueHex: 'value-hex',
      closeButton: 'close-button',
      updateBanner: 'update-banner',
      isSelected: 'is-selected',
      isWhite: 'is-white',
      search: 'search',
      searchSection: 'search-section',
      searchIcon: 'search-icon',
      searchLabel: 'search-label',
      searchInput: 'search-input',
      searchHelptext: 'search-helptext',
      variationList: 'variation-list',
      colorTile: 'color-tile',
    };

    this._init();
  }

  _init() {
    this.$sidebar = $(`.${this.CLASS_NAMES.sidebar}`);
    this.$contentArea = $(`.${this.CLASS_NAMES.contentArea}`);
    this.$searchSection = $(`.${this.CLASS_NAMES.searchSection}`);
    this.$variationList = $(`.${this.CLASS_NAMES.variationList}`);

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
        .appendTo(this.$sidebar);

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
          .appendTo(this.$sidebar);

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
    this.$sidebar.find(`.${this.CLASS_NAMES.hue}.${this.CLASS_NAMES.isSelected}`)
        .removeClass(this.CLASS_NAMES.isSelected);
    this.$sidebar.find(`.${this.CLASS_NAMES.search}`)
        .addClass(this.CLASS_NAMES.isSelected);

    $(`.${this.CLASS_NAMES.searchSection}`).removeClass('hide');
    $(`.${this.CLASS_NAMES.variationList}`).addClass('hide');

    if (this.$_cache['search']) {
        // if search already rendered.
        $(`.${this.CLASS_NAMES.searchInput}`).select();
        return;
    } else {
      // build search ui, if first time here.

      // title
      $('<div>')
          .addClass(this.CLASS_NAMES.valueHeading)
          .text('Search')
          .appendTo(this.$searchSection);

      // search text input
      var $searchInput = $('<input>')
          .addClass(this.CLASS_NAMES.searchInput)
          .on('input', (event) => this._onSearchInput(event))
          .attr('placeholder', 'Color code or name')
          .appendTo(this.$searchSection);

      this.$searchResult = $('<div>')
          .addClass(this.CLASS_NAMES.searchResult)
          .appendTo(this.$searchSection);

      // help text
      this.$searchHelpText = $('<div>')
          .addClass(this.CLASS_NAMES.searchHelptext)
          .text('Search by Material Color name or code. \
                 Copy any color code format to clipboard \
                 to detect the color name.')
          .appendTo(this.$searchResult);

      $searchInput.focus();

      this.$_cache['search'] = this.$searchSection.children();
    }
  }

  _selectHue(hue) {
    // Toggle selected hue
    this.$sidebar.find(`.${this.CLASS_NAMES.hue}.${this.CLASS_NAMES.isSelected}`)
        .removeClass(this.CLASS_NAMES.isSelected);
    this.$sidebar.find(`.${this.CLASS_NAMES.search}`)
        .removeClass(this.CLASS_NAMES.isSelected);
    this.$sidebar.find(`.${this.CLASS_NAMES.hue}-${hue}`)
        .addClass(this.CLASS_NAMES.isSelected);
    this.$sidebar.find(`.${this.CLASS_NAMES.searchLabel}`)
        .addClass('hide');

    $(`.${this.CLASS_NAMES.searchSection}`).addClass('hide');
    $(`.${this.CLASS_NAMES.variationList}`).removeClass('hide');

    // if ($domCache[hue]) {
    //     this.$variationList = $domCache[hue];
    // }

    // Empty variation list
    this.$variationList.find('*').remove();

    $('<div>')
        .addClass(this.CLASS_NAMES.valueHeading)
        .text(this._getDisplayLabelForHue(hue))
        .appendTo(this.$variationList);

    for (let value in this.COLORS[hue]) {
      let color = this.COLORS[hue];

      let $value = $('<div>')
          .addClass(this.CLASS_NAMES.value)
          .toggleClass(this.CLASS_NAMES.isWhite, !!color[value].white)
          .css('background-color', color[value].color)
          .appendTo(this.$variationList);

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

    this.$_cache[hue] = this.$variationList.children();
  }

  _onSearchInput(e) {
    let value = e.target.value;
    let inputColor = tinycolor(value);

    if (!value) {
      this.$searchResult
        .empty()
        .append(this.$searchHelpText);
      return;
    }

    if (inputColor.isValid()) {
      let hex = inputColor.toHexString();
      let alpha = inputColor.getAlpha();
      let materialColor = this._getMaterialColorByHex(hex);
      let $colorTile;
      this.$searchResult.empty();

      if (materialColor) {
        // Material color.

        // update material color with hex and alpha.
        Object.assign(materialColor, {hex});
        if (alpha) {
          Object.assign(materialColor, {alpha});
        }

        this._getColorTile(materialColor)
          .appendTo(this.$searchResult);
      } else {
        // Non-material color.
        this._getColorTile({ hex, alpha, white: inputColor.isDark() })
          .appendTo(this.$searchResult);
      }
    } else {
      // TODO(abhiomkar): handle invalid search input.
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

  _getColorTile(color) {
    let $colorTile = $('<div>').addClass(this.CLASS_NAMES.colorTile);
    let hexClasses = [];

    if (color.hue) {
      $('<span>')
          .addClass('top-left')
          .text(color.hue)
          .appendTo($colorTile);
    }

    if (color.alpha && color.alpha < 1) {
        $('<span>')
            .addClass('top-right')
            .text('Alpha ' + parseInt(color.alpha * 100))
            .appendTo($colorTile);
    }

    if (color.variation) {
      $('<span>')
          .addClass('bottom-left')
          .text(color.variation)
          .appendTo($colorTile);
    }

    hexClasses = ['bottom-right', this.CLASS_NAMES.valueHex];
    if (color.white) {
      hexClasses.push('is-white');
    }

    $('<span>')
        .addClass(hexClasses.join(' '))
        .text(color.hex)
        .appendTo($colorTile)
        .click(() => electron.clipboard.writeText(color.hex.toUpperCase()));

    $colorTile.css('background', color.hex);
    $colorTile.css('color', color.white ? 'white' : 'black');

    return $colorTile;
  }

  _getDisplayLabelForHue(hue) {
    return hue.split('-')
        .map(s => s.charAt(0).toUpperCase() + s.substring(1))
        .join(' ');
  }

  _getMaterialColorByHex(hex) {
    let materialColor;

    _.forEach(this.COLORS, function(variations, hue) {
      // continue the loop if we haven't yet found the material color.
      // return !materialColor;

      _.forEach(variations, function(variationValue, variation) {
        if (_.lowerCase(variationValue.color) === _.lowerCase(hex)) {
          materialColor = { hue, variation, white: variationValue.white };
          // break
          return false;
        }
      });
    });

    return materialColor;
  }
} // class MaterialColors

new MaterialColors();
