/* 更新日志首条若比 Marketplace 已上架版本新,就在条目上打「待上架」标注。
 * 运行时查 gallery API:上架后刷新页面标注自动消失,不用重新发站。
 * 查询失败保持原样(宁可没有标注,也不写错状态)。 */
(() => {
  const list = document.querySelector('.upd');
  const first = list && list.querySelector('li');
  const vEl = first && first.querySelector('.v');
  const siteVersion = vEl ? vEl.textContent.trim() : '';
  if (!/^\d+\.\d+\.\d+$/.test(siteVersion)) { return; }

  const body = {
    filters: [{
      criteria: [{ filterType: 7, value: 'gmsy.md-toolkit' }],
      pageNumber: 1, pageSize: 1, sortBy: 0, sortOrder: 0
    }],
    assetTypes: [],
    flags: 914
  };
  const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), 8000) : 0;

  fetch('https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json;api-version=7.2-preview.1'
    },
    body: JSON.stringify(body),
    signal: ctrl ? ctrl.signal : undefined
  }).then(r => (r.ok ? r.json() : null)).then(data => {
    if (timer) { clearTimeout(timer); }
    const ext = data && data.results && data.results[0] &&
      data.results[0].extensions && data.results[0].extensions[0];
    const versions = ext && ext.versions;
    const latest = versions && versions[0] && versions[0].version;
    if (!latest || compare(siteVersion, latest) <= 0) { return; }

    const div = first.querySelector('div');
    if (!div) { return; }
    const badge = document.createElement('span');
    badge.className = 'upd-badge';
    badge.textContent = 'Marketplace 待上架 · 当前 ' + latest;
    badge.title = siteVersion + ' 尚未在 VS Code Marketplace 上架，当前可安装版本为 ' + latest;
    badge.setAttribute('data-site-version', siteVersion);
    badge.setAttribute('data-marketplace-version', latest);
    const lede = div.querySelector('b');
    if (lede) { lede.after(badge); } else { div.insertBefore(badge, div.firstChild); }
  }).catch(() => {
    if (timer) { clearTimeout(timer); }
  });

  function compare(a, b) {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
      if (pa[i] !== pb[i]) { return pa[i] - pb[i]; }
    }
    return 0;
  }
})();
