const core = require('../../lib/core');
const store = require('../../lib/store');
Page({
  data: { input: '', title: '', reason: '', days: 7, preview: [], count: 0, backup: false, busy: false },
  field(e) { this.setData({ [e.currentTarget.dataset.field]: e.detail.value, preview: [], count: 0 }); this.parsed = null; },
  days(e) { this.setData({ days: Number(e.currentTarget.dataset.days) }); },
  preview() {
    try {
      const parsed = core.parseInput(this.data.input);
      const result = core.importItems(store.load(), parsed, { days: this.data.days, reason: this.data.reason, title: parsed.rows.length === 1 ? this.data.title : '' });
      this.parsed = parsed;
      this.setData({ preview: result.state.items.slice(0, Math.min(5, result.imported)), count: result.imported, skipped: result.skipped, backup: parsed.backup });
      if (!result.imported) wx.showToast({ title: '没有新内容，可能已导入或格式无效', icon: 'none' });
    } catch (e) { store.fail(e); }
  },
  submit() {
    if (this.data.busy) return;
    if (!this.parsed || !this.data.count) return this.preview();
    if (!this.parsed.backup && !this.data.reason.trim()) return store.fail(new Error('请写一句话理由，约定为什么要读这些内容'));
    this.setData({ busy: true });
    try {
      const result = core.importItems(store.load(), this.parsed, { days: this.data.days, reason: this.data.reason, title: this.parsed.rows.length === 1 ? this.data.title : '' });
      store.save(result.state);
      wx.showModal({ title: '导入完成', content: '新增 ' + result.imported + ' 条，跳过 ' + result.skipped + ' 条重复或无效内容。', showCancel: false, success() { wx.navigateBack(); } });
    } catch (e) { store.fail(e); }
    finally { this.setData({ busy: false }); }
  }
});
