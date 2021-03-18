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

import tinycolor from 'tinycolor2';

let searchableValues = [];

export function prepareSearchableValues(colorverse) {
  searchableValues = [];

  for (let [namespace, { colors }] of Object.entries(colorverse)) {
    for (let [hueName, colorObj] of Object.entries(colors)) {
      for (let group of colorObj._groups || []) {
        for (let color of group.colors || []) {
          searchableValues.push({
            namespace,
            hueName,
            groupName: group.title || null,
            valueName: color.name,
            ...color
          });
        }
      }

      for (let valueName of Object.keys(colorObj).filter(k => !k.startsWith('_'))) {
        searchableValues.push({
          namespace,
          hueName,
          valueName,
          ...colorverse[namespace].colors[hueName][valueName]
        });
      }
    }
  }
}

function getColorDifference(colorAValue, colorBValue) {
  let colorA = tinycolor(colorAValue);
  let colorB = tinycolor(colorBValue);

  // Color difference based on CIE76 formula.
  // Wiki: https://en.wikipedia.org/wiki/Color_difference#CIE76

  return Math.sqrt(Math.pow(colorA._r - colorB._r, 2) + // red
    Math.pow(colorA._g - colorB._g, 2) + // green
    Math.pow(colorA._b - colorB._b, 2)); // blue
}

export function getSearchableValuesByHex(hex) {
  return searchableValues
    .filter(value => value.hex.toLowerCase() === hex.toLowerCase());
}

export function getCloseSearchableValues(inputColor) {
  return searchableValues
    .map(value => ({ value, difference: getColorDifference(inputColor, value.hex) }))
    .sort((a, b) => (a.difference - b.difference))
    .slice(0, 3)
    .map(obj => obj.value);
}
