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

import fs from 'fs';
import path from 'path';

import { app } from 'electron';

const CONFIG_FILENAME = '.materialcolorsapp.json';

export function loadConfig() {
  const configFilePath = path.join(app.getPath('home'), CONFIG_FILENAME);

  try {
    let data = fs.existsSync(configFilePath) && fs.readFileSync(configFilePath);
    if (!data) {
      return {};
    }

    return JSON.parse(data);

  } catch (e) {
    console.error('Error reading config file.', e);
    return {};
  }
}
