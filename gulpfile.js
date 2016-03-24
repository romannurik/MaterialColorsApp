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
const runSequence = require('run-sequence');
const electronPackager = require('electron-packager');
const electronOsxSign = require('electron-osx-sign');
const argv = require('yargs').argv;
const fs = require('fs');

const colorsFile = argv.colorsFile;
const packageInfoDeltaFile = argv.packageInfoDeltaFile;


gulp.task('scripts', function () {
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

gulp.task('copy', function () {
  var packageInfo = require('./package.json');

  if (packageInfoDeltaFile) {
    var packageInfoDelta = JSON.parse(fs.readFileSync(packageInfoDeltaFile));
    for (var k in packageInfoDelta) {
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

gulp.task('styles', function () {
  return gulp.src('app/app.scss')
    .pipe($.sass({
      style: 'expanded',
      precision: 10,
      quiet: true
    }))
    .pipe(gulp.dest('build'));
});

gulp.task('install-packages', ['build'], $.shell.task([
  'npm install --production'
], { cwd: 'build' }));

gulp.task('clean', function() {
  del(['.tmp', 'build', 'dist']);
  $.cache.clearAll();
});

gulp.task('build', function(cb) {
  runSequence(
      'clean', 'styles', 'scripts', 'copy',
      cb);
});

gulp.task('run-electron', ['build'], $.shell.task([
  'electron ./build/ --dev'
]));

gulp.task('dist', ['build', 'install-packages'], function(cb) {
  let packageInfo = require('./build/package.json');
  electronPackager({
    'arch': 'x64',
    'dir': 'build',
    'out': 'dist',
    'asar': true,
    'platform': 'darwin',
    'app-bundle-id': packageInfo.appBundleId,
    'app-category-type': 'app-category-type=public.app-category.developer-tools',
    'app-version': packageInfo.version,
    //'sign': 'Developer ID Application: Roman NURIK (NLACF347G7)',
    'icon': 'icon.icns',
    'name': packageInfo.appDisplayName,
    'overwrite': true,
  }, (err, appPath) => {
    if (err) {
      console.error(err);
      cb();
      return;
    }

    // Modify plist to hide from Dock by default
    let appFilePath = `${appPath}/${packageInfo.appDisplayName}.app`;
    let plistStream = gulp.src(`${appFilePath}/Contents/Info.plist`)
        .pipe($.plist({
          NSUIElement: 1,
          CFBundleShortVersionString: ''
        }))
        .pipe(gulp.dest(`${appFilePath}/Contents`));

    plistStream.on('end', () => {
      // Sign the app
      electronOsxSign({
        app: appFilePath,
        identity: 'Developer ID Application: Roman NURIK (NLACF347G7)',
        platform: 'darwin'
      }, (err) => {
        if (err) {
          console.error(err);
          cb();
          return;
        }

        cb();
      });
    });
  });
});

gulp.task('default', ['run-electron']);
