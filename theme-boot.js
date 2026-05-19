(function () {
  try {
    chrome.storage.local.get(['theme'], function (res) {
      var t = res.theme === 'light' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', t);
    });
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
