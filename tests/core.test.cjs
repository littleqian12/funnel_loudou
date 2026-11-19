const { test } = require('node:test');
const assert = require('node:assert/strict');
const C = require('../miniprogram/lib/core');
const NOW = Date.parse('2026-10-24T04:00:00Z');
const add = (state, input, opts = {}) => C.importItems(state, C.parseInput(input), Object.assign({ reason: '解决实际问题', days: 7 }, opts), NOW);
test('starts empty, every statistic comes from persisted items', () => {
  assert.deepEqual(C.fresh().items, []);
  assert.equal(C.view(C.fresh(), NOW).stats.rate, 0);
  let s = add(C.fresh(), 'https://mp.weixin.qq.com/s/real-article').state;
  assert.equal(s.items[0].source, '公众号');
  s = C.update(s, s.items[0].id, 'done', '学到了一点', NOW + 1000);
  assert.equal(C.view(s, NOW).stats.rate, 100);
  assert.equal(s.items[0].note, '学到了一点');
});
test('extracts real URLs from XHS and Douyin share copy, including short links', () => {
  const p = C.parseInput('这个学习方法很好 http://xhslink.com/a/AbCd，复制到小红书打开\n2.00 分享视频 https://v.douyin.com/AbCd/ 复制后打开抖音');
  assert.equal(p.rows.length, 2);
  const r = C.importItems(C.fresh(), p, {}, NOW);
  assert.deepEqual(r.state.items.map(i => i.source), ['小红书', '抖音']);
  assert.equal(r.state.items[0].url, 'http://xhslink.com/a/AbCd');
});
test('deduplicates platform IDs across token changes, preserves original access URL', () => {
  const first = 'https://www.xiaohongshu.com/explore/1234567890abcdef?xsec_token=first';
  let s = add(C.fresh(), first).state;
  const r = add(s, 'https://www.xiaohongshu.com/explore/1234567890abcdef?xsec_token=second');
  assert.equal(r.imported, 0); assert.equal(r.skipped, 1);
  assert.equal(r.state.items[0].url, first);
});
test('source detection respects hostname boundaries', () => {
  assert.equal(C.source('https://xiaohongshu.com.evil.example/x'), '网页');
  assert.equal(C.source('https://example.com/?u=douyin.com'), '网页');
  assert.equal(C.safeURL('javascript:alert(1)'), '');
  assert.equal(C.safeURL('https://user:pass@example.com'), '');
});
test('invalid import rows are skipped, malformed JSON reports errors', () => {
  assert.throws(() => C.parseInput('[broken'), /JSON/);
  assert.throws(() => C.parseInput('{"items":{}}'), /items/);
  assert.throws(() => C.parseInput('{"version":99,"items":[]}'), /版本/);
  const r = add(C.fresh(), JSON.stringify([null, {}, { title: 'bad', url: 'javascript:alert(1)' }, { title: 'Good', url: 'https://example.com' }]));
  assert.equal(r.imported, 1); assert.equal(r.skipped, 3);
});
test('backup restores state, notes, dates, expiry extension; merge does not overwrite', () => {
  let s = add(C.fresh(), 'https://example.com/article').state;
  s = C.update(s, s.items[0].id, 'extend', '', NOW);
  s = C.update(s, s.items[0].id, 'done', '原来的总结', NOW + 1000);
  const p = C.parseInput(C.backup(s));
  const recovered = C.importItems(C.fresh(), p, {}, NOW + 2000).state;
  for (const key of ['url', 'status', 'note', 'createdAt', 'expiresAt', 'extended', 'finishedAt']) assert.equal(recovered.items[0][key], s.items[0][key]);
  assert.equal(C.importItems(s, p, {}, NOW).imported, 0);
});
test('expiry is visible and non-destructive, queue has max 3 and archive keeps remainder', () => {
  const s = add(C.fresh(), Array.from({ length: 5 }, (_, i) => 'https://example.com/' + i).join('\n')).state;
  const v = C.view(s, NOW);
  assert.equal(v.queue.length, 3); assert.equal(v.archive.length, 2);
  const expired = C.view(s, NOW + 8 * 86400000);
  assert.equal(expired.overdue.length, 5); assert.equal(s.items.length, 5);
  assert.equal(expired.stats.released, 0);
});
test('one extension, explicit state transitions, delete and restore update actual totals', () => {
  let s = add(C.fresh(), '一段真实的阅读文字').state;
  const id = s.items[0].id;
  s = C.update(s, id, 'extend', '', NOW);
  assert.throws(() => C.update(s, id, 'extend', '', NOW), /续期/);
  s = C.update(s, id, 'released', '', NOW);
  assert.throws(() => C.update(s, id, 'done', '', NOW), /已处理/);
  assert.equal(C.view(s, NOW).stats.released, 1);
  s = C.update(s, id, 'restore', '', NOW);
  assert.equal(C.view(s, NOW).stats.pending, 1);
  s = C.update(s, id, 'delete', '', NOW);
  assert.equal(s.items.length, 0);
});
test('failed imports never mutate existing records; validates storage before use', () => {
  const s = C.fresh();
  assert.throws(() => C.importItems(s, { rows: Array.from({ length: C.LIMIT + 1 }, (_, i) => ({ title: String(i) })) }, {}, NOW), /最多/);
  assert.deepEqual(s, C.fresh());
  assert.throws(() => C.validateState({ version: 1, items: [{ title: 'broken' }] }), /异常/);
});
test('text blocks preserve body, links support title separator format', () => {
  const s = add(C.fresh(), '读书划线\n第二行的思考\n\n文章标题 | https://example.org/a').state;
  assert.equal(s.items[0].content, '读书划线\n第二行的思考');
  assert.equal(s.items[1].title, '文章标题');
});
test('large Unicode content cannot create an unrestorable oversized backup', () => {
  assert.throws(() => C.parseInput('汉'.repeat(700000)), /2 MB/);
  const rows = Array.from({ length: 100 }, (_, i) => ({ title: '段落' + i, content: '汉'.repeat(9000) }));
  const s = C.fresh();
  assert.throws(() => C.importItems(s, { rows, backup: false }, {}, NOW), /备份/);
  assert.equal(s.items.length, 0);
});
