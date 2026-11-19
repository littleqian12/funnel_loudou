/* Seeds a synthetic demo snapshot for the public preview.
 * The production app and the WeChat mini program never load this file.
 */
(function () {
  'use strict';
  const KEY = 'funnel_real_v1';
  const params = new URLSearchParams(location.search);
  const auto = window.FUNNEL_DEMO_AUTO === true || params.has('demo');
  if (!auto || !window.FunnelDemoData) return;

  try {
    const reset = params.get('demo') === 'reset';
    if (reset || !localStorage.getItem(KEY)) {
      localStorage.setItem(KEY, JSON.stringify(window.FunnelDemoData.build(Date.now())));
    }
  } catch (_) {
    return;
  }

  function mount() {
    if (document.getElementById('demo-notice')) return;
    const style = document.createElement('style');
    style.textContent = [
      '#demo-notice{position:sticky;top:0;z-index:50;display:flex;align-items:center;justify-content:center;gap:14px;background:#1f4f36;color:#fff;padding:9px 16px;font:12px/1.4 -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif}',
      '#demo-notice span{opacity:.92}',
      '#demo-notice button{border:1px solid rgba(255,255,255,.55);background:transparent;color:#fff;border-radius:999px;padding:4px 10px;font-size:11px;cursor:pointer}',
      '@media(max-width:540px){#demo-notice{font-size:11px;gap:8px;padding:8px 10px}}'
    ].join('');
    document.head.appendChild(style);
    const bar = document.createElement('div');
    bar.id = 'demo-notice';
    bar.setAttribute('role', 'status');
    bar.innerHTML = '<span>演示数据 · 20 条收藏，仅保存在当前浏览器</span><button type="button" id="demo-reset">重置演示</button>';
    document.body.insertBefore(bar, document.body.firstChild);
    document.getElementById('demo-reset').addEventListener('click', () => {
      if (!confirm('重置为初始演示数据？当前操作会被清除。')) return;
      try { localStorage.removeItem(KEY); } catch (_) {}
      location.reload();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
