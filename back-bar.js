(function () {
  'use strict';

  function init() {
    if (document.getElementById('zg-back-bar')) return;

    var style = document.createElement('style');
    style.id = 'zg-back-bar-style';
    style.textContent = [
      '#zg-back-bar{',
      '  position:fixed;top:0;left:0;right:0;height:36px;',
      '  display:flex;align-items:center;padding:0 12px;',
      '  background:linear-gradient(90deg,#0b1d2a 0%,#102b3f 100%);',
      '  border-bottom:2px solid #00f5d4;',
      '  box-shadow:0 2px 8px rgba(0,0,0,.35);',
      '  z-index:99999;',
      '  font-family:"Zen Maru Gothic","Mochiy Pop One",sans-serif;',
      '  box-sizing:border-box;',
      '}',
      '#zg-back-bar a.zg-back-link{',
      '  color:#00f5d4;text-decoration:none;font-weight:700;font-size:14px;',
      '  display:inline-flex;align-items:center;gap:6px;',
      '  padding:4px 10px;border-radius:6px;',
      '  transition:background .15s ease,color .15s ease;',
      '}',
      '#zg-back-bar a.zg-back-link:hover{',
      '  background:#00f5d4;color:#0b1d2a;',
      '}',
      'body{padding-top:36px !important;}'
    ].join('\n');
    document.head.appendChild(style);

    var bar = document.createElement('div');
    bar.id = 'zg-back-bar';

    var link = document.createElement('a');
    link.className = 'zg-back-link';
    link.href = '../index.html';
    link.textContent = '\u2190 \u30b6\u30ea\u30ac\u30cb\u30b2\u30fc\u30e0\u30b9\u306b\u623b\u308b';

    bar.appendChild(link);
    document.body.insertBefore(bar, document.body.firstChild);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
