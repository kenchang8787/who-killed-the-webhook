/**
 * Effects.js — 動畫與特效工具模組
 * 偵探主題互動式技術分享網頁的動畫效果庫
 */

(function () {
  'use strict';

  // ── 輔助：注入一次性 CSS keyframes 到 <head> ──
  const injectedStyles = new Set();

  function injectCSS(id, css) {
    if (injectedStyles.has(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
    injectedStyles.add(id);
  }

  // 預先注入所有需要的 keyframe 動畫
  function injectAllKeyframes() {
    injectCSS('fx-cursor', `
      @keyframes fx-blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
      }
      .cursor {
        animation: fx-blink 0.7s step-end infinite;
        font-weight: bold;
      }
    `);

    injectCSS('fx-confetti', `
      @keyframes fx-confetti-fall {
        0%   { transform: translateY(-10px) rotate(0deg); opacity: 1; }
        100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
      }
      .confetti-piece {
        position: absolute;
        top: 0;
        pointer-events: none;
        animation: fx-confetti-fall var(--fall-duration, 3s) var(--fall-delay, 0s) ease-in forwards;
      }
    `);

    injectCSS('fx-glitch', `
      @keyframes fx-glitch-shift {
        0%   { clip-path: inset(20% 0 40% 0); transform: translate(-4px, 2px); }
        20%  { clip-path: inset(60% 0 10% 0); transform: translate(4px, -2px); }
        40%  { clip-path: inset(10% 0 70% 0); transform: translate(-2px, 4px); }
        60%  { clip-path: inset(50% 0 20% 0); transform: translate(3px, -3px); }
        80%  { clip-path: inset(30% 0 30% 0); transform: translate(-3px, 1px); }
        100% { clip-path: inset(0 0 0 0);     transform: translate(0); }
      }
      .fx-glitch-active {
        position: relative;
      }
      .fx-glitch-active::before,
      .fx-glitch-active::after {
        content: attr(data-text);
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 100%;
        overflow: hidden;
      }
      .fx-glitch-active::before {
        color: #ff3e3e;
        animation: fx-glitch-shift 0.3s steps(2, end) infinite;
        z-index: -1;
      }
      .fx-glitch-active::after {
        color: #00d4ff;
        animation: fx-glitch-shift 0.3s steps(2, end) 0.05s infinite reverse;
        z-index: -1;
      }
    `);

    injectCSS('fx-shake', `
      @keyframes fx-shake {
        0%, 100% { transform: translateX(0); }
        10%, 50%, 90% { transform: translateX(-6px); }
        30%, 70% { transform: translateX(6px); }
      }
      .fx-shake-active {
        animation: fx-shake 0.4s ease-in-out;
      }
    `);

    injectCSS('fx-pulse-glow', `
      @keyframes fx-pulse-glow {
        0%, 100% { box-shadow: 0 0 0 0 var(--glow-color, #00d4ff); }
        50%      { box-shadow: 0 0 18px 6px var(--glow-color, #00d4ff); }
      }
      .fx-pulse-glow-active {
        animation: fx-pulse-glow 0.6s ease-in-out var(--pulse-count, 3);
      }
    `);
  }

  // 確保 DOM 載入後注入樣式
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectAllKeyframes);
  } else {
    injectAllKeyframes();
  }

  // ── 輔助函式 ──

  function isElement(el) {
    return el instanceof HTMLElement;
  }

  /** 等待指定毫秒 */
  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /** 監聽 animationend 一次並回傳 Promise */
  function onAnimationEnd(el) {
    return new Promise(resolve => {
      el.addEventListener('animationend', resolve, { once: true });
    });
  }

  /** 隨機整數 [min, max] */
  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /** 從陣列中隨機挑選一個 */
  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // ═══════════════════════════════════════════
  //  公開 API
  // ═══════════════════════════════════════════

  window.Effects = {

    // ───────────────────────────
    //  1. 打字機效果
    // ───────────────────────────
    /**
     * 逐字打出文字到指定元素，結束後顯示閃爍游標
     * @param {HTMLElement} element  目標容器
     * @param {string}      text     要打出的文字
     * @param {number}      speed    每字間隔 (ms)
     * @returns {Promise<void>}
     */
    typewriter(element, text, speed = 50) {
      if (!isElement(element)) return Promise.resolve();

      // 清空元素內容
      element.textContent = '';

      const textNode = document.createTextNode('');
      const cursor = document.createElement('span');
      cursor.className = 'cursor';
      cursor.textContent = '|';
      element.appendChild(textNode);
      element.appendChild(cursor);

      return new Promise(resolve => {
        let i = 0;
        function tick() {
          if (i < text.length) {
            textNode.textContent += text[i];
            i++;
            setTimeout(tick, speed);
          } else {
            resolve();
          }
        }
        tick();
      });
    },

    // ───────────────────────────
    //  2. 紙片撒花效果
    // ───────────────────────────
    /**
     * 在容器中發射慶祝紙片
     * @param {HTMLElement} container 紙片的父容器
     * @param {number}      duration  持續時間 (ms)
     */
    confetti(container, duration = 5000) {
      if (!isElement(container)) return;

      const colors = [
        '#ff6b6b', '#ffd93d', '#4ecdc4', '#00d4ff',
        '#dda0dd', '#a8e6cf', '#ffe66d', '#ff8a5c'
      ];

      // 確保容器有定位上下文
      const pos = getComputedStyle(container).position;
      if (pos === 'static') {
        container.style.position = 'relative';
      }
      container.style.overflow = 'hidden';

      const count = randInt(80, 120);
      const pieces = [];

      for (let i = 0; i < count; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';

        const size = randInt(5, 12);
        const left = Math.random() * 100;           // 隨機水平位置 (%)
        const fallDuration = (Math.random() * 2 + 2).toFixed(2); // 2–4 秒
        const fallDelay = (Math.random() * 1.5).toFixed(2);       // 延遲 0–1.5 秒
        const hSway = randInt(-40, 40);              // 水平偏移 (px)

        Object.assign(piece.style, {
          left: `${left}%`,
          width: `${size}px`,
          height: `${size * (Math.random() > 0.5 ? 1 : 1.6)}px`,
          backgroundColor: pick(colors),
          borderRadius: Math.random() > 0.5 ? '2px' : '0',
          '--fall-duration': `${fallDuration}s`,
          '--fall-delay': `${fallDelay}s`,
          // 加入水平偏移模擬搖擺
          marginLeft: `${hSway}px`
        });

        container.appendChild(piece);
        pieces.push(piece);
      }

      // 時間到後清除所有紙片 DOM
      setTimeout(() => {
        pieces.forEach(p => {
          if (p.parentNode) p.parentNode.removeChild(p);
        });
      }, duration);
    },

    // ───────────────────────────
    //  3. 卡片滑入動畫
    // ───────────────────────────
    /**
     * 元素從底部滑入並淡入
     * @param {HTMLElement} element 目標元素
     * @param {number}      delay   延遲 (ms)
     * @returns {Promise<void>}
     */
    slideIn(element, delay = 0) {
      if (!isElement(element)) return Promise.resolve();

      // 設定初始狀態
      element.style.opacity = '0';
      element.style.transform = 'translateY(30px)';
      element.style.transition = 'none';

      return new Promise(resolve => {
        setTimeout(() => {
          element.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
          element.style.opacity = '1';
          element.style.transform = 'translateY(0)';

          // transitionend 結束後 resolve
          function done(e) {
            if (e.propertyName === 'opacity') {
              element.removeEventListener('transitionend', done);
              resolve();
            }
          }
          element.addEventListener('transitionend', done);
        }, delay);
      });
    },

    // ───────────────────────────
    //  4. 故障文字效果
    // ───────────────────────────
    /**
     * 對文字元素施加短暫的 glitch 故障效果
     * @param {HTMLElement} element  目標元素
     * @param {number}      duration 持續時間 (ms)
     * @returns {Promise<void>}
     */
    glitchText(element, duration = 1000) {
      if (!isElement(element)) return Promise.resolve();

      // 將文字存入 data-text 供偽元素使用
      element.setAttribute('data-text', element.textContent);

      return new Promise(async resolve => {
        const interval = Math.floor(duration / 4);
        // 閃爍數次故障效果
        for (let i = 0; i < 3; i++) {
          element.classList.add('fx-glitch-active');
          await wait(interval);
          element.classList.remove('fx-glitch-active');
          await wait(50);
        }
        // 最後穩定
        element.removeAttribute('data-text');
        resolve();
      });
    },

    // ───────────────────────────
    //  5. 搜尋中動畫
    // ───────────────────────────
    /**
     * 在終端區域顯示搜尋進度動畫
     * @param {HTMLElement} outputElement 輸出容器
     * @param {number}      duration      動畫持續時間 (ms)
     * @returns {Promise<void>}
     */
    searchAnimation(outputElement, duration = 1500) {
      if (!isElement(outputElement)) return Promise.resolve();

      const stages = ['搜索中.', '搜索中..', '搜索中...'];
      const stageTime = Math.floor(duration / (stages.length + 1));

      return new Promise(async resolve => {
        for (const stage of stages) {
          outputElement.textContent = stage;
          await wait(stageTime);
        }
        outputElement.textContent = '找到結果！';
        await wait(stageTime);
        outputElement.textContent = '';
        resolve();
      });
    },

    // ───────────────────────────
    //  6. 脈衝光暈
    // ───────────────────────────
    /**
     * 為元素添加數次發光脈衝效果
     * @param {HTMLElement} element 目標元素
     * @param {string}      color   光暈顏色
     * @param {number}      times   脈衝次數
     */
    pulseGlow(element, color = '#00d4ff', times = 3) {
      if (!isElement(element)) return;

      element.style.setProperty('--glow-color', color);
      element.style.setProperty('--pulse-count', String(times));
      element.classList.add('fx-pulse-glow-active');

      // 動畫結束後移除
      onAnimationEnd(element).then(() => {
        element.classList.remove('fx-pulse-glow-active');
        element.style.removeProperty('--glow-color');
        element.style.removeProperty('--pulse-count');
      });
    },

    // ───────────────────────────
    //  7. 搖晃效果
    // ───────────────────────────
    /**
     * 短暫水平搖晃元素（用於「找不到」的回饋）
     * @param {HTMLElement} element 目標元素
     * @returns {Promise<void>}
     */
    shake(element) {
      if (!isElement(element)) return Promise.resolve();

      element.classList.add('fx-shake-active');
      return onAnimationEnd(element).then(() => {
        element.classList.remove('fx-shake-active');
      });
    },

    // ───────────────────────────
    //  8. 數字跳動計數動畫
    // ───────────────────────────
    /**
     * 平滑地將數字從 start 遞增到 end
     * @param {HTMLElement} element  目標元素
     * @param {number}      start    起始值
     * @param {number}      end      結束值
     * @param {number}      duration 動畫時長 (ms)
     */
    counterAnimation(element, start, end, duration = 1000) {
      if (!isElement(element)) return;

      const startTime = performance.now();
      const diff = end - start;

      function frame(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // easeOutQuad 緩動函式讓數字變化更自然
        const eased = 1 - (1 - progress) * (1 - progress);
        const current = Math.round(start + diff * eased);
        element.textContent = current;

        if (progress < 1) {
          requestAnimationFrame(frame);
        }
      }
      requestAnimationFrame(frame);
    },

    // ───────────────────────────
    //  9. 逐一淡入列表項目
    // ───────────────────────────
    /**
     * 依序讓一組元素逐個出現
     * @param {HTMLElement[]|NodeList} elements     元素列表
     * @param {number}                 delayBetween 每個元素間的延遲 (ms)
     * @returns {Promise<void>}
     */
    staggerIn(elements, delayBetween = 100) {
      if (!elements || elements.length === 0) return Promise.resolve();

      const list = Array.from(elements);

      // 先全部隱藏
      list.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'none';
      });

      const promises = list.map((el, i) => {
        return new Promise(resolve => {
          setTimeout(() => {
            el.style.transition = 'opacity 0.4s ease-out, transform 0.4s ease-out';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';

            function done(e) {
              if (e.propertyName === 'opacity') {
                el.removeEventListener('transitionend', done);
                resolve();
              }
            }
            el.addEventListener('transitionend', done);
          }, i * delayBetween);
        });
      });

      return Promise.all(promises).then(() => {});
    },

    // ───────────────────────────
    //  10. 飛向目標效果
    // ───────────────────────────
    /**
     * 將來源元素的副本「飛」向目標位置（收集線索到證據板）
     * @param {HTMLElement} sourceElement 來源元素
     * @param {HTMLElement} targetElement 目標元素
     * @param {number}      duration      飛行時長 (ms)
     * @returns {Promise<void>}
     */
    flyTo(sourceElement, targetElement, duration = 600) {
      if (!isElement(sourceElement) || !isElement(targetElement)) {
        return Promise.resolve();
      }

      const sourceRect = sourceElement.getBoundingClientRect();
      const targetRect = targetElement.getBoundingClientRect();

      // 建立來源元素的副本
      const clone = sourceElement.cloneNode(true);
      Object.assign(clone.style, {
        position: 'fixed',
        left: `${sourceRect.left}px`,
        top: `${sourceRect.top}px`,
        width: `${sourceRect.width}px`,
        height: `${sourceRect.height}px`,
        margin: '0',
        zIndex: '10000',
        pointerEvents: 'none',
        transition: `all ${duration}ms ease-in-out`
      });
      document.body.appendChild(clone);

      // 強制瀏覽器計算佈局後再開始動畫
      clone.offsetHeight; // eslint-disable-line no-unused-expressions

      // 計算目標中心與縮放比
      const scaleX = targetRect.width / sourceRect.width;
      const scaleY = targetRect.height / sourceRect.height;
      const scale = Math.min(scaleX, scaleY, 0.4);

      Object.assign(clone.style, {
        left: `${targetRect.left + targetRect.width / 2 - sourceRect.width / 2}px`,
        top: `${targetRect.top + targetRect.height / 2 - sourceRect.height / 2}px`,
        transform: `scale(${scale})`,
        opacity: '0.3'
      });

      return new Promise(resolve => {
        clone.addEventListener('transitionend', function handler(e) {
          if (e.propertyName === 'left' || e.propertyName === 'top') {
            clone.removeEventListener('transitionend', handler);
            if (clone.parentNode) clone.parentNode.removeChild(clone);
            resolve();
          }
        });

        // 安全回退：即使 transitionend 未觸發也確保清理
        setTimeout(() => {
          if (clone.parentNode) clone.parentNode.removeChild(clone);
          resolve();
        }, duration + 100);
      });
    }
  };
})();
