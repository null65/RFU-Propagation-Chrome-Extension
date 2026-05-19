const API = 'https://radioforus.co.uk/api/propagation-summary.php';

let lastData = null;
let favorites = { hf: [], vhf: [] };
let showAllBands = false;
let fetchedAtMs = 0;
let theme = 'dark';
let staleHours = 6;
let labelMap = { hf: {}, vhf: {} };

function staleMs() {
  return staleHours * 60 * 60 * 1000;
}

function fmtUpdated(iso) {
  if (!iso) return 'Updated unknown';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Updated recently';
  return 'Updated ' + d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function pill(text, tone) {
  const t = tone || 'na';
  const el = document.createElement('span');
  el.className = 'pill ' + t;
  el.textContent = text || '—';
  return el;
}

function toneFromLabel(label) {
  const s = String(label || '').toLowerCase();
  if (s === 'good') return 'good';
  if (s === 'fair') return 'fair';
  if (s === 'poor') return 'poor';
  if (s === '—' || s === '') return 'na';
  return 'neutral';
}

function normalizeSynopsis(raw) {
  const t = String(raw || '').trim();
  if (t === '' || t === '—') return '—';
  const s = t.toLowerCase();
  if (/\b(good|excellent|open|strong|wide)\b/.test(s)) return 'Good';
  if (/\b(fair|moderate|average|avg)\b/.test(s)) return 'Fair';
  if (/\b(poor|bad|closed|quiet|none|not)\b/.test(s)) return 'Poor';
  if (/\b(skip|es|aurora|eor|tep|sporadic|active)\b/.test(s)) return 'Fair';
  if (s.indexOf('good') !== -1) return 'Good';
  if (s.indexOf('fair') !== -1) return 'Fair';
  if (s.indexOf('poor') !== -1 || s.indexOf('closed') !== -1) return 'Poor';
  return '—';
}

function normalizeBandRow(r) {
  if (!r || typeof r !== 'object') return r;
  if (r.day !== undefined && r.night !== undefined) {
    const day = normalizeSynopsis(r.day);
    const night = normalizeSynopsis(r.night);
    return {
      key: r.key,
      label: r.label,
      day: day,
      night: night,
      day_tone: r.day_tone || toneFromLabel(day),
      night_tone: r.night_tone || toneFromLabel(night)
    };
  }
  const raw = r.status !== undefined ? r.status : '—';
  const syn = normalizeSynopsis(raw);
  return {
    key: r.key,
    label: r.label,
    day: syn,
    night: syn,
    day_tone: r.tone || toneFromLabel(syn),
    night_tone: r.tone || toneFromLabel(syn)
  };
}

const VHF_KEYS = { '6m': 1, '4m': 1, '2m': 1, '70cm': 1 };

function bandKey(row) {
  return (row && row.key) ? row.key : (row && row.label ? row.label : '');
}

function isMufRow(row) {
  const k = bandKey(row).toLowerCase();
  const l = String(row && row.label ? row.label : '').toLowerCase();
  const s = String(row && row.subtitle ? row.subtitle : '').toLowerCase();
  return k.indexOf('muf') !== -1 || l.indexOf('muf') !== -1 || s.indexOf('muf') !== -1;
}

function scrubRows(rows, kind) {
  return (rows || []).filter(function (r) {
    if (isMufRow(r)) return false;
    if (kind === 'vhf') {
      const k = bandKey(r);
      if (!VHF_KEYS[k]) return false;
    }
    return true;
  });
}

function isFavorite(kind, key) {
  const list = favorites[kind] || [];
  return list.indexOf(key) !== -1;
}

function totalFavorites() {
  return (favorites.hf || []).length + (favorites.vhf || []).length;
}

function toggleFavorite(kind, key) {
  if (!favorites[kind]) favorites[kind] = [];
  const list = favorites[kind];
  const i = list.indexOf(key);
  if (i === -1) {
    list.push(key);
    showAllBands = false;
  } else {
    list.splice(i, 1);
  }
  saveFavorites();
  if (lastData) renderBands(lastData);
  renderFavList();
}

function saveFavorites() {
  chrome.storage.local.set({ favorites: favorites });
}

function filterByFavorites(rows, kind) {
  if (showAllBands || totalFavorites() === 0) {
    return rows;
  }
  const list = favorites[kind] || [];
  return rows.filter(function (r) {
    return list.indexOf(bandKey(r)) !== -1;
  });
}

function applyTheme(next) {
  theme = next === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  const sel = document.getElementById('setting-theme');
  if (sel && sel.value !== theme) sel.value = theme;
  chrome.storage.local.set({ theme: theme });
}

function normalizeCallsign(raw) {
  return String(raw || '').trim().toUpperCase().replace(/[^A-Z0-9/]/g, '');
}

function applyCallsignLinks() {
  const input = document.getElementById('callsign');
  const call = normalizeCallsign(input ? input.value : '');
  const personal = document.getElementById('link-psk-call');
  if (!personal) return;
  if (call) {
    personal.hidden = false;
    personal.href = 'https://pskreporter.info/pskmap.html?callsign=' + encodeURIComponent(call);
    personal.textContent = 'PSK map · ' + call;
  } else {
    personal.hidden = true;
  }
}

function updateStaleBanner(data) {
  const el = document.getElementById('stale-warn');
  if (!el) return;
  let ageMs = 0;
  if (fetchedAtMs > 0) {
    ageMs = Date.now() - fetchedAtMs;
  } else if (data && data.updated) {
    const t = Date.parse(data.updated);
    if (!Number.isNaN(t)) ageMs = Date.now() - t;
  }
  el.hidden = ageMs <= staleMs();
}

function updateFavUi() {
  const btn = document.getElementById('btn-show-all');
  const filtering = totalFavorites() > 0 && !showAllBands;
  if (btn) btn.hidden = !filtering;
}

function makeFavButton(kind, key) {
  const fav = document.createElement('button');
  fav.type = 'button';
  const on = isFavorite(kind, key);
  fav.className = 'fav-btn' + (on ? ' on' : '');
  fav.setAttribute('aria-label', on ? 'Remove favourite' : 'Add favourite');
  fav.textContent = on ? '★' : '☆';
  fav.addEventListener('click', function (e) {
    e.preventDefault();
    toggleFavorite(kind, key);
  });
  return fav;
}

function renderBandRow(kind, r) {
  const row = normalizeBandRow(r);
  const key = bandKey(row);
  const el = document.createElement('div');
  el.className = 'row band-row';
  el.appendChild(makeFavButton(kind, key));
  const name = document.createElement('span');
  name.className = 'name';
  name.textContent = row.label || key;
  el.appendChild(name);
  el.appendChild(pill(row.day, row.day_tone));
  el.appendChild(pill(row.night, row.night_tone));
  return el;
}

function renderList(kind, rows, listId, emptyMsg) {
  const list = document.getElementById(listId);
  list.innerHTML = '';
  const cleaned = scrubRows(rows, kind).map(normalizeBandRow);
  cleaned.forEach(function (r) {
    const k = bandKey(r);
    if (k) labelMap[kind][k] = r.label || k;
  });
  const visible = filterByFavorites(cleaned, kind);
  if (visible.length === 0 && totalFavorites() > 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-msg';
    empty.textContent = emptyMsg;
    list.appendChild(empty);
    return;
  }
  visible.forEach(function (r) {
    list.appendChild(renderBandRow(kind, r));
  });
}

function renderBands(data) {
  renderList('hf', data.hf, 'hf-list', 'No favourite HF bands — star some rows or tap Show all.');
  renderList('vhf', data.vhf, 'vhf-list', 'No favourite VHF bands — star some rows or tap Show all.');
}

function renderFavList() {
  const ul = document.getElementById('fav-list');
  if (!ul) return;
  ul.innerHTML = '';
  const items = [];
  (favorites.hf || []).forEach(function (key) {
    items.push({ kind: 'hf', key: key, label: labelMap.hf[key] || key });
  });
  (favorites.vhf || []).forEach(function (key) {
    items.push({ kind: 'vhf', key: key, label: labelMap.vhf[key] || key });
  });
  if (items.length === 0) {
    const li = document.createElement('li');
    li.className = 'fav-empty';
    li.textContent = 'No favourites yet';
    ul.appendChild(li);
    return;
  }
  items.forEach(function (item) {
    const li = document.createElement('li');
    li.className = 'fav-chip';
    const tag = document.createElement('span');
    tag.className = 'fav-tag';
    tag.textContent = item.kind.toUpperCase();
    const name = document.createElement('span');
    name.textContent = item.label;
    const rm = document.createElement('button');
    rm.type = 'button';
    rm.className = 'fav-rm';
    rm.textContent = '×';
    rm.setAttribute('aria-label', 'Remove');
    rm.addEventListener('click', function () {
      toggleFavorite(item.kind, item.key);
    });
    li.appendChild(tag);
    li.appendChild(name);
    li.appendChild(rm);
    ul.appendChild(li);
  });
}

function render(data) {
  lastData = data;
  document.getElementById('updated').textContent = fmtUpdated(data.updated);
  updateFavUi();
  renderBands(data);
  renderFavList();
  updateStaleBanner(data);
  const err = document.getElementById('err');
  if (!data.ok) {
    err.hidden = false;
    err.textContent = data.message || 'Data unavailable';
  } else {
    err.hidden = true;
  }
  const dash = data.dashboard_url || 'https://radioforus.co.uk/propagation/index.php';
  const site = data.site_url || 'https://radioforus.co.uk/';
  document.getElementById('link-dash').href = dash;
  document.getElementById('link-site').href = site;
  const dashMenu = document.getElementById('link-dash-menu');
  if (dashMenu) dashMenu.href = dash;
}

function loadFromCache(cb) {
  chrome.storage.local.get(['propSummary', 'propFetchedAt'], function (res) {
    fetchedAtMs = res.propFetchedAt || 0;
    if (res.propSummary) cb(res.propSummary);
  });
}

function fetchLive() {
  return fetch(API, { cache: 'no-store' }).then(function (r) {
    return r.json();
  });
}

function refresh() {
  document.getElementById('updated').textContent = 'Refreshing…';
  fetchLive()
    .then(function (data) {
      fetchedAtMs = Date.now();
      render(data);
      chrome.storage.local.set({
        propSummary: data,
        propFetchedAt: fetchedAtMs
      });
      chrome.runtime.sendMessage({ type: 'summary', payload: data }).catch(function () {});
    })
    .catch(function () {
      loadFromCache(function (cached) {
        if (cached) {
          render(cached);
          document.getElementById('err').hidden = false;
          document.getElementById('err').textContent = 'Offline — showing last saved data.';
        } else {
          document.getElementById('updated').textContent = 'Unavailable';
          document.getElementById('err').hidden = false;
          document.getElementById('err').textContent = 'Check your connection and that the API is deployed.';
        }
      });
    });
}

function switchTab(panelId) {
  document.querySelectorAll('.tab').forEach(function (tab) {
    const on = tab.getAttribute('data-panel') === panelId;
    tab.classList.toggle('active', on);
    tab.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  document.querySelectorAll('.panel').forEach(function (panel) {
    const on = panel.id === panelId;
    panel.classList.toggle('active', on);
    panel.hidden = !on;
  });
  if (panelId === 'panel-settings') {
    renderFavList();
  }
}

function migrateFavorites(res) {
  favorites = { hf: [], vhf: [] };
  if (res.favorites && typeof res.favorites === 'object') {
    if (Array.isArray(res.favorites.hf)) favorites.hf = res.favorites.hf.slice();
    if (Array.isArray(res.favorites.vhf)) favorites.vhf = res.favorites.vhf.slice();
  } else if (Array.isArray(res.hfFavorites)) {
    favorites.hf = res.hfFavorites.slice();
  }
}

function initSettings() {
  chrome.storage.local.get(
    ['favorites', 'hfFavorites', 'theme', 'callsign', 'staleHours', 'propSummary', 'propFetchedAt', 'activeTab'],
    function (res) {
      migrateFavorites(res);
      fetchedAtMs = res.propFetchedAt || 0;
      staleHours = parseInt(res.staleHours, 10) || 6;
      applyTheme(res.theme === 'light' ? 'light' : 'dark');
      const cs = document.getElementById('callsign');
      if (cs && res.callsign) cs.value = res.callsign;
      const staleSel = document.getElementById('setting-stale-hours');
      if (staleSel) staleSel.value = String(staleHours);
      applyCallsignLinks();
      renderFavList();
      if (res.propSummary) render(res.propSummary);
      if (res.activeTab) switchTab(res.activeTab);
      refresh();
    }
  );
}

document.querySelectorAll('.tab').forEach(function (tab) {
  tab.addEventListener('click', function () {
    const panelId = tab.getAttribute('data-panel');
    switchTab(panelId);
    chrome.storage.local.set({ activeTab: panelId });
  });
});

document.getElementById('setting-theme').addEventListener('change', function () {
  applyTheme(this.value);
});

document.getElementById('setting-stale-hours').addEventListener('change', function () {
  staleHours = parseInt(this.value, 10) || 6;
  chrome.storage.local.set({ staleHours: staleHours });
  if (lastData) updateStaleBanner(lastData);
});

document.getElementById('btn-show-all').addEventListener('click', function () {
  showAllBands = true;
  updateFavUi();
  if (lastData) renderBands(lastData);
});

document.getElementById('btn-clear-favs').addEventListener('click', function () {
  favorites = { hf: [], vhf: [] };
  showAllBands = true;
  saveFavorites();
  updateFavUi();
  if (lastData) renderBands(lastData);
  renderFavList();
});

document.getElementById('btn-refresh-top').addEventListener('click', refresh);

document.getElementById('callsign').addEventListener('input', applyCallsignLinks);

document.getElementById('callsign').addEventListener('change', function () {
  const call = normalizeCallsign(this.value);
  this.value = call;
  chrome.storage.local.set({ callsign: call });
  applyCallsignLinks();
});

initSettings();
