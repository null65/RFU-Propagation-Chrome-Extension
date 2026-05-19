const API = 'https://radioforus.co.uk/api/propagation-summary.php';

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

function pull() {
  return fetch(API, { cache: 'no-store' })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      chrome.storage.local.set({ propSummary: data, propFetchedAt: Date.now() });
      applyBadge(data);
      return data;
    })
    .catch(function () {
      chrome.action.setBadgeText({ text: '?' });
      chrome.action.setBadgeBackgroundColor({ color: '#64748b' });
    });
}

chrome.runtime.onInstalled.addListener(function () {
  chrome.alarms.create('propRefresh', { periodInMinutes: 60 });
  pull();
});

chrome.alarms.onAlarm.addListener(function (alarm) {
  if (alarm.name === 'propRefresh') pull();
});

chrome.runtime.onMessage.addListener(function (msg, _sender, sendResponse) {
  if (msg && msg.type === 'summary' && msg.payload) {
    applyBadge(msg.payload);
    sendResponse({ ok: true });
  }
  return false;
});

pull();
