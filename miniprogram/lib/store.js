const core = require('./core');
function load() {
  const raw = wx.getStorageSync(core.KEY);
  return raw === '' || raw == null ? core.fresh() : core.validateState(raw);
}
function save(state) {
  core.validateState(state);
  // Commit storage first; callers only update UI after successful persistence.
  try { wx.setStorageSync(core.KEY, state); }
  catch (_) { throw new Error('保存失败，可能是设备空间不足。原数据未在界面中替换，请先备份'); }
  return state;
}
function fail(error) { wx.showModal({ title: '操作未完成', content: error.message || '请稍后重试', showCancel: false }); }
function exportFile(raw) {
  const path = wx.env.USER_DATA_PATH + '/funnel-backup-' + Date.now() + '.json';
  wx.getFileSystemManager().writeFile({
    filePath: path, data: typeof raw === 'string' ? raw : JSON.stringify(raw, null, 2), encoding: 'utf8',
    success() {
      if (wx.shareFileMessage) wx.shareFileMessage({ filePath: path, fail(e) { if (!/cancel/.test(e.errMsg || '')) fail(new Error('文件分享未完成，请重试')); } });
      else fail(new Error('当前微信版本不支持分享备份文件，请升级微信'));
    }, fail() { fail(new Error('备份文件写入失败，请检查设备空间')); }
  });
}
module.exports = { load, save, fail, exportFile };
