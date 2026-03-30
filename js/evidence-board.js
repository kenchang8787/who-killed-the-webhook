/**
 * Evidence Board Module — 證據板模組
 *
 * 偵探主題互動式技術分享網頁的核心模組之一。
 * 負責管理已收集的線索、渲染證據清單、控制進度條與破案按鈕。
 */

window.EvidenceBoard = {
  // ── 狀態 ──────────────────────────────────────────────
  collected: new Map(),   // 已收集線索：clueId → clue object
  totalClues: 15,         // 線索總數（可由 ClueEngine 覆寫）

  // ── DOM 參照（init 時寫入）────────────────────────────
  _containerEl: null,     // 證據清單容器
  _counterEl: null,       // 計數器文字
  _progressEl: null,      // 進度條外框
  _solveBtnEl: null,      // 破案按鈕

  // ── 回呼（由 app.js 設定）────────────────────────────
  onClueClick: null,      // function(clueId) {}
  onSolve: null,          // function() {}

  /* ====================================================
   * init — 初始化證據板
   * ==================================================== */
  init(containerSelector, counterSelector, progressSelector, solveBtnSelector) {
    this._containerEl = document.querySelector(containerSelector);
    this._counterEl   = document.querySelector(counterSelector);
    this._progressEl  = document.querySelector(progressSelector);
    this._solveBtnEl  = document.querySelector(solveBtnSelector);

    // 綁定破案按鈕點擊事件
    if (this._solveBtnEl) {
      this._solveBtnEl.addEventListener('click', () => {
        if (typeof this.onSolve === 'function') {
          this.onSolve();
        }
      });
    }

    // 渲染初始空狀態
    this.render();
  },

  /* ====================================================
   * addClue — 新增線索至證據板
   * 回傳 true 表示新增成功，false 表示已存在
   * ==================================================== */
  addClue(clue) {
    if (!clue || !clue.id) return false;

    // 重複線索不再加入
    if (this.collected.has(clue.id)) return false;

    this.collected.set(clue.id, clue);
    this.render();

    // 為新增項目加上入場動畫 class
    if (this._containerEl) {
      var itemEl = this._containerEl.querySelector(
        '[data-clue-id="' + clue.id + '"]'
      );
      if (itemEl) {
        itemEl.classList.add('evidence-item-enter');
        // 動畫結束後移除 class，避免殘留
        itemEl.addEventListener('animationend', function handler() {
          itemEl.classList.remove('evidence-item-enter');
          itemEl.removeEventListener('animationend', handler);
        });
      }
    }

    return true;
  },

  /* ====================================================
   * removeClue — 從證據板移除線索
   * ==================================================== */
  removeClue(clueId) {
    if (!this.collected.has(clueId)) return;
    this.collected.delete(clueId);
    this.render();
  },

  /* ====================================================
   * isCollected — 檢查線索是否已收集
   * ==================================================== */
  isCollected(clueId) {
    return this.collected.has(clueId);
  },

  /* ====================================================
   * getCount — 取得已收集線索數量
   * ==================================================== */
  getCount() {
    return this.collected.size;
  },

  /* ====================================================
   * getCollectedSorted — 依 order 排序回傳所有已收集線索
   * ==================================================== */
  getCollectedSorted() {
    return Array.from(this.collected.values()).sort(function (a, b) {
      return (a.order || 0) - (b.order || 0);
    });
  },

  /* ====================================================
   * render — 重新渲染整個證據清單
   * ==================================================== */
  render() {
    this._renderList();
    this._updateCounter();
    this._updateProgress();
    this._updateSolveButton();
  },

  /* ----------------------------------------------------
   * _renderList — 渲染證據項目清單
   * ---------------------------------------------------- */
  _renderList() {
    if (!this._containerEl) return;

    // 清空容器
    this._containerEl.innerHTML = '';

    // 空狀態提示
    if (this.collected.size === 0) {
      var emptyEl = document.createElement('div');
      emptyEl.className = 'evidence-empty';
      emptyEl.innerHTML = '<p>📌 尚未收集任何線索</p><p><small>搜索並收集線索來破案</small></p>';
      this._containerEl.appendChild(emptyEl);
      return;
    }

    // 依 order 排序後逐一建立項目
    var sorted = this.getCollectedSorted();
    var self = this;

    sorted.forEach(function (clue) {
      var item = self._createItemElement(clue);
      self._containerEl.appendChild(item);
    });
  },

  /* ----------------------------------------------------
   * _createItemElement — 建立單一證據項目 DOM 元素
   * ---------------------------------------------------- */
  _createItemElement(clue) {
    var self = this;

    var item = document.createElement('div');
    item.className = 'evidence-item';
    item.setAttribute('data-clue-id', clue.id);

    // 線索類型圖示
    var iconEl = document.createElement('span');
    iconEl.className = 'evidence-icon';
    iconEl.textContent = this._getTypeIcon(clue.type);
    item.appendChild(iconEl);

    // 線索編號（等寬字體）
    var idEl = document.createElement('span');
    idEl.className = 'evidence-id';
    idEl.textContent = clue.id;
    item.appendChild(idEl);

    // 線索標題（過長時截斷）
    var titleEl = document.createElement('span');
    titleEl.className = 'evidence-title';
    titleEl.textContent = this._truncate(clue.title || '', 20);
    if (clue.title && clue.title.length > 20) {
      titleEl.setAttribute('title', clue.title);
    }
    item.appendChild(titleEl);

    // 移除按鈕
    var removeBtn = document.createElement('button');
    removeBtn.className = 'evidence-remove';
    removeBtn.setAttribute('title', '移除');
    removeBtn.textContent = '\u00d7'; // ×
    removeBtn.addEventListener('click', function (e) {
      e.stopPropagation(); // 不觸發 item 的點擊
      self.removeClue(clue.id);
    });
    item.appendChild(removeBtn);

    // 點擊整個項目 → 觸發 onClueClick 回呼
    item.addEventListener('click', function () {
      if (typeof self.onClueClick === 'function') {
        self.onClueClick(clue.id);
      }
    });

    return item;
  },

  /* ----------------------------------------------------
   * _updateCounter — 更新計數器文字
   * ---------------------------------------------------- */
  _updateCounter() {
    if (!this._counterEl) return;
    this._counterEl.textContent = '已收集 ' + this.collected.size + ' / ' + this.totalClues;
  },

  /* ----------------------------------------------------
   * _updateProgress — 更新進度條寬度
   * ---------------------------------------------------- */
  _updateProgress() {
    if (!this._progressEl) return;

    var bar = this._progressEl.querySelector('.evidence-progress-bar');
    if (!bar) return;

    var pct = this.totalClues > 0
      ? Math.min(100, Math.round((this.collected.size / this.totalClues) * 100))
      : 0;
    bar.style.width = pct + '%';
  },

  /* ----------------------------------------------------
   * _updateSolveButton — 控制破案按鈕的顯示與動畫
   * 收集 >= 12 條線索時顯示，並加上脈衝光暈動畫
   * ---------------------------------------------------- */
  _updateSolveButton() {
    if (!this._solveBtnEl) return;

    var threshold = 12;

    if (this.collected.size >= threshold) {
      this._solveBtnEl.style.display = '';
      this._solveBtnEl.classList.add('solve-pulse');
    } else {
      this._solveBtnEl.style.display = 'none';
      this._solveBtnEl.classList.remove('solve-pulse');
    }
  },

  /* ====================================================
   * getSummary — 產生破案摘要 HTML（時間軸形式）
   * ==================================================== */
  getSummary() {
    var sorted = this.getCollectedSorted();

    if (sorted.length === 0) {
      return '<p class="summary-empty">沒有收集到任何線索。</p>';
    }

    var html = '<div class="evidence-summary-timeline">';

    sorted.forEach(function (clue, idx) {
      html += '<div class="summary-item">';
      html +=   '<span class="summary-step">' + (idx + 1) + '</span>';
      html +=   '<div class="summary-content">';
      html +=     '<strong class="summary-id">' + clue.id + '</strong>';
      html +=     '<span class="summary-title">' + (clue.title || '') + '</span>';
      if (clue.description) {
        html += '<p class="summary-desc">' + clue.description + '</p>';
      }
      html +=   '</div>';
      html += '</div>';
    });

    html += '</div>';
    return html;
  },

  /* ====================================================
   * reset — 重置證據板
   * ==================================================== */
  reset() {
    this.collected.clear();
    this.render();
  },

  /* ====================================================
   * 工具方法（內部使用）
   * ==================================================== */

  /**
   * _getTypeIcon — 根據線索類型回傳對應 emoji 圖示
   */
  _getTypeIcon(type) {
    var icons = {
      image:    '🖼️',
      document: '📄',
      audio:    '🔊',
      video:    '🎬',
      code:     '💻',
      log:      '📋',
      email:    '📧',
      chat:     '💬',
      config:   '⚙️',
      network:  '🌐',
      key:      '🔑',
      warning:  '⚠️',
      person:   '👤',
      time:     '🕐',
      location: '📍'
    };
    return icons[type] || '🔍';
  },

  /**
   * _truncate — 截斷過長文字並補上省略號
   */
  _truncate(text, maxLen) {
    if (!text) return '';
    if (text.length <= maxLen) return text;
    return text.slice(0, maxLen) + '…';
  }
};
