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
  // 已移至 clues.js 的 hintKeyword + references 驅動漸進式提示

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

      // 搜尋輸入框
      var searchInput = $('search-input');
      if (searchInput) {
        searchInput.addEventListener('keydown', function (e) {
          var dropdown = $('autocomplete-dropdown');
          var items = dropdown ? dropdown.querySelectorAll('.ac-item') : [];
          var active = dropdown ? dropdown.querySelector('.ac-item.active') : null;

          if (e.key === 'Enter') {
            e.preventDefault();
            if (active) {
              searchInput.value = active.dataset.keyword;
              self.hideAutocomplete();
            }
            self.handleSearch();
          } else if (e.key === 'ArrowDown' && items.length > 0) {
            e.preventDefault();
            var nextItem;
            if (!active) { nextItem = items[0]; }
            else {
              active.classList.remove('active');
              nextItem = active.nextElementSibling || items[0];
            }
            nextItem.classList.add('active');
            nextItem.scrollIntoView({ block: 'nearest' });
          } else if (e.key === 'ArrowUp' && items.length > 0) {
            e.preventDefault();
            var prevItem;
            if (!active) { prevItem = items[items.length - 1]; }
            else {
              active.classList.remove('active');
              prevItem = active.previousElementSibling || items[items.length - 1];
            }
            prevItem.classList.add('active');
            prevItem.scrollIntoView({ block: 'nearest' });
          } else if (e.key === 'Escape') {
            self.hideAutocomplete();
          }
        });
        // 即時模糊搜尋下拉
        searchInput.addEventListener('input', function () {
          self.updateAutocomplete(searchInput.value);
        });
        // 點擊外部關閉
        document.addEventListener('click', function (e) {
          if (!e.target.closest('.search-input-wrapper')) {
            self.hideAutocomplete();
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

      // 調查歷史收合 toggle
      var historyToggle = $('terminal-history-toggle');
      if (historyToggle) {
        historyToggle.addEventListener('click', function () {
          var section = $('terminal-history-section');
          if (section) section.classList.toggle('collapsed');
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
      this.hideAutocomplete();

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

      var result = window.ClueEngine.searchClues(keyword);

      if (!result.clue) {
        // 未找到線索
        if (result.suggestion) {
          this.addTerminalOutput('❌ 未找到「' + keyword + '」，你是不是要找：' + result.suggestion + '？', 'error');
        } else {
          this.addTerminalOutput('🤔 這條線索似乎不存在... 看看下方的調查方向吧！', 'error');
          // pulse 高亮 hint chips 區域
          var hintsArea = document.querySelector('.keyword-hints');
          if (hintsArea) {
            hintsArea.classList.add('hints-pulse');
            setTimeout(function () { hintsArea.classList.remove('hints-pulse'); }, 1500);
          }
        }
        var terminal = document.querySelector('.terminal');
        if (terminal && window.Effects) {
          window.Effects.shake(terminal);
        }
        return;
      }

      var clue = result.clue;

      if (this.discoveredClues.has(clue.id)) {
        this.addTerminalOutput('📎 ' + clue.id + ' 已經發現過了', 'info');
        // 捲動到已存在的卡片
        this.scrollToClue(clue.id);
        return;
      }

      this.addTerminalOutput('✅ 發現新線索：' + clue.title, 'success');

      // 標記為已發現
      this.discoveredClues.add(clue.id);
      this.updateFoundCount();

      // 顯示線索卡片
      this.displayClues([clue]);

      // 刷新提示（可能解鎖新關鍵字）
      this.refreshKeywordHints();
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

      // 更新歷史計數
      var countEl = $('history-count');
      if (countEl) countEl.textContent = '(' + this.searchHistory.length + ')';

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

    /** 更新自動補全下拉選單 */
    updateAutocomplete: function (value) {
      var dropdown = $('autocomplete-dropdown');
      if (!dropdown || !window.ClueEngine) return;

      if (!value || !value.trim()) {
        this.hideAutocomplete();
        return;
      }

      var results = window.ClueEngine.autocomplete(value.trim());
      if (results.length === 0) {
        this.hideAutocomplete();
        return;
      }

      var self = this;
      dropdown.innerHTML = '';
      results.forEach(function (r) {
        var item = document.createElement('div');
        item.className = 'ac-item';
        item.dataset.keyword = r.keyword;
        item.innerHTML =
          '<span class="ac-id">' + r.clueId + '</span>' +
          '<span class="ac-title">' + r.title + '</span>';
        item.addEventListener('click', function () {
          var input = $('search-input');
          if (input) input.value = r.keyword;
          self.hideAutocomplete();
          self.handleSearch();
        });
        dropdown.appendChild(item);
      });
      dropdown.classList.remove('hidden');
    },

    /** 隱藏自動補全下拉 */
    hideAutocomplete: function () {
      var dropdown = $('autocomplete-dropdown');
      if (dropdown) {
        dropdown.classList.add('hidden');
        dropdown.innerHTML = '';
      }
    },

    /* =====================
     *  線索卡片渲染
     * ===================== */

    /** 顯示多張線索卡片並觸發入場動畫（新卡片插入頂部） */
    displayClues: function (clues) {
      var container = $('clue-display');
      if (!container) return;

      var noMsg = $('no-clue-msg');
      if (noMsg) noMsg.style.display = 'none';

      // 收合所有現有卡片
      container.querySelectorAll('.clue-card').forEach(function (card) {
        card.classList.add('collapsed');
      });

      // 新線索插入頂部，最新的在最上面
      var firstExisting = container.querySelector('.clue-card');
      clues.forEach(function (clue, index) {
        var card = App.createClueCard(clue);
        // 插入到最頂部（在現有卡片之前）
        if (firstExisting) {
          container.insertBefore(card, firstExisting);
        } else {
          container.appendChild(card);
        }

        // 錯開入場動畫
        if (window.Effects) {
          window.Effects.slideIn(card, index * 200);
        }
      });

      // 捲動到頂部顯示最新線索
      setTimeout(function () {
        container.scrollTop = 0;
      }, 300);
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
      html +=   '<span class="clue-collapse-toggle">▼</span>';
      html += '</div>';
      html += '<div class="clue-card-body">';
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
      html += '</div>'; // close .clue-card-body

      card.innerHTML = html;

      // 繫結收合 toggle（點擊 header 收合/展開）
      var header = card.querySelector('.clue-card-header');
      if (header) {
        header.addEventListener('click', function (e) {
          // 避免點擊 badge 等互動元素時觸發
          if (e.target.closest('.clue-ref-tag')) return;
          card.classList.toggle('collapsed');
        });
      }

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
        // 展開收合的卡片
        card.classList.remove('collapsed');
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

      // 收集後也刷新提示
      this.refreshKeywordHints();
    },

    /* =====================
     *  關鍵字提示
     * ===================== */

    /**
     * 漸進式關鍵字提示：根據已發現/收集的線索解鎖新提示
     * 規則：線索的 references 為空 → 一開始就顯示
     *       references 中任一線索已被發現 → 解鎖
     */
    refreshKeywordHints: function () {
      var container = $('keyword-hints-tags');
      if (!container || !window.ClueEngine) return;

      var self = this;
      var clues = window.ClueEngine.CLUES;
      container.innerHTML = '';

      clues.forEach(function (clue) {
        // 判斷是否該顯示這個提示
        var unlocked = false;
        if (!clue.references || clue.references.length === 0) {
          unlocked = true;
        } else {
          unlocked = clue.references.some(function (refId) {
            return self.discoveredClues.has(refId);
          });
        }
        if (!unlocked) return;

        var keyword = clue.hintKeyword;
        var question = clue.hintQuestion || keyword;
        if (!keyword) return;

        var isFound = self.discoveredClues.has(clue.id);

        var chip = document.createElement('span');

        if (isFound) {
          // 已發現：顯示完整文字 + found 樣式
          chip.className = 'hint-chip hint-found';
          chip.textContent = question;
          chip.addEventListener('click', function () {
            var input = $('search-input');
            if (input) input.value = keyword;
            self.handleSearch();
          });
        } else {
          // 未發現：隱藏文字，點擊才顯示
          chip.className = 'hint-chip hint-hidden';
          chip.textContent = '🔒 ???';
          chip.addEventListener('click', function () {
            // 揭露提示文字
            chip.classList.remove('hint-hidden');
            chip.classList.add('hint-revealed');
            chip.textContent = question;
            // 再次點擊觸發搜尋
            chip.onclick = function () {
              var input = $('search-input');
              if (input) input.value = keyword;
              self.handleSearch();
            };
          });
        }

        container.appendChild(chip);
      });
    },

    /** 初始化提示（向後相容） */
    populateKeywordHints: function () {
      this.refreshKeywordHints();
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
      var countEl = $('history-count');
      if (countEl) countEl.textContent = '(0)';
      var historySection = $('terminal-history-section');
      if (historySection) historySection.classList.add('collapsed');
      this.hideAutocomplete();

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

      // 重置提示
      this.refreshKeywordHints();

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
