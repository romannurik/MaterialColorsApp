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

const gulp = require('gulp');
const $ = require('gulp-load-plugins')();
const del = require('del');
const merge = require('merge-stream');
const electronPackager = require('electron-packager');
const electronOsxSignAsync = require('electron-osx-sign').signAsync;
const argv = require('yargs').argv;
const fs = require('fs');
const archiver = require('archiver');
const {execSync} = require('child_process');
const plist = require('gulp-plist').default;

const colorsFile = argv.colorsFile;
const packageInfoDeltaFile = argv.packageInfoDeltaFile;
const iconFile = argv.iconFile;


gulp.task('scripts', () => {
  if (colorsFile) {
    return merge(
      gulp.src([
        'app/**/*.js',
        '!app/**/colors.js'
      ])
        .pipe(gulp.dest('build')),
      gulp.src(colorsFile)
          .pipe($.rename('colors.js'))
          .pipe(gulp.dest('build'))
    );
  } else {
    return gulp.src('app/**/*.js')
        .pipe(gulp.dest('build'));
  }
});

gulp.task('copy', () => {
  let packageInfo = require('./package.json');

  if (packageInfoDeltaFile) {
    let packageInfoDelta = JSON.parse(fs.readFileSync(packageInfoDeltaFile));
    for (let k in packageInfoDelta) {
      let m;
      if (m = k.match(/(.+)\.suffix$/)) {
        packageInfo[m[1]] += packageInfoDelta[k];
      } else {
        packageInfo[k] = packageInfoDelta[k];
      }
    }
  }

  fs.writeFileSync('./build/package.json', JSON.stringify(packageInfo, null, 2));

  return merge([
    gulp.src('app/*.html').pipe(gulp.dest('build')),
    gulp.src('app/assets/*').pipe(gulp.dest('build/assets'))
  ]);
});

gulp.task('styles', () => {
  return gulp.src('app/app.scss')
    .pipe($.sass({
      style: 'expanded',
      precision: 10,
      quiet: true
    }))
    .pipe(gulp.dest('build'));
});

gulp.task('clean', cb => {
  del.sync(['.tmp', 'build', 'dist']);
  $.cache.clearAll();
  cb();
});

gulp.task('build', gulp.series('clean', 'styles', 'scripts', 'copy'));

gulp.task('install-packages', gulp.series($.shell.task([
  'npm install --production'
], { cwd: 'build' })));

gulp.task('run-electron', gulp.series($.shell.task([
  'electron ./build/ --dev'
])));

gulp.task('dist', gulp.series('build', 'install-packages', async () => {
  let packageInfo = require('./build/package.json');
  let appPaths = await electronPackager({
    arch: 'x64',
    dir: 'build',
    out: 'dist',
    asar: true,
    platform: 'darwin',
    prune: false, // seems to be a bug where not just devDependencies but also dependencies is pruned
                  // we don't need pruning anyway since we do npm install --production
    appBundleId: packageInfo.appBundleId,
    appCategoryType: 'app-category-type=public.app-category.developer-tools',
    appVersion: packageInfo.version,
    icon: iconFile || 'icon.icns',
    name: packageInfo.appDisplayName,
    overwrite: true,
  });

  let appPath = appPaths[0];
  if (!appPath) {
    throw new Error('No app bundle was outputted by electron-packager');
  }

  // Modify plist to hide from Dock by default
  let appFilePath = `${appPath}/${packageInfo.appDisplayName}.app`;
  let plistStream = gulp.src(`${appFilePath}/Contents/Info.plist`)
      .pipe(plist({
        NSUIElement: 1,
        CFBundleShortVersionString: ''
      }))
      .pipe(gulp.dest(`${appFilePath}/Contents`));

  // https://developer.apple.com/library/content/qa/qa1940/_index.html
  execSync(`xattr -cr "${appFilePath}"`);

  await new Promise((resolve, reject) => {
    plistStream.on('end', async () => {
      // Sign the app
      await electronOsxSignAsync({
        app: appFilePath,
        identity: 'Developer ID Application: Roman NURIK (NLACF347G7)',
        platform: 'darwin'
      });

      // zip up the directory
      console.log('Zipping up the package');
      let zipStream = fs.createWriteStream(`./dist/${packageInfo.version}.zip`)
          .on('warning', err => { throw err; })
          .on('error', err => { throw err; })
          .on('close', () => resolve());
      let archive = archiver('zip', {zlib: {level: 9}})
      archive.pipe(zipStream);
      archive.directory(appFilePath, `${packageInfo.appDisplayName}.app`);
      archive.finalize();
    });
  });
}));

gulp.task('default', gulp.series('build', 'run-electron'));
