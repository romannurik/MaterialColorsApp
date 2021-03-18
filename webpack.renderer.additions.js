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

const path = require('path');

module.exports = config => {
  for (let rule of config.module.rules) {
    if (!rule.use || !rule.use.length) {
      continue;
    }
    for (let loader of Array.from(rule.use || []).filter(({ loader }) => loader === 'css-loader')) {
      loader.options = {
        ...(loader.options || {}),
        modules: {
          mode: 'local',
          exportLocalsConvention: 'camelCase',
          localIdentName: '[local]-[hash:base64:5]',
        }
      };
    }
  }

  config.resolve.alias['static'] = path.resolve(__dirname, 'static');
  config.resolve.alias['@'] = process.env.AT_ROOT || path.resolve(__dirname);
  config.resolve.alias['@the-colors'] = process.env.COLORS_JS_FILE
    || path.resolve(__dirname, 'src/common/colors.js');

  return config;
};
