const core = require('../../lib/core');
const store = require('../../lib/store');
Page({
  data: { tab: 'queue', failed: false, stats: {}, queue: [], overdue: [], archive: [], history: [], bySource: [] },
  onShow() { this.visibleCount = 30; this.refresh(); },
  refresh() {
    try {
      const v = core.view(store.load());
      const counts = {};
      ['queue', 'overdue', 'archive', 'history'].forEach(k => {
        counts[k + 'Total'] = v[k].length;
        v[k] = v[k].slice(0, this.visibleCount || 30).map(it => ({
          id: it.id, title: it.title, source: it.source, reason: it.reason,
          note: (it.note || '').slice(0, 160), timing: core.label(it)
        }));
      });
      Object.assign(v, counts);
      this.setData(Object.assign({ failed: false }, v));
    } catch (e) { this.setData({ failed: true }); store.fail(e); }
  },
  tab(e) { this.visibleCount = 30; this.setData({ tab: e.currentTarget.dataset.tab }); this.refresh(); },
  more() { this.visibleCount = (this.visibleCount || 30) + 30; this.refresh(); },
  add() { wx.navigateTo({ url: '/pages/import/import' }); },
  detail(e) { wx.navigateTo({ url: '/pages/detail/detail?id=' + encodeURIComponent(e.currentTarget.dataset.id) }); },
  privacy() { wx.navigateTo({ url: '/pages/privacy/privacy' }); },
  backup() { try { store.exportFile(core.backup(store.load())); } catch (e) { store.fail(e); } },
  rawBackup() { try { store.exportFile(wx.getStorageSync(core.KEY)); } catch (e) { store.fail(e); } },
  clear() {
    wx.showModal({ title: '删除全部数据？', content: '收藏、总结和统计将永久删除。建议先导出备份。', confirmText: '删除全部', confirmColor: '#a44828', success: r => {
      if (!r.confirm) return;
      try { store.save(core.fresh()); this.refresh(); wx.showToast({ title: '已清空', icon: 'none' }); } catch (e) { store.fail(e); }
    } });
  }
});
