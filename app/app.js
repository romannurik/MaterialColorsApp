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
const colors = require('./colors.js');

var $hues;
var $values;


function init() {
  buildUi();
  document.querySelector('.close-button').addEventListener('click', () => {
    electron.remote.getCurrentWindow().hide();
    electron.ipcRenderer.send('update-ui-mode');
  });

  electron.ipcRenderer.on('update-downloaded', (event, releaseName) => {
    let $updateBanner = document.createElement('div');
    $updateBanner.classList.add('update-banner');
    let $updateBannerText = document.createTextNode(`Install v${releaseName}`);
    $updateBanner.appendChild($updateBannerText);
    $updateBanner.addEventListener('click', () => {
      electron.ipcRenderer.send('install-update');
    });
    document.body.appendChild($updateBanner);
  });
}


function displayLabelForHue(hue) {
  return hue.split('-')
      .map(s => s.charAt(0).toUpperCase() + s.substring(1))
      .join(' ');
}


function selectHue(hue) {
  let $selectedHue = document.querySelector('.hue.is-selected');
  if ($selectedHue) {
    $selectedHue.classList.remove('is-selected');
  }
  document.querySelector(`.hue-${hue}`).classList.add('is-selected');

  // build values

  while ($values.hasChildNodes()) {
    $values.removeChild($values.lastChild);
  }

  let $valueHeading = document.createElement('div');
  $valueHeading.classList.add('value-heading');
  let $valueHeadingText = document.createTextNode(displayLabelForHue(hue));
  $valueHeading.appendChild($valueHeadingText);
  $values.appendChild($valueHeading);

  for (let value in colors[hue]) {
    let $value = document.createElement('div');
    $value.classList.add('value');
    if (!!colors[hue][value].white) {
      $value.classList.add('is-white');
    }
    $value.style.backgroundColor = colors[hue][value].color;
    $values.appendChild($value);

    let $valueName = document.createElement('div');
    $valueName.classList.add('value-name');
    let $valueNameText = document.createTextNode(value.toUpperCase());
    $valueName.appendChild($valueNameText);
    $value.appendChild($valueName);

    let $valueHex = document.createElement('div');
    $valueHex.classList.add('value-hex');
    let $valueHexText = document.createTextNode(colors[hue][value].color.toUpperCase());
    $valueHex.appendChild($valueHexText);
    $valueHex.addEventListener('click', () => {
      electron.clipboard.writeText(colors[hue][value].color.toUpperCase());
    });
    $value.appendChild($valueHex);
  }
}


function buildUi() {
  $hues = document.createElement('div');
  $hues.classList.add('hues');
  document.body.appendChild($hues);

  let firstHue;
  for (let hue in colors) {
    if (!firstHue) {
      firstHue = hue;
    }

    let $hue = document.createElement('div');
    $hue.classList.add('hue');
    $hue.classList.add('hue-' + hue);
    $hue.addEventListener('click', () => {
      selectHue(hue);
    });
    $hues.appendChild($hue);

    let $hueIcon = document.createElement('div');
    $hueIcon.classList.add('hue-icon');
    $hueIcon.style.backgroundColor = colors[hue]['500'].color;
    $hue.appendChild($hueIcon);

    let $hueIconSelector = document.createElement('div');
    $hueIconSelector.classList.add('hue-icon-selector');
    $hueIconSelector.style.backgroundColor = colors[hue]['700'].color;
    $hueIcon.appendChild($hueIconSelector);

    let $hueLabel = document.createElement('div');
    $hueLabel.classList.add('hue-label');
    let $hueLabelText = document.createTextNode(displayLabelForHue(hue));
    $hueLabel.appendChild($hueLabelText);
    $hue.appendChild($hueLabel);
  }

  $values = document.createElement('div');
  $values.classList.add('values');
  document.body.appendChild($values);

  selectHue(firstHue);
}


init();
