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

export function renderCustomColorFormatString(format, data) {
  let replacer;
  let textTransform;

  let string = format.format;
  let transform = format.transform;

  data.hueName = data.hueName || '';
  data.valueName = data.valueName || '';

  if (data.groupName) {
    data.valueName = data.groupName + '-' + data.valueName;
  }

  if (data.alpha) {
    data.alpha = (data.alpha * 100).toFixed(0);
  } else {
    data.alpha = '100';
  }

  // is it a valid transform?
  if (transform && transform.length <= 3 && transform.match(/\w?(x|X|Xx)/)) {
    transform = transform.trim();

    // if transform has replacer character (eg: '-x', '_x')
    if (!transform.toLowerCase().startsWith('x')) {
      replacer = transform[0];
      textTransform = transform.slice(1);
    } else {
      textTransform = transform;
    }

    // text transform, lower, upper or capitalize
    let transformers = [];
    if (textTransform === 'x') {
      transformers.push(s => s.toLowerCase());
    } else if (textTransform === 'X') {
      transformers.push(s => s.toUpperCase());
    } else if (textTransform === 'Xx') {
      transformers.push(s => sentenceCase(s));
    }

    // Replacer
    // d - delete spaces between the hue name (eg: LightBlue)
    // * - replace spaces between hue name with any character (eg: LIGHT_BLUE)
    // if no replacer found add a space between hue name if any (eg: Light Blue)
    replacer = replacer
      ? (replacer === 'd'
        ? ''
        : replacer)
      : ' ';

    transformers.push(s => s.replace(/[- ]/g, replacer));

    let applyAllTransformers = src => transformers.reduce((s, t) => t(s), src);
    data.hueName = applyAllTransformers(data.hueName);
    data.valueName = applyAllTransformers(data.valueName);
  }

  string = string.replace(/\$HUE/g, data.hueName)
    .replace(/\$VALUE/g, data.valueName)
    .replace(/\$ALPHA/g, data.alpha);

  return string;
}

export function sentenceCase(str) {
  return str.replace(/(?:^|(\s|\-))\S/g, (s) => { return s.toUpperCase(); });
}
