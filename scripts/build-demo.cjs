#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'docs');

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'static'), { recursive: true });
fs.mkdirSync(path.join(out, 'miniprogram', 'lib'), { recursive: true });

const ASSET_VERSION = '20261120c';
const sourceHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const demoScripts = [
  '<script>window.FUNNEL_DEMO_AUTO = true;</script>',
  `<script src="static/demo-data.js?v=${ASSET_VERSION}"></script>`,
  `<script src="static/demo.js?v=${ASSET_VERSION}"></script>`
].join('');
let html = sourceHtml
  .replace('<title>漏斗 · 给收藏一个出口</title>', '<title>漏斗 Funnel · 收藏去化演示</title>')
  .replace('<script src="miniprogram/lib/core.js"></script>', demoScripts + '<script src="miniprogram/lib/core.js"></script>');
html = html
  .replaceAll('static/style.css', `static/style.css?v=${ASSET_VERSION}`)
  .replaceAll('static/app.js', `static/app.js?v=${ASSET_VERSION}`)
  .replaceAll('miniprogram/lib/core.js', `miniprogram/lib/core.js?v=${ASSET_VERSION}`);

html = html.replace('</body>', '<script>document.addEventListener("DOMContentLoaded",()=>document.getElementById("demo-notice")?.remove());</script>\n</body>');

if (!html.includes('FUNNEL_DEMO_AUTO')) throw new Error('index.html script anchor not found');
fs.writeFileSync(path.join(out, 'index.html'), html);

// A no-setup preview for htmlpreview.github.io. The <base> makes the relative
// assets resolve through jsDelivr instead of the htmlpreview origin.
const previewHtml = html.replace(
  '<head>',
  '<head><base href="https://cdn.jsdelivr.net/gh/littleqian12/funnel_loudou@main/docs/">'
);
fs.writeFileSync(path.join(out, 'preview.html'), previewHtml);

for (const file of ['static/style.css', 'static/app.js', 'static/demo-data.js', 'static/demo.js', 'miniprogram/lib/core.js']) {
  fs.copyFileSync(path.join(root, file), path.join(out, file));
}

// Prevent GitHub Pages' Jekyll step from touching the static demo.
fs.writeFileSync(path.join(out, '.nojekyll'), '');
console.log('Built demo into', path.relative(root, out));
