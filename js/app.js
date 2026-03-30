/**
 * App.js — 主應用程式協調檔案
 * "Who Killed the Webhook?" 互動式偵探技術分享網頁
 *
 * 依賴：ClueEngine (clues.js), Effects (effects.js), EvidenceBoard (evidence-board.js)
 */

;(function () {
  'use strict';

  /* ─── 常數 ─── */

  const SCENE_IDS = ['landing', 'briefing', 'investigation', 'solved'];
  const SCENE_TRANSITION_MS = 400; // 場景切換動畫時長
  const KEYWORD_HINTS = [
    'Teams通知', '28202', 'code', 'ELK', 'proxy',
    'Postman', 'Google', 'ping', 'TLS', 'fix',
    'HttpClientHandler', 'HttpWebRequest',
  ];

  /* ─── 工具函式 ─── */

  /** HTML 跳脫，防止 XSS */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /** 安全取得 DOM 元素 */
  function $(id) {
    return document.getElementById(id);
  }

  /** Promise 版 setTimeout */
  function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  /* ─── 主應用程式物件 ─── */

  var App = {
    currentScene: 'landing',
    discoveredClues: new Set(),   // 已搜尋到的線索 ID
    searchHistory: [],            // 搜尋歷史紀錄

    /* =====================
     *  初始化
     * ===================== */

    init: function () {
      this.bindEvents();
      this.initEvidenceBoard();
      this.populateKeywordHints();
      this.updateFoundCount();
      this.playLandingAnimation();
    },

    /* =====================
     *  場景管理
     * ===================== */

    /**
     * 切換場景：淡出目前場景 → 淡入目標場景
     * @param {string} targetScene - 目標場景名稱
     */
    switchScene: function (targetScene) {
      var self = this;
      if (targetScene === this.currentScene) return;
      if (SCENE_IDS.indexOf(targetScene) === -1) return;

      var currentEl = $('scene-' + this.currentScene);
      var targetEl  = $('scene-' + targetScene);
      if (!currentEl || !targetEl) return;

      // 淡出目前場景
      currentEl.classList.remove('active');

      setTimeout(function () {
        currentEl.style.display = 'none';
        targetEl.style.display = '';

        // 強制重排，確保過渡動畫生效
        void targetEl.offsetWidth;

        targetEl.classList.add('active');
        self.currentScene = targetScene;

        // 場景入場動畫
        self.onSceneEnter(targetScene);
      }, SCENE_TRANSITION_MS);
    },

    /** 場景入場後觸發的特定動畫 */
    onSceneEnter: function (scene) {
      switch (scene) {
        case 'landing':
          this.playLandingAnimation();
          break;
        case 'briefing':
          this.playBriefingAnimation();
          break;
        case 'investigation':
          this.playInvestigationAnimation();
          break;
        case 'solved':
          this.playSolvedAnimation();
          break;
      }
    },

    /* =====================
     *  事件繫結
     * ===================== */

    bindEvents: function () {
      var self = this;

      // Landing → Briefing
      var startBtn = $('btn-start-case');
      if (startBtn) {
        startBtn.addEventListener('click', function () {
          self.switchScene('briefing');
        });
      }

      // Briefing → Investigation
      var investigateBtn = $('btn-start-investigation');
      if (investigateBtn) {
        investigateBtn.addEventListener('click', function () {
          self.switchScene('investigation');
        });
      }

      // 搜尋按鈕
      var searchBtn = $('search-btn');
      if (searchBtn) {
        searchBtn.addEventListener('click', function () {
          self.handleSearch();
        });
      }

      // 搜尋輸入框 Enter 鍵
      var searchInput = $('search-input');
      if (searchInput) {
        searchInput.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            self.handleSearch();
          }
        });
      }

      // 重新開始
      var restartBtn = $('btn-restart');
      if (restartBtn) {
        restartBtn.addEventListener('click', function () {
          self.restart();
        });
      }

      // 鍵盤快捷鍵
      document.addEventListener('keydown', function (e) {
        // 在 Landing 或 Briefing 時按右鍵前進
        if (e.key === 'ArrowRight') {
          if (self.currentScene === 'landing') {
            self.switchScene('briefing');
          } else if (self.currentScene === 'briefing') {
            self.switchScene('investigation');
          }
        }
        // Escape 鍵（預留，可關閉彈出層）
        if (e.key === 'Escape') {
          // 目前無彈出層，保留擴充點
        }
      });
    },

    /* =====================
     *  Landing 動畫
     * ===================== */

    playLandingAnimation: async function () {
      var title = $('landing-title');
      if (!title || !window.Effects) return;

      var originalText = title.textContent || title.getAttribute('data-text') || 'Who Killed the Webhook?';
      title.setAttribute('data-text', originalText);
      title.textContent = '';

      try {
        await window.Effects.typewriter(title, originalText, 60);
        await window.Effects.glitchText(title, 800);
      } catch (_) {
        // 動畫失敗時顯示原始文字
        title.textContent = originalText;
      }
    },

    playBriefingAnimation: async function () {
      // Briefing 場景的簡單淡入效果
      var briefingScene = $('scene-briefing');
      if (!briefingScene || !window.Effects) return;

      var children = briefingScene.querySelectorAll('.briefing-section, .briefing-content, p, h2, h3');
      if (children.length > 0) {
        try {
          await window.Effects.staggerIn(children, 120);
        } catch (_) { /* 降級：不做動畫 */ }
      }
    },

    playInvestigationAnimation: function () {
      // 調查場景載入時聚焦搜尋框
      var input = $('search-input');
      if (input) {
        setTimeout(function () { input.focus(); }, 100);
      }
    },

    /* =====================
     *  搜尋處理（核心邏輯）
     * ===================== */

    handleSearch: async function () {
      var input = $('search-input');
      if (!input) return;

      var keyword = input.value.trim();
      if (!keyword) return;

      // 記錄搜尋歷史
      this.addToTerminalHistory(keyword);
      input.value = '';

      // 搜尋動畫
      var terminalBody = $('terminal-body');
      if (window.Effects && terminalBody) {
        var loadingEl = document.createElement('div');
        loadingEl.className = 'terminal-output terminal-output-info';
        var history = $('terminal-history');
        if (history) history.appendChild(loadingEl);
        try {
          await window.Effects.searchAnimation(loadingEl, 1200);
        } catch (_) { /* 降級 */ }
      }

      // 向 ClueEngine 搜尋
      if (!window.ClueEngine) {
        this.addTerminalOutput('⚠️ 線索引擎尚未載入', 'error');
        return;
      }

      var results = window.ClueEngine.searchClues(keyword);

      if (results.length === 0) {
        // 未找到線索
        this.addTerminalOutput('❌ 未找到相關線索，請嘗試其他關鍵字', 'error');
        var terminal = document.querySelector('.terminal');
        if (terminal && window.Effects) {
          window.Effects.shake(terminal);
        }
        return;
      }

      // 區分新線索與已發現線索
      var self = this;
      var newClues = results.filter(function (c) { return !self.discoveredClues.has(c.id); });
      var oldClues = results.filter(function (c) { return self.discoveredClues.has(c.id); });

      if (oldClues.length > 0) {
        var oldIds = oldClues.map(function (c) { return c.id; }).join(', ');
        this.addTerminalOutput('ℹ️ ' + oldIds + ' 已經發現過了', 'info');
      }

      if (newClues.length > 0) {
        this.addTerminalOutput('✅ 發現 ' + newClues.length + ' 條新線索！', 'success');

        // 標記為已發現
        newClues.forEach(function (c) { self.discoveredClues.add(c.id); });

        // 更新已發現數量
        this.updateFoundCount();

        // 在中央面板顯示線索卡片
        this.displayClues(newClues);
      } else if (results.length > 0 && newClues.length === 0) {
        this.addTerminalOutput('📎 這些線索都已經發現過了', 'info');
      }
    },

    /* =====================
     *  終端機歷史與輸出
     * ===================== */

    /** 將搜尋關鍵字加入終端機歷史 */
    addToTerminalHistory: function (keyword) {
      this.searchHistory.push(keyword);
      var history = $('terminal-history');
      if (!history) return;

      var entry = document.createElement('div');
      entry.className = 'terminal-history-entry';
      entry.innerHTML =
        '<span class="terminal-prompt-mini">></span> ' +
        '<span class="terminal-keyword">' + escapeHtml(keyword) + '</span>';
      history.appendChild(entry);

      this.scrollTerminal();
    },

    /** 在終端機輸出訊息 */
    addTerminalOutput: function (message, type) {
      type = type || 'info';
      var history = $('terminal-history');
      if (!history) return;

      var output = document.createElement('div');
      output.className = 'terminal-output terminal-output-' + type;
      output.textContent = message;
      history.appendChild(output);

      this.scrollTerminal();
    },

    /** 終端機自動捲動到底部 */
    scrollTerminal: function () {
      var terminalBody = $('terminal-body');
      if (terminalBody) {
        terminalBody.scrollTop = terminalBody.scrollHeight;
      }
    },

    /* =====================
     *  線索卡片渲染
     * ===================== */

    /** 顯示多張線索卡片並觸發入場動畫 */
    displayClues: function (clues) {
      var container = $('clue-display');
      if (!container) return;

      var noMsg = $('no-clue-msg');
      if (noMsg) noMsg.style.display = 'none';

      clues.forEach(function (clue, index) {
        var card = App.createClueCard(clue);
        container.appendChild(card);

        // 錯開入場動畫
        if (window.Effects) {
          window.Effects.slideIn(card, index * 200);
        }

        // 捲動至新卡片
        setTimeout(function () {
          card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, index * 200 + 300);
      });
    },

    /** 建立單張線索卡片 DOM 元素 */
    createClueCard: function (clue) {
      var typeInfo = (window.ClueEngine && window.ClueEngine.CLUE_TYPES)
        ? window.ClueEngine.CLUE_TYPES[clue.type]
        : { label: clue.type, color: '#888' };

      var isCollected = window.EvidenceBoard
        ? window.EvidenceBoard.isCollected(clue.id)
        : false;

      var card = document.createElement('div');
      card.className = 'clue-card clue-type-' + clue.type;
      card.id = 'card-' + clue.id;
      card.setAttribute('data-clue-id', clue.id);

      // 處理內容中的 @CLUE-XX 引用
      var processedContent = this.processClueReferences(clue.content);

      var html = '';
      html += '<div class="clue-card-header">';
      html +=   '<span class="clue-id">' + escapeHtml(clue.id) + '</span>';
      html +=   '<span class="clue-title">' + escapeHtml(clue.title) + '</span>';
      html +=   '<span class="clue-badge badge-' + clue.type + '" style="background-color:' + typeInfo.color + '">' + escapeHtml(typeInfo.label) + '</span>';
      html += '</div>';
      html += '<div class="clue-content">' + processedContent + '</div>';

      // 線索洞察
      if (clue.insight) {
        html += '<div class="clue-insight">';
        html +=   '<span class="insight-icon">💡</span>';
        html +=   '<span class="insight-text">' + escapeHtml(clue.insight) + '</span>';
        html += '</div>';
      }

      // 相關線索引用
      if (clue.references && clue.references.length > 0) {
        html += '<div class="clue-references">';
        html +=   '<span class="ref-label">相關線索：</span>';
        clue.references.forEach(function (ref) {
          html += '<span class="clue-ref-tag" data-ref="' + escapeHtml(ref) + '">@' + escapeHtml(ref) + '</span> ';
        });
        html += '</div>';
      }

      // 收集按鈕
      html += '<div class="clue-actions">';
      html +=   '<button class="collect-btn' + (isCollected ? ' collected' : '') + '" data-clue-id="' + escapeHtml(clue.id) + '">';
      html +=     isCollected ? '✅ 已收集' : '📌 收集此線索';
      html +=   '</button>';
      html += '</div>';

      card.innerHTML = html;

      // 繫結收集按鈕
      var self = this;
      var collectBtn = card.querySelector('.collect-btn');
      if (collectBtn) {
        collectBtn.addEventListener('click', function () {
          self.collectClue(clue, collectBtn);
        });
      }

      // 繫結引用標籤點擊
      card.querySelectorAll('.clue-ref-tag').forEach(function (tag) {
        tag.addEventListener('click', function () {
          var refId = tag.getAttribute('data-ref');
          if (refId) self.scrollToClue(refId);
        });
      });

      return card;
    },

    /** 將 @CLUE-XX 替換為可點擊的引用標籤 */
    processClueReferences: function (htmlContent) {
      if (!htmlContent) return '';
      return htmlContent.replace(
        /@(CLUE-\d{2})/g,
        '<span class="clue-ref-tag" data-ref="$1">@$1</span>'
      );
    },

    /** 捲動至指定線索卡片，若未發現則提示 */
    scrollToClue: function (clueId) {
      var card = $('card-' + clueId);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (window.Effects) {
          window.Effects.pulseGlow(card, '#00d4ff', 3);
        }
      } else {
        // 線索尚未被發現
        this.addTerminalOutput('💡 ' + clueId + ' 尚未被發現，繼續搜索吧！', 'info');
      }
    },

    /* =====================
     *  收集線索
     * ===================== */

    collectClue: async function (clue, btn) {
      if (!window.EvidenceBoard) return;
      if (window.EvidenceBoard.isCollected(clue.id)) return;

      var added = window.EvidenceBoard.addClue(clue);
      if (!added) return;

      btn.classList.add('collected');
      btn.textContent = '✅ 已收集';

      // 飛行動畫：從線索卡片飛往證物板
      if (window.Effects) {
        var card = $('card-' + clue.id);
        var evidenceBoard = $('evidence-board');
        if (card && evidenceBoard) {
          try {
            await window.Effects.flyTo(card, evidenceBoard);
          } catch (_) { /* 降級：不做飛行動畫 */ }
        }
      }

      // 更新所有同一線索的收集按鈕（同線索可能被多次顯示）
      document.querySelectorAll('.collect-btn[data-clue-id="' + clue.id + '"]').forEach(function (b) {
        b.classList.add('collected');
        b.textContent = '✅ 已收集';
      });
    },

    /* =====================
     *  關鍵字提示
     * ===================== */

    populateKeywordHints: function () {
      var container = $('keyword-hints-tags');
      if (!container) return;

      var self = this;
      KEYWORD_HINTS.forEach(function (hint) {
        var chip = document.createElement('span');
        chip.className = 'hint-chip';
        chip.textContent = hint;
        chip.addEventListener('click', function () {
          var input = $('search-input');
          if (input) input.value = hint;
          self.handleSearch();
        });
        container.appendChild(chip);
      });
    },

    /* =====================
     *  證物板初始化
     * ===================== */

    initEvidenceBoard: function () {
      if (!window.EvidenceBoard) return;

      window.EvidenceBoard.init(
        '#evidence-list',
        '#evidence-counter',
        '#evidence-progress',
        '#solve-btn'
      );

      window.EvidenceBoard.totalClues = window.ClueEngine
        ? window.ClueEngine.getTotalCount()
        : 15;

      var self = this;

      // 點擊證物項目時捲動至線索卡片
      window.EvidenceBoard.onClueClick = function (clueId) {
        self.scrollToClue(clueId);
      };

      // 偵破按鈕觸發結案場景
      window.EvidenceBoard.onSolve = function () {
        self.switchScene('solved');
      };
    },

    /* =====================
     *  結案場景
     * ===================== */

    playSolvedAnimation: async function () {
      // 灑花特效
      var confettiContainer = $('confetti-container');
      if (confettiContainer && window.Effects) {
        window.Effects.confetti(confettiContainer, 6000);
      }

      // 標題打字效果
      var title = $('solved-title');
      if (title && window.Effects) {
        title.textContent = '';
        try {
          await window.Effects.typewriter(title, '🎉 案件偵破！', 80);
        } catch (_) {
          title.textContent = '🎉 案件偵破！';
        }
      }

      // 建立時間軸
      this.buildTimeline();
    },

    /** 根據已收集線索建立破案時間軸 */
    buildTimeline: function () {
      var container = $('timeline-container');
      if (!container) return;

      // 優先使用已收集的線索，否則使用全部線索
      var clues;
      if (window.EvidenceBoard && window.EvidenceBoard.getCollectedSorted().length > 0) {
        clues = window.EvidenceBoard.getCollectedSorted();
      } else if (window.ClueEngine) {
        clues = window.ClueEngine.getAllCluesSorted();
      } else {
        return;
      }

      container.innerHTML = '';
      clues.forEach(function (clue, index) {
        var typeInfo = (window.ClueEngine && window.ClueEngine.CLUE_TYPES)
          ? window.ClueEngine.CLUE_TYPES[clue.type]
          : { label: clue.type, color: '#888' };

        var item = document.createElement('div');
        item.className = 'timeline-item';

        var html = '';
        html += '<div class="timeline-dot" style="background-color:' + typeInfo.color + '"></div>';
        html += '<div class="timeline-connector"></div>';
        html += '<div class="timeline-content">';
        html +=   '<div class="timeline-header">';
        html +=     '<span class="timeline-clue-id">' + escapeHtml(clue.id) + '</span>';
        html +=     '<span class="timeline-badge badge-' + clue.type + '" style="background-color:' + typeInfo.color + '">' + escapeHtml(typeInfo.label) + '</span>';
        html +=   '</div>';
        html +=   '<div class="timeline-title">' + escapeHtml(clue.title) + '</div>';
        html +=   '<div class="timeline-insight">' + escapeHtml(clue.insight || '') + '</div>';
        html += '</div>';

        item.innerHTML = html;
        container.appendChild(item);

        // 錯開入場動畫
        if (window.Effects) {
          window.Effects.slideIn(item, index * 150);
        }
      });
    },

    /* =====================
     *  重新開始
     * ===================== */

    restart: function () {
      // 清除狀態
      this.discoveredClues.clear();
      this.searchHistory = [];

      if (window.EvidenceBoard) {
        window.EvidenceBoard.reset();
      }

      // 清除終端機歷史
      var terminalHistory = $('terminal-history');
      if (terminalHistory) {
        terminalHistory.innerHTML = '';
      }

      // 重置線索顯示區域
      var clueDisplay = $('clue-display');
      if (clueDisplay) {
        clueDisplay.innerHTML =
          '<div class="no-clue-message" id="no-clue-msg">' +
            '<div class="no-clue-icon">🔍</div>' +
            '<p>在左側終端輸入關鍵字</p>' +
            '<p>開始你的調查之旅</p>' +
          '</div>';
      }

      // 更新已發現數量
      this.updateFoundCount();

      // 回到首頁
      this.switchScene('landing');
    },

    /* =====================
     *  狀態更新
     * ===================== */

    updateFoundCount: function () {
      var el = $('clue-found-count');
      if (el) {
        el.textContent = '已發現 ' + this.discoveredClues.size + ' 條線索';
      }
    },
  };

  /* ─── 啟動 ─── */

  // 掛載至 window 以便除錯
  window.App = App;

  document.addEventListener('DOMContentLoaded', function () {
    App.init();
  });
})();
