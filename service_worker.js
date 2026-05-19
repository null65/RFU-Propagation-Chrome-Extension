const API = 'https://radioforus.co.uk/api/propagation-summary.php';
const FETCH_TIMEOUT_MS = 8000;
const MIN_PULL_MS = 5 * 60 * 1000;

function badgeFromSummary(data) {
  if (!data || !data.ok || !Array.isArray(data.hf)) {
    return { text: '', color: '#64748b' };
  }
  let best = 'na';
  const rank = { good: 3, fair: 2, poor: 1, neutral: 0, na: 0 };
  data.hf.forEach(function (row) {
    const t = row.day_tone || 'na';
    if ((rank[t] || 0) > (rank[best] || 0)) best = t;
  });
  if (best === 'good') return { text: 'OK', color: '#15803d' };
  if (best === 'fair') return { text: '~', color: '#ca8a04' };
  if (best === 'poor') return { text: '!', color: '#b91c1c' };
  return { text: '', color: '#64748b' };
}

function applyBadge(data) {
  const b = badgeFromSummary(data);
  chrome.action.setBadgeText({ text: b.text });
  chrome.action.setBadgeBackgroundColor({ color: b.color });
}

function fetchLive() {
  const ctrl = new AbortController();
  const timer = setTimeout(function () {
    ctrl.abort();
  }, FETCH_TIMEOUT_MS);
  return fetch(API, { cache: 'no-store', signal: ctrl.signal })
    .then(function (r) {
      if (!r.ok) throw new Error('bad response');
      return r.json();
    })
    .finally(function () {
      clearTimeout(timer);
    });
}

function pull(force) {
  return new Promise(function (resolve) {
    chrome.storage.local.get(['propSummary', 'propFetchedAt'], function (res) {
      const last = res.propFetchedAt || 0;
      const cached = res.propSummary || null;
      if (!force && cached && Date.now() - last < MIN_PULL_MS) {
        applyBadge(cached);
        resolve(cached);
        return;
      }
      fetchLive()
        .then(function (data) {
          const at = Date.now();
          chrome.storage.local.set({ propSummary: data, propFetchedAt: at });
          applyBadge(data);
          resolve(data);
        })
        .catch(function () {
          if (cached) {
            applyBadge(cached);
            resolve(cached);
          } else {
            chrome.action.setBadgeText({ text: '?' });
            chrome.action.setBadgeBackgroundColor({ color: '#64748b' });
            resolve(null);
          }
        });
    });
  });
}

chrome.runtime.onInstalled.addListener(function () {
  chrome.alarms.create('propRefresh', { periodInMinutes: 60 });
  pull(true);
});

chrome.alarms.onAlarm.addListener(function (alarm) {
  if (alarm.name === 'propRefresh') pull(true);
});

chrome.runtime.onMessage.addListener(function (msg, _sender, sendResponse) {
  if (msg && msg.type === 'summary' && msg.payload) {
    applyBadge(msg.payload);
    sendResponse({ ok: true });
  }
  return false;
});

pull(false);
