'use strict';
const C = window.Funnel;
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let state, storageError, tab = 'queue';
function read() {
  try { const raw = localStorage.getItem(C.KEY); state = raw ? C.validateState(JSON.parse(raw)) : C.fresh(); storageError = null; }
  catch (e) { state = null; storageError = e; }
}
function commit(next) {
  C.validateState(next);
  try { localStorage.setItem(C.KEY, JSON.stringify(next)); } catch (_) { throw new Error('保存失败，请检查浏览器存储空间并先备份数据'); }
  state = next;
}
function toast(message) { $('#toast').textContent = message; $('#toast').hidden = false; clearTimeout(toast.timer); toast.timer = setTimeout(() => $('#toast').hidden = true, 4000); }
function download(data, name) {
  const url = URL.createObjectURL(new Blob([data], { type: 'application/json;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = name || 'funnel-backup-' + new Date().toISOString().slice(0, 10) + '.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function openDialog(html) { $('#dialog').innerHTML = html; if (!$('#dialog').open) $('#dialog').showModal(); }
function head(title) { return `<div class="dialog-head"><h3>${esc(title)}</h3><button class="close" data-act="close" aria-label="关闭">×</button></div>`; }
function cards(items) {
  return items.map(it => `<article class="card item" tabindex="0" role="button" data-act="detail" data-id="${esc(it.id)}"><span class="badge">${esc(it.source)}</span><span class="badge ${Date.parse(it.expiresAt) <= Date.now() && it.status === 'pending' ? 'danger' : ''}">${esc(C.label(it))}</span><div class="item-title">${esc(it.title)}</div><p class="reason">${esc(it.status === 'pending' ? it.reason : it.note)}</p></article>`).join('');
}
function render() {
  $('#nav').innerHTML = [['queue', '队列'], ['history', '已处理'], ['stats', '统计'], ['me', '我的']].map(([id, label]) => `<button data-act="tab" data-tab="${id}" class="${tab === id ? 'on' : ''}" aria-current="${tab === id ? 'page' : 'false'}">${label}</button>`).join('');
  if (storageError) { $('#view').innerHTML = `<h1>暂时无法读取数据。</h1><p class="error">数据未被覆盖。先导出原始数据以便恢复。</p><button class="btn" data-act="raw">导出原始数据</button><button class="btn danger wide" data-act="clear">备份后清空并重新开始</button>`; return; }
  const v = C.view(state), s = v.stats;
  let html = '';
  if (tab === 'queue') {
    html = `<div class="eyebrow">Less saved. More understood.</div><h1>给收藏一个出口。</h1><p class="muted intro">今天读一点，或者安心放走一点。<br>把「以后再看」变成一次有期限的预约。</p><div class="toolbar"><h2>今日队列 <span class="muted">${v.queue.length} / 3</span></h2><button class="btn" data-act="import">＋ 导入收藏</button></div>`;
    if (!s.total) html += `<div class="card empty"><div class="empty-mark">⌁</div><strong>从一条真正想读的内容开始</strong>复制文章或视频链接，在这里预约。<br>收藏很轻，读完才会留下东西。</div>`;
    else {
      if (v.overdue.length) html += `<h2>到期了，做个决定 <span class="muted">${v.overdue.length} 条</span></h2>${cards(v.overdue)}`;
      html += cards(v.queue) || '<div class="empty">今天没有未到期的预约。</div>';
      if (v.archive.length) html += `<details><summary>稍后处理 · ${v.archive.length} 条</summary>${cards(v.archive)}</details>`;
    }
  } else if (tab === 'history') html = `<div class="eyebrow">Every decision counts</div><h1>留下一点，放下一点。</h1><p class="muted">你读完的收获，和你放走的负担。</p>${cards(v.history) || '<div class="card empty">读完或放走的内容会出现在这里。</div>'}`;
  else if (tab === 'stats') html = `<div class="eyebrow">Your actual progress</div><h1>看见真实的进展。</h1><div class="card"><span class="muted">累计读完率</span><div class="rate">${s.rate}%</div><span class="muted">读完 ${s.done} 条 ÷ 当前全部 ${s.total} 条</span></div><div class="stats">${[['待处理', s.pending], ['读完', s.done], ['放走', s.released]].map(([l, n]) => `<div class="stat"><b>${n}</b><span>${l}</span></div>`).join('')}</div><h2>内容来自哪里</h2><div class="card">${v.bySource.map(x => `<div class="line row"><span>${esc(x.name)}</span><span class="muted">读完 ${x.done} / ${x.total}</span></div>`).join('') || '<div class="empty">导入后显示真实统计。</div>'}</div><p class="muted">放走内容仍计入总量；永久删除后统计同步更新。</p>`;
  else html = `<div class="eyebrow">A quiet place for your thoughts</div><h1>你的内容，留在本地。</h1><p class="muted intro">无需登录，不上传收藏。浏览器版与微信小程序各自保存数据，可通过 JSON 备份迁移。</p><div class="note">清理浏览器、微信缓存或换设备可能造成数据丢失，请定期导出备份。</div><button class="btn wide" data-act="backup">导出 JSON 备份</button><button class="btn secondary wide" data-act="import">导入内容 / 恢复备份</button><button class="btn secondary wide" data-act="privacy">隐私与使用说明</button><button class="btn danger wide" data-act="clear">删除全部数据</button><p class="muted">旧演示版的数据仍留在原浏览器存储中，本版本不会自动混入演示数据。</p>`;
  $('#view').innerHTML = html;
}
function importDialog() {
  openDialog(head('把想读的带进来') + `<p class="muted">支持公众号链接、小红书／抖音分享文案、每行一条的多链接、文字和 JSON 备份。多段文字用空行分隔。</p><form id="import-form"><label for="input">内容</label><textarea id="input" required maxlength="2000000" placeholder="在来源 App 复制，再粘贴到这里"></textarea><label for="file">或选择 JSON 文件</label><input id="file" type="file" accept=".json,application/json"><label for="title">标题（可选，仅对单条内容生效）</label><input id="title" maxlength="200"><label for="reason">为什么值得读？（恢复备份可留空）</label><input id="reason" maxlength="500"><label for="days">计划多久读完？</label><select id="days"><option value="3">3 天</option><option value="7" selected>7 天</option><option value="30">30 天</option></select><p class="muted">到期后等待你决定，不自动删除。这里只导入你提供的内容，不自动同步平台账号。</p><div id="preview"></div><p id="error" class="error" role="alert"></p><button class="btn wide" type="submit">检查导入内容</button></form>`);
  let checked = null;
  $('#file').onchange = async e => {
    try {
      const f = e.target.files[0]; if (!f) return;
      if (f.size > 2000000) throw new Error('文件不能超过 2 MB');
      $('#input').value = await f.text(); checked = null; $('#preview').innerHTML = ''; $('#import-form button[type=submit]').textContent = '检查导入内容';
    } catch (err) { $('#error').textContent = err.message; }
  };
  $('#import-form').oninput = () => { checked = null; $('#preview').innerHTML = ''; $('#import-form button[type=submit]').textContent = '检查导入内容'; };
  $('#import-form').onsubmit = e => {
    e.preventDefault(); $('#error').textContent = '';
    try {
      const parsed = C.parseInput($('#input').value);
      const opts = { reason: $('#reason').value, days: +$('#days').value, title: parsed.rows.length === 1 ? $('#title').value : '' };
      const result = C.importItems(state, parsed, opts);
      if (!result.imported) throw new Error('没有新内容，可能全部重复或格式无效');
      if (!checked) {
        checked = true;
        $('#preview').innerHTML = `<div class="note">将新增 ${result.imported} 条，跳过 ${result.skipped} 条重复或无效内容。${parsed.backup ? '将合并备份并保留状态和日期。' : ''}</div>${result.state.items.slice(0, Math.min(5, result.imported)).map(it => `<div class="line">${esc(it.title)} <span class="muted">${esc(it.source)}</span></div>`).join('')}${result.imported > 5 ? '<p class="muted">仅预览前 5 条</p>' : ''}`;
        $('#import-form button[type=submit]').textContent = '确认导入 ' + result.imported + ' 条'; return;
      }
      if (!parsed.backup && !opts.reason.trim()) throw new Error('请写一句话理由，约定为什么要读这些内容');
      commit(result.state); $('#dialog').close(); tab = 'queue'; render(); toast('已导入 ' + result.imported + ' 条');
    } catch (err) { $('#error').textContent = err.message; }
  };
}
function detail(id) {
  const it = state.items.find(i => i.id === id); if (!it) return;
  openDialog(head(it.title) + `<span class="badge">${esc(it.source)}</span><span class="badge">${esc(C.label(it))}</span><h2>收藏的理由</h2><div class="body">${esc(it.reason || '未填写')}</div>${it.url ? `<div class="card"><div class="linktext">${esc(it.url)}</div><div class="actions"><button class="btn secondary" data-act="copy" data-id="${esc(id)}">复制原文链接</button><a class="btn secondary" target="_blank" rel="noopener noreferrer" href="${esc(it.url)}">打开原文 ↗</a></div></div>` : ''}${it.content ? `<div class="card body">${esc(it.content)}</div>` : ''}${it.status === 'pending' ? `<label for="note">读完后，留下一点收获（可选）</label><textarea id="note" maxlength="4000">${esc(it.note)}</textarea><div class="actions"><button class="btn" data-act="done" data-id="${esc(id)}">我读完了</button><button class="btn secondary" data-act="released" data-id="${esc(id)}">放走</button>${!it.extended ? `<button class="btn secondary" data-act="extend" data-id="${esc(id)}">续期 7 天 · 仅一次</button>` : ''}</div>` : `<div class="card body">${esc(it.note || '没有留下总结')}</div><button class="btn secondary" data-act="restore" data-id="${esc(id)}">重新预约 · 7 天</button>`}<button class="btn danger wide" data-act="delete" data-id="${esc(id)}">永久删除</button>`);
}
const privacy = `漏斗仅处理你主动粘贴或选择文件导入的标题、链接、文字、理由和阅读总结，以及预约日期和处理状态。\n\n内容保存在当前浏览器本地存储，不调用服务器，不包含广告、跟踪 SDK，不读取平台账号或自动读取剪贴板。网页本身由你打开的站点提供，部署方仍可能记录基础访问日志。\n\n导入链接不会自动请求平台正文。复制原文链接时会写入剪贴板；打开原文会访问对应第三方网站，其数据处理规则由原网站决定。\n\n备份包含全部收藏和总结，保存在你选择的位置。恢复备份以合并方式去重，不覆盖现有条目。\n\n到期后内容仍保留，等待你读完、续期或放走。永久删除会移除条目并更新统计，删除后只能从备份恢复。\n\n清理缓存或更换浏览器可能丢失数据，请定期备份。微信小程序和浏览器版不自动同步，可用 JSON 备份迁移。`;
document.addEventListener('click', async e => {
  const target = e.target.closest('[data-act]'); if (!target) return;
  const action = target.dataset.act, id = target.dataset.id;
  try {
    if (action === 'tab') { tab = target.dataset.tab; render(); }
    else if (action === 'close') $('#dialog').close();
    else if (action === 'import') importDialog();
    else if (action === 'detail') detail(id);
    else if (action === 'backup') download(C.backup(state));
    else if (action === 'raw') download(localStorage.getItem(C.KEY) || '', 'funnel-recovery.json');
    else if (action === 'privacy') openDialog(head('隐私与使用说明') + `<div class="body muted">${esc(privacy)}</div>`);
    else if (action === 'copy') {
      const it = state.items.find(i => i.id === id);
      try { await navigator.clipboard.writeText(it.url); toast('已复制，请到来源 App 打开'); }
      catch (_) { toast('复制未完成，请手动选择链接复制'); }
    } else if (action === 'clear') {
      if (!confirm('永久删除全部收藏和总结？建议先导出备份。')) return;
      commit(C.fresh()); storageError = null; render(); toast('已删除全部数据');
    } else if (['done', 'released', 'extend', 'restore', 'delete'].includes(action)) {
      if (action === 'delete' && !confirm('永久删除这条内容及总结？统计也会更新。')) return;
      commit(C.update(state, id, action, $('#note') ? $('#note').value : '')); $('#dialog').close(); render(); toast('已保存');
    }
  } catch (err) { toast(err.message); }
});
document.addEventListener('keydown', e => { const t = e.target.closest('.item'); if (t && ['Enter', ' '].includes(e.key)) { e.preventDefault(); detail(t.dataset.id); } });
window.addEventListener('storage', e => { if (e.key === C.KEY) { read(); $('#dialog').close(); render(); } });
window.addEventListener('focus', () => { if (!$('#dialog').open) { read(); render(); } });
read(); render();
