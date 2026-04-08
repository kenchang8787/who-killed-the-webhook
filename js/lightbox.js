/**
 * lightbox.js — 全站圖片點擊放大檢視
 * 點擊圖片外圍或按 Esc / X 按鈕關閉
 */
(function () {
  var overlay = document.getElementById('lightbox-overlay');
  var img = document.getElementById('lightbox-img');
  var closeBtn = document.getElementById('lightbox-close');

  function open(src, alt) {
    img.src = src;
    img.alt = alt || '';
    overlay.classList.add('active');
  }

  function close() {
    overlay.classList.remove('active');
  }

  // 點擊 overlay 背景關閉（但點圖片本身不關）
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) close();
  });

  closeBtn.addEventListener('click', close);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('active')) close();
  });

  // 委派：任何 img 在 .briefing-image, .clue-image-item, .clue-display 內都可放大
  document.addEventListener('click', function (e) {
    var target = e.target;
    if (target.tagName !== 'IMG') return;
    if (
      target.closest('.briefing-image') ||
      target.closest('.clue-image-item') ||
      target.closest('.clue-display')
    ) {
      e.preventDefault();
      open(target.src, target.alt);
    }
  });
})();
