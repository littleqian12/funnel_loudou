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
})();
