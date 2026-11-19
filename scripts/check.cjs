const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '..');
function walk(p) { return fs.readdirSync(p, { withFileTypes: true }).flatMap(x => x.isDirectory() ? walk(path.join(p, x.name)) : [path.join(p, x.name)]); }
const files = walk(path.join(root, 'miniprogram')).concat(walk(path.join(root, 'static')));
for (const file of files) {
  if (file.endsWith('.json')) JSON.parse(fs.readFileSync(file, 'utf8'));
  if (file.endsWith('.js')) cp.execFileSync(process.execPath, ['--check', file]);
  if (/\.(js|wxml|html)$/.test(file) && /funnel\.weixin|xxx[1-9]|funnel-sample|阿May|function seed\(|simulateExpiryPush|simulateSeed/.test(fs.readFileSync(file, 'utf8'))) throw new Error('Demo artifact: ' + file);
}
const app = JSON.parse(fs.readFileSync(path.join(root, 'miniprogram/app.json')));
for (const page of app.pages) for (const ext of ['js', 'json', 'wxml']) if (!fs.existsSync(path.join(root, 'miniprogram', page + '.' + ext))) throw new Error('Missing page: ' + page);
const config = JSON.parse(fs.readFileSync(path.join(root, 'project.config.json')));
console.log('Syntax, config, page routes and demo-artifact checks passed.');
if (config.appid === 'touristappid') console.log('Release setup remaining: set your own WeChat AppID.');
