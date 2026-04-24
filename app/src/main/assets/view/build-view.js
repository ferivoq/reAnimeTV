#!/usr/bin/env node
/**
 * Concatenates view source files into m.js
 * Run: node build-view.js
 */
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const out = path.join(dir, 'm.js');

const files = [
  'bootstrap.js',
  'sources/config.js',
  'sources/animekai.js',
  'sources/hianime.js',
  'sources/onianime.js',
  'core.js'
];

const parts = files.map(f => {
  const fp = path.join(dir, f);
  if (!fs.existsSync(fp)) {
    throw new Error('Missing file: ' + fp);
  }
  return fs.readFileSync(fp, 'utf8');
});

const content = parts.join('\n\n/* === next file === */\n\n');
fs.writeFileSync(out, content);
console.log('Built m.js from ' + files.join(', '));
