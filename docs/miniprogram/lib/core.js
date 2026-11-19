/* Shared domain logic. No network, account credentials or demo records. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Funnel = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const VERSION = 1;
  const LIMIT = 1500;
  const KEY = 'funnel_real_v1';
  const DAY = 86400000;
  const iso = n => new Date(n).toISOString();
  const fresh = () => ({ version: VERSION, items: [] });
  function text(v, max) { return typeof v === 'string' ? v.trim().slice(0, max || 1000) : ''; }
  function hostname(url) {
    const m = /^https?:\/\/([^/?#\s]+)/i.exec(url);
    return m ? m[1].toLowerCase().replace(/:\d+$/, '') : '';
  }
  function source(url) {
    const h = hostname(url);
    const is = d => h === d || h.endsWith('.' + d);
    if (h === 'mp.weixin.qq.com') return '公众号';
    if (is('xiaohongshu.com') || is('xhslink.com')) return '小红书';
    if (is('douyin.com')) return '抖音';
    if (h === 'weread.qq.com') return '微信读书';
    if (is('zhihu.com')) return '知乎';
    return h ? '网页' : '文字';
  }
  function safeURL(value) {
    const u = text(value, 4096);
    if (!/^https?:\/\/[^\s<>"'\\]+$/i.test(u) || !hostname(u) || /@/.test(hostname(u))) return '';
    return u;
  }
  function identity(item) {
    if (!item.url) return 'text:' + item.title + '\n' + (item.content || '');
    // Use platform content IDs, preserve the original URL including access parameters.
    const h = hostname(item.url);
    const m = /\/(?:explore|discovery\/item|video|note)\/([a-z\d]+)/i.exec(item.url);
    if (m && (source(item.url) === '小红书' || source(item.url) === '抖音')) return source(item.url) + ':' + m[1];
    return item.url.replace(/#.*$/, '').replace(/\/$/, '');
  }
  function byteSize(value) {
    let size = 0;
    for (let i = 0; i < value.length; i++) {
      const c = value.charCodeAt(i);
      if (c < 128) size++;
      else if (c < 2048) size += 2;
      else if (c >= 0xD800 && c <= 0xDBFF && i + 1 < value.length && value.charCodeAt(i + 1) >= 0xDC00 && value.charCodeAt(i + 1) <= 0xDFFF) { size += 4; i++; }
      else size += 3;
    }
    return size;
  }
  function parseInput(input) {
    if (typeof input !== 'string' || input.length > 2000000 || byteSize(input) > 2000000) throw new Error('内容为空或超过 2 MB');
    const raw = input.trim();
    if (!raw) throw new Error('请粘贴链接、分享文案、文字或 JSON');
    if (/^[\[{]/.test(raw)) {
      let data;
      try { data = JSON.parse(raw); } catch (_) { throw new Error('JSON 格式不正确，请检查文件内容'); }
      if (data && data.version && data.version !== VERSION) throw new Error('备份版本不受支持');
      const rows = Array.isArray(data) ? data : data && data.items;
      if (!Array.isArray(rows)) throw new Error('JSON 需要是条目数组，或包含 items 数组');
      if (rows.length > LIMIT) throw new Error('每次最多导入 ' + LIMIT + ' 条');
      return { rows, backup: !!(data && data.app === 'funnel' && data.version === VERSION) };
    }
    const rows = [];
    // A share paragraph may contain surrounding text, URLs and platform-specific punctuation.
    const blocks = raw.split(/\n\s*\n/);
    blocks.forEach(block => {
      const lines = block.split('\n');
      const links = [];
      lines.forEach(line => {
        const matches = line.match(/https?:\/\/[^\s<>"'，。；！？、【】「」《》（）]+/gi) || [];
        matches.forEach(u => {
          const url = u.replace(/[.,;!?)\]】]+$/, '');
          links.push({ url, line });
        });
      });
      if (links.length) links.forEach(({ url, line }) => {
        const title = (links.length === 1 ? block : line).replace(/https?:\/\/[^\s]+/gi, '').replace(/[|｜]/g, '').trim();
        rows.push({ url, title: title || hostname(url) });
      });
      else rows.push({ title: block.split('\n')[0], content: block });
    });
    if (rows.length > LIMIT) throw new Error('每次最多导入 ' + LIMIT + ' 条');
    return { rows, backup: false };
  }
  function validDate(v) { return typeof v === 'string' && Number.isFinite(Date.parse(v)); }
  function normalize(row, opts, now, index, backup) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return null;
    let url = row.url;
    const nid = text(row.note_id || row.noteId, 64);
    if (!url && /^[a-z\d]{10,64}$/i.test(nid)) url = 'https://www.xiaohongshu.com/explore/' + nid + (row.xsec_token ? '?xsec_token=' + encodeURIComponent(text(row.xsec_token, 512)) : '');
    if (url && !safeURL(url)) return null;
    url = safeURL(url);
    const title = text(opts.title || row.title || row.desc || (url ? hostname(url) : row.content), 200);
    if (!title) return null;
    const days = [3, 7, 30].includes(Number(opts.days)) ? Number(opts.days) : 7;
    const createdAt = backup && validDate(row.createdAt) ? row.createdAt : iso(now);
    const expiresAt = backup && validDate(row.expiresAt) ? row.expiresAt : iso(now + days * DAY);
    const status = backup && ['pending', 'done', 'released'].includes(row.status) ? row.status : 'pending';
    const finishedAt = backup && status !== 'pending' && validDate(row.finishedAt) ? row.finishedAt : null;
    return {
      id: now.toString(36) + '-' + index + '-' + Math.random().toString(36).slice(2, 10),
      url, title, content: text(row.content, 10000), source: source(url),
      reason: text(opts.reason || row.reason, 500), note: backup ? text(row.note, 4000) : '',
      createdAt, expiresAt, status, finishedAt, extended: backup && row.extended === true
    };
  }
  function validateState(data) {
    if (!data || data.version !== VERSION || !Array.isArray(data.items) || data.items.length > LIMIT) throw new Error('本地数据无法读取，请先导出原始数据，再恢复备份');
    const ids = new Set();
    for (const it of data.items) {
      if (!it || typeof it.id !== 'string' || ids.has(it.id) || !text(it.title, 200) || (it.url && !safeURL(it.url)) || !['pending', 'done', 'released'].includes(it.status) || !validDate(it.createdAt) || !validDate(it.expiresAt)) throw new Error('本地条目格式异常，请先导出原始数据');
      ids.add(it.id);
    }
    return data;
  }
  function importItems(state, parsed, opts, now) {
    validateState(state); opts = opts || {}; now = now || Date.now();
    const seen = new Set(state.items.map(identity));
    const added = []; let skipped = 0;
    parsed.rows.forEach((row, i) => {
      const it = normalize(row, opts, now, i, parsed.backup);
      if (!it || seen.has(identity(it))) { skipped++; return; }
      seen.add(identity(it)); added.push(it);
    });
    if (state.items.length + added.length > LIMIT) throw new Error('最多保存 ' + LIMIT + ' 条，请先备份并清理历史内容');
    const next = { version: VERSION, items: added.concat(state.items) };
    if (byteSize(backup(next)) > 900000) throw new Error('本地内容已接近 900 KB，请先备份并清理历史内容，确保备份能完整恢复');
    return { state: next, imported: added.length, skipped };
  }
  function update(state, id, action, note, now) {
    validateState(state); now = now || Date.now();
    const found = state.items.find(i => i.id === id);
    if (!found) throw new Error('条目不存在');
    const item = Object.assign({}, found);
    if (action === 'delete') return { version: VERSION, items: state.items.filter(i => i.id !== id) };
    if (action === 'extend') {
      if (item.status !== 'pending' || item.extended) throw new Error('每条待处理内容只能续期一次');
      item.extended = true; item.expiresAt = iso(Math.max(now, Date.parse(item.expiresAt)) + 7 * DAY);
    } else if (action === 'done' || action === 'released') {
      if (item.status !== 'pending') throw new Error('该内容已处理');
      item.status = action; item.finishedAt = iso(now); item.note = text(note, 4000);
    } else if (action === 'restore') {
      if (item.status === 'pending') throw new Error('该内容已经在队列里');
      item.status = 'pending'; item.finishedAt = null; item.expiresAt = iso(now + 7 * DAY); item.extended = false;
    } else throw new Error('未知操作');
    const next = { version: VERSION, items: state.items.map(i => i.id === id ? item : i) };
    if (byteSize(backup(next)) > 900000) throw new Error('内容过多，保存前请先备份并清理历史内容');
    return next;
  }
  function view(state, now) {
    now = now || Date.now();
    const pending = state.items.filter(i => i.status === 'pending').sort((a, b) => Date.parse(a.expiresAt) - Date.parse(b.expiresAt));
    const overdue = pending.filter(i => Date.parse(i.expiresAt) <= now);
    const active = pending.filter(i => Date.parse(i.expiresAt) > now);
    const done = state.items.filter(i => i.status === 'done');
    const released = state.items.filter(i => i.status === 'released');
    const history = state.items.filter(i => i.status !== 'pending').sort((a, b) => Date.parse(b.finishedAt || b.createdAt) - Date.parse(a.finishedAt || a.createdAt));
    const bySource = Array.from(new Set(state.items.map(i => i.source))).map(name => {
      const all = state.items.filter(i => i.source === name);
      return { name, total: all.length, done: all.filter(i => i.status === 'done').length };
    });
    return { queue: active.slice(0, 3), archive: active.slice(3), overdue, history, bySource,
      stats: { total: state.items.length, pending: pending.length, done: done.length, released: released.length, overdue: overdue.length, rate: state.items.length ? Math.round(done.length / state.items.length * 100) : 0 } };
  }
  function backup(state) { return JSON.stringify(Object.assign({ app: 'funnel', exportedAt: iso(Date.now()) }, state), null, 2); }
  function label(it, now) {
    if (it.status === 'done') return '已读完';
    if (it.status === 'released') return '已放走';
    const diff = Date.parse(it.expiresAt) - (now || Date.now());
    return diff <= 0 ? '已到期 · 待决定' : '剩余 ' + Math.ceil(diff / DAY) + ' 天';
  }
  return { VERSION, LIMIT, KEY, fresh, source, safeURL, parseInput, importItems, update, view, backup, label, validateState };
}));
