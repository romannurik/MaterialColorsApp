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
const colors = require('./colors.js');

var $hues;
var $values;


function init() {
  buildUi();
  $('.close-button').click(() => {
    electron.remote.getCurrentWindow().hide();
    electron.ipcRenderer.send('update-ui-mode');
  });

  electron.ipcRenderer.on('update-downloaded', (event, releaseName) => {
    $('<div>')
        .addClass('update-banner')
        .text(`Install v${releaseName}`)
        .click(() => electron.ipcRenderer.send('install-update'))
        .appendTo('body');
  });
}


function displayLabelForHue(hue) {
  return hue.split('-')
      .map(s => s.charAt(0).toUpperCase() + s.substring(1))
      .join(' ');
}


function selectHue(hue) {
  $('.hue').removeClass('is-selected');
  $(`.hue-${hue}`).addClass('is-selected');

  // build values

  $values.empty();

  $('<div>')
      .addClass('value-heading')
      .text(displayLabelForHue(hue))
      .appendTo($values);

  for (let value in colors[hue]) {
    let $value = $('<div>')
        .addClass('value')
        .toggleClass('is-white', !!colors[hue][value].white)
        .css({
          backgroundColor: colors[hue][value].color
        })
        .appendTo($values);

    $('<div>')
        .addClass('value-name')
        .text(value.toUpperCase())
        .appendTo($value);

    $('<div>')
        .addClass('value-hex')
        .text(colors[hue][value].color.toUpperCase())
        .click(() => electron.clipboard.writeText(colors[hue][value].color.toUpperCase()))
        .appendTo($value);
  }
}


function buildUi() {
  $hues = $('<div>')
      .addClass('hues')
      .appendTo('body');

  let firstHue;
  for (let hue in colors) {
    if (!firstHue) {
      firstHue = hue;
    }

    let $hue = $('<div>')
        .addClass('hue')
        .addClass('hue-' + hue)
        .click(() => selectHue(hue))
        .appendTo($hues);

    let $hueIcon = $('<div>')
        .addClass('hue-icon')
        .css({
          backgroundColor: colors[hue]['500'].color
        })
        .appendTo($hue);

    $('<div>')
        .addClass('hue-icon-selector')
        .css({
          backgroundColor: colors[hue]['700'].color
        })
        .appendTo($hueIcon);

    $('<div>')
        .addClass('hue-label')
        .text(displayLabelForHue(hue))
        .appendTo($hue);
  }

  $values = $('<div>')
      .addClass('values')
      .appendTo('body');

  selectHue(firstHue);
}


init();
