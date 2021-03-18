#!/usr/bin/env node
const archiver = require('archiver');
const fs = require('fs');
const plist = require('plist');
const path = require('path');

let appFilename = fs.readdirSync('./dist/mac').find(f => f.endsWith('.app'));
let pl = plist.parse(fs.readFileSync(`./dist/mac/${appFilename}/Contents/Info.plist`, { encoding: 'utf-8' }));
let version = pl['CFBundleVersion'];

console.log(`Zipping up ${appFilename}, version ${version}`);
let zipPath = `./dist/${version}.zip`;
let zipStream = fs.createWriteStream(zipPath)
    .on('warning', err => { throw err; })
    .on('error', err => { throw err; })
    .on('close', () => console.log(`Done zipping: ${path.resolve(zipPath)}`));
let archive = archiver('zip', { zlib: { level: 9 } })
archive.pipe(zipStream);
archive.directory(`./dist/mac/${appFilename}`, appFilename);
archive.finalize();
