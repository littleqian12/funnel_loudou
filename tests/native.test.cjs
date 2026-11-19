const { test } = require('node:test');
const assert = require('node:assert/strict');
const C = require('../miniprogram/lib/core');
test('native store surfaces storage errors without losing persisted content', () => {
  let persisted = C.fresh();
  global.wx = { getStorageSync: () => persisted, setStorageSync: () => { throw new Error('quota'); } };
  const store = require('../miniprogram/lib/store');
  const next = C.importItems(persisted, C.parseInput('https://example.org'), {}).state;
  assert.throws(() => store.save(next), /保存失败/);
  assert.equal(store.load().items.length, 0);
  delete global.wx;
});
test('native pages register and import into persistent state only after confirmation', () => {
  let persisted = '';
  const pages = [];
  global.Page = obj => pages.push(obj);
  global.wx = {
    getStorageSync: () => persisted,
    setStorageSync: (key, data) => { persisted = data; },
    showModal: () => {}, showToast: () => {}
  };
  require('../miniprogram/pages/home/home'); require('../miniprogram/pages/import/import');
  require('../miniprogram/pages/detail/detail'); require('../miniprogram/pages/privacy/privacy');
  assert.equal(pages.length, 4);
  const importer = pages[1];
  const page = Object.assign({}, importer, { data: Object.assign({}, importer.data), setData(data) { Object.assign(this.data, data); } });
  page.data.input = '真实标题 https://v.douyin.com/abcd/'; page.data.reason = '今天要用';
  page.preview(); assert.equal(persisted, ''); assert.equal(page.data.count, 1);
  page.submit(); assert.equal(persisted.items.length, 1); assert.equal(persisted.items[0].source, '抖音');
  delete global.Page; delete global.wx;
});
test('native home limits initial list payloads and allows more records', () => {
  let pageDefinition;
  const state = C.importItems(C.fresh(), { rows: Array.from({ length: 100 }, (_, i) => ({ title: '内容' + i, content: '长正文'.repeat(500) })) }, {}).state;
  global.Page = obj => { pageDefinition = obj; };
  global.wx = { getStorageSync: () => state };
  delete require.cache[require.resolve('../miniprogram/pages/home/home')];
  require('../miniprogram/pages/home/home');
  const home = Object.assign({}, pageDefinition, { data: {}, setData(d) { Object.assign(this.data, d); } });
  home.onShow();
  assert.equal(home.data.archiveTotal, 97); assert.equal(home.data.archive.length, 30);
  assert.ok(!('content' in home.data.archive[0]));
  assert.ok(JSON.stringify(home.data).length < 50000);
  home.more(); assert.equal(home.data.archive.length, 60);
  delete global.Page; delete global.wx;
});
