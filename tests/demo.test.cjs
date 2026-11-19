'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const core = require('../miniprogram/lib/core.js');
const demo = require('../static/demo-data.js');

const NOW = Date.UTC(2026, 10, 19, 12, 0, 0);

test('demo snapshot is valid and populated', () => {
  const state = demo.build(NOW);
  core.validateState(state);
  assert.equal(state.items.length, 20);
  assert.equal(new Set(state.items.map(item => item.id)).size, state.items.length);
  for (const item of state.items) {
    assert.equal(item.source, core.source(item.url), item.title);
    assert.ok(!item.title.includes('/Users/'));
  }
});

test('demo snapshot exercises queue, overdue, archive and history', () => {
  const state = demo.build(NOW);
  const view = core.view(state, NOW);
  assert.equal(view.queue.length, 3);
  assert.equal(view.overdue.length, 2);
  assert.equal(view.archive.length, 3);
  assert.equal(view.history.length, 12);
  assert.equal(view.stats.total, 20);
  assert.equal(view.stats.pending, 8);
  assert.equal(view.stats.done, 10);
  assert.equal(view.stats.released, 2);
  assert.equal(view.stats.rate, 50);
  assert.ok(view.bySource.length >= 6);
  assert.match(core.label(view.queue[0], NOW), /^剩余 [123] 天$/);
  assert.match(core.label(view.overdue[0], NOW), /已到期/);
});

test('demo snapshot stays small enough for local backup', () => {
  const state = demo.build(NOW);
  assert.ok(Buffer.byteLength(JSON.stringify(state), 'utf8') < 900000);
});
