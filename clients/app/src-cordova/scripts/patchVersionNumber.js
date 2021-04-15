#!/usr/bin/env node
// Add %%VERSION%% at any place to index.html file to be replaced by this script.

const fs = require('fs');
const path = require('path');
require('dotenv').config({ silent: process.env.NODE_ENV !== 'development' })

function fileStringReplace(filename, search, replace) {
    let content = fs.readFileSync(filename, 'utf8');
    content = content.replace(new RegExp(search, 'g'), replace);
    fs.writeFileSync(filename, content, 'utf8');
}

const versionCheck = function(context) {
    const rawConfig = fs.readFileSync('config.xml', 'ascii');
    const match = /^<widget.+version="([\d\.]+)".+?>$/gm.exec(rawConfig);

    if(!match || match.length != 2)
      throw new Error('version parse failed');

    const version = match[1];

    // Check that .env APPVERSION === confix.xml app version
    const versionsMatch = process.env.VUE_APP_VERSION === version

    if (!versionsMatch)
      throw new Error('version mismatch between .env VUE_APP_VERSION and config.xml');

    const rootdir = context.opts.projectRoot;
    const fullfilename = path.join(rootdir, 'www/index.html');
    const versionRegex = /data-appversion="(.+?)"/;
    if (fs.existsSync(fullfilename)) {
      fileStringReplace(fullfilename, versionRegex,`data-appversion="${version}"`)
    }
    console.log('replaced version to ' + version);
}

module.exports = versionCheck
