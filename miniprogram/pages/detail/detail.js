const core = require('../../lib/core');
const store = require('../../lib/store');
Page({
  data: { item: null, note: '' },
  onLoad(options) { this.id = options.id; },
  onShow() { this.refresh(); },
  refresh() {
    try { const item = store.load().items.find(i => i.id === this.id); if (!item) throw new Error('内容不存在'); this.setData({ item, timing: core.label(item), note: item.note || '' }); } catch (e) { store.fail(e); }
  },
  note(e) { this.setData({ note: e.detail.value }); },
  copy() { if (this.data.item.url) wx.setClipboardData({ data: this.data.item.url, fail() { store.fail(new Error('复制未完成，请重试')); } }); },
  action(e) {
    const action = e.currentTarget.dataset.action;
    const run = () => {
      try { store.save(core.update(store.load(), this.id, action, this.data.note)); if (action === 'delete') wx.navigateBack(); else { this.refresh(); wx.showToast({ title: '已保存', icon: 'success' }); } } catch (err) { store.fail(err); }
    };
    if (action === 'delete') wx.showModal({ title: '永久删除这条内容？', content: '该内容和总结将被移除，统计也会更新。', confirmColor: '#a44828', success(r) { if (r.confirm) run(); } });
    else run();
  }
});
