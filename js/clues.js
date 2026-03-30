/**
 * clues.js — 線索資料定義與搜尋引擎
 * "Who Killed the Webhook" — 互動式偵探風格技術分享
 * 故事主軸：追查壞掉的 Teams 付款通知 Webhook
 */

// ============================================================
// 線索類型 Badge 對照表
// ============================================================
const CLUE_TYPES = {
  'log':          { label: '📋 Log 記錄',   color: '#4ecdc4' },
  'screenshot':   { label: '🖼️ 截圖',       color: '#ffe66d' },
  'code':         { label: '💻 程式碼',      color: '#a8e6cf' },
  'analysis':     { label: '🔬 分析',       color: '#dda0dd' },
  'test':         { label: '🧪 測試',       color: '#87ceeb' },
  'dead-end':     { label: '❌ 排除',       color: '#ff6b6b' },
  'breakthrough': { label: '🔑 突破',       color: '#ffd93d' }
};

// ============================================================
// 15 條線索資料（依調查順序排列）
// ============================================================
const CLUES = [
  // ── CLUE-01 ── 案發現場 ──────────────────────────────────
  {
    id: 'CLUE-01',
    keywords: ['Teams通知', 'issue', '回報', '壞掉', 'notification', '通知'],
    title: '案發現場：通知停了',
    type: 'screenshot',
    icon: '🖼️',
    content: `
      <p>有人回報 Teams 頻道的<strong>付款完成通知</strong>突然不見了。第一步當然是親眼確認——打開 Teams 頻道，果然最後一筆通知停留在好幾個小時前。</p>
      <div class="clue-image-placeholder" data-desc="Teams 頻道截圖：最後一筆付款通知的時間戳記，之後一片空白"></div>
      <p>跟相關同事確認後，這不是「沒有交易」，而是「有交易卻沒通知」。也就是說，通知機制確實壞了。</p>
      <p>記下最後一筆成功通知的時間：這個時間點將成為後續追查 log 的關鍵錨點。所有的 ELK 查詢、部署紀錄比對，都會以此為基準。</p>
    `,
    insight: '確認問題存在，記下最後成功通知的時間點',
    references: [],
    order: 1
  },

  // ── CLUE-02 ── 封測環境驗證 ─────────────────────────────
  {
    id: 'CLUE-02',
    keywords: ['封測', 'staging', 'pre', '環境', 'environment'],
    title: '封測環境一切正常',
    type: 'test',
    icon: '🧪',
    content: `
      <p>在確認正式環境有問題後，直覺反應是：<strong>封測（staging / pre）環境呢？</strong></p>
      <p>立刻到封測環境觸發一筆測試交易，結果 Teams 通知正常送出、頻道也正常收到訊息。反覆測了幾次，封測全部 OK。</p>
      <div class="clue-image-placeholder" data-desc="封測環境 Teams 頻道截圖：測試通知正常出現"></div>
      <p>這代表程式邏輯本身大概沒問題（至少封測版本能跑），問題出在<strong>正式環境獨有的某個差異</strong>。接下來要做的就是找出這個差異。</p>
    `,
    insight: '封測正常、正式異常 → 環境差異是關鍵',
    references: ['CLUE-01'],
    order: 2
  },

  // ── CLUE-03 ── 完款服務無更版 ───────────────────────────
  {
    id: 'CLUE-03',
    keywords: ['28202', '更版', 'deploy', '完款', 'deployment', 'payment'],
    title: '完款服務 28202 — 無更版',
    type: 'dead-end',
    icon: '❌',
    content: `
      <p>付款通知是在「完款服務」（port 28202）觸發的，所以第一個嫌疑犯自然就是它。</p>
      <p>查了 28202 的<strong>部署紀錄</strong>——最近完全沒有更版。CI/CD pipeline 最後一次成功部署是在好幾天前，遠早於問題發生的時間。</p>
      <div class="clue-image-placeholder" data-desc="28202 部署歷史紀錄：最近無任何部署"></div>
      <p>既然沒有部署，就不太可能是程式碼變更造成的。28202 暫時排除嫌疑，但我們還是需要追進去看它到底怎麼發通知的。</p>
    `,
    insight: '28202 沒有更版，排除部署導致的問題',
    references: ['CLUE-01'],
    order: 3
  },

  // ── CLUE-04 ── 追蹤呼叫鏈 ──────────────────────────────
  {
    id: 'CLUE-04',
    keywords: ['code', '代碼', 'SendWebhook', '追code', '呼叫鏈', 'trace', 'TBDAPI'],
    title: '追蹤呼叫鏈：28202 → TBDAPI',
    type: 'code',
    icon: '💻',
    content: `
      <p>打開 28202 的原始碼，從付款完成的 handler 開始追。找到送通知的那段邏輯後，發現它<strong>並不是自己直接打 Teams Webhook URL</strong>。</p>
      <pre><code>// 28202 完款服務中的通知邏輯（簡化示意）
var result = await httpClient.PostAsync(
    $"{tbdApiBaseUrl}/Teams/SendWebhook",
    new StringContent(payload, Encoding.UTF8, "application/json")
);</code></pre>
      <p>原來 28202 是呼叫另一個內部服務 <strong>TBDAPI</strong> 的 <code>/Teams/SendWebhook</code> 端點，由 TBDAPI 負責實際送出 Webhook。</p>
      <p>這代表問題可能不在 28202，而是在 TBDAPI 這個「中間人」身上。偵查方向需要轉移。</p>
    `,
    insight: '28202 自己不發通知，是透過 TBDAPI 的 /Teams/SendWebhook 接口發送',
    references: ['CLUE-03'],
    order: 4
  },

  // ── CLUE-05 ── TBDAPI 也無更版 ─────────────────────────
  {
    id: 'CLUE-05',
    keywords: ['TBDAPI', '更版', 'deploy', 'deployment'],
    title: 'TBDAPI 也無更版',
    type: 'dead-end',
    icon: '❌',
    content: `
      <p>既然懷疑 TBDAPI，第一件事同樣是查<strong>部署紀錄</strong>。</p>
      <p>結果跟 28202 一樣——TBDAPI 最近也完全沒有更版。程式碼已經穩定運行很長一段時間了。</p>
      <div class="clue-image-placeholder" data-desc="TBDAPI 部署歷史紀錄：最近無任何部署"></div>
      <p>兩個服務都沒有部署變更，那問題到底從哪冒出來的？排除了程式碼變更因素後，需要從<strong>運行環境、基礎設施</strong>的角度來思考。</p>
    `,
    insight: 'TBDAPI 也沒有更版，排除 TBDAPI 部署問題',
    references: ['CLUE-04'],
    order: 5
  },

  // ── CLUE-06 ── ELK 異常日誌 ─────────────────────────────
  {
    id: 'CLUE-06',
    keywords: ['ELK', 'log', '錯誤', 'error', '日誌', '異常'],
    title: 'ELK 異常日誌：連線正常但有錯',
    type: 'log',
    icon: '📋',
    content: `
      <p>打開 ELK（Elasticsearch + Logstash + Kibana），用之前記下的時間點開始查。</p>
      <p>先看 28202 → TBDAPI 這段：HTTP 呼叫<strong>正常發出、正常抵達</strong>，TBDAPI 有收到 request。所以兩個服務之間的通訊沒有問題。</p>
      <div class="clue-image-placeholder" data-desc="ELK 日誌截圖：28202 呼叫 TBDAPI 成功，但 TBDAPI 回傳錯誤"></div>
      <p>但是！TBDAPI 的 log 裡面出現了<strong>錯誤訊息</strong>。不幸的是，這個錯誤訊息不夠具體，只能看出「在送出 Webhook 的過程中出了問題」，無法直接定位根因。</p>
    `,
    insight: '28202→TBDAPI 通訊正常，但 TBDAPI 執行過程中發生錯誤',
    references: ['CLUE-04', 'CLUE-05'],
    order: 6
  },

  // ── CLUE-07 ── 發現 message-proxy ──────────────────────
  {
    id: 'CLUE-07',
    keywords: ['proxy', 'message-proxy', '代理', '外網', 'internal', '內網'],
    title: '發現中繼站：message-proxy',
    type: 'analysis',
    icon: '🔬',
    content: `
      <p>既然 ELK 的錯誤訊息不夠清楚，直接去看 TBDAPI 的原始碼。打開 <code>/Teams/SendWebhook</code> 的實作。</p>
      <p>看到關鍵資訊：TBDAPI 部署在<strong>內網環境</strong>，無法直接存取外部網路。為了把 Webhook 送到 Teams（外網服務），它使用了一個 HTTP 代理：</p>
      <pre><code>// TBDAPI 中的 proxy 設定
var proxy = new WebProxy("http://message-proxy.tutorabc.com:3128");
handler.Proxy = proxy;</code></pre>
      <p>所以完整的呼叫鏈是：<strong>28202 → TBDAPI → message-proxy → Teams Webhook URL</strong>。問題可能出在 TBDAPI → message-proxy 這段，或是 message-proxy → 外網這段。</p>
    `,
    insight: 'TBDAPI 透過 message-proxy.tutorabc.com 代理打到外網',
    references: ['CLUE-06'],
    order: 7
  },

  // ── CLUE-08 ── Postman 驗證 ─────────────────────────────
  {
    id: 'CLUE-08',
    keywords: ['Postman', 'test', '測試', '驗證', 'verify'],
    title: 'Postman 驗證：封測✓ 正式✗',
    type: 'test',
    icon: '🧪',
    content: `
      <p>為了確認問題邊界，用 Postman 直接對 TBDAPI 的 <code>/Teams/SendWebhook</code> 發 request。</p>
      <ul>
        <li><strong>封測環境 TBDAPI</strong> → 回傳成功 ✅，Teams 頻道收到通知</li>
        <li><strong>正式環境 TBDAPI</strong> → 回傳失敗 ❌，Teams 頻道沒有通知</li>
      </ul>
      <div class="clue-image-placeholder" data-desc="Postman 測試結果對比：封測成功 vs 正式失敗"></div>
      <p>回到 ELK 仔細比對，確認錯誤恰好發生在 TBDAPI 透過 proxy 送出 HTTP request 的那一步。問題範圍進一步縮小到 <strong>TBDAPI → message-proxy → 外網</strong>這條路徑。</p>
    `,
    insight: '問題鎖定：TBDAPI 透過 Proxy 打外網這段出了問題',
    references: ['CLUE-07', 'CLUE-02'],
    order: 8
  },

  // ── CLUE-09 ── Proxy 設定相同 ───────────────────────────
  {
    id: 'CLUE-09',
    keywords: ['config', '設定', 'proxy url', '網址', 'configuration'],
    title: 'Proxy 設定完全相同',
    type: 'dead-end',
    icon: '❌',
    content: `
      <p>封測能通、正式不能通——會不會是兩邊的 proxy 設定不同？也許 proxy 本身也有分封測/正式環境？</p>
      <p>檢查兩邊的設定檔（config / appsettings），結果：</p>
      <pre><code>// 封測環境
"ProxyUrl": "http://message-proxy.tutorabc.com:3128"

// 正式環境
"ProxyUrl": "http://message-proxy.tutorabc.com:3128"</code></pre>
      <p><strong>完全一樣。</strong>兩邊都指向同一個 proxy 位址。所以不是設定差異造成的，問題另有原因。</p>
    `,
    insight: '封測/正式的 proxy 網址完全相同，排除設定差異',
    references: ['CLUE-08'],
    order: 9
  },

  // ── CLUE-10 ── 三大嫌疑方向 ─────────────────────────────
  {
    id: 'CLUE-10',
    keywords: ['Google', '方向', '可能', '原因', '嫌疑', 'suspect', 'direction'],
    title: '三大嫌疑方向：ACL / DNS / TLS',
    type: 'analysis',
    icon: '🔬',
    content: `
      <p>回頭看 ELK 裡的錯誤訊息：<code>"An error occurred while sending the request"</code>。這是一個很泛的錯誤，代表 HTTP 請求送不出去。</p>
      <p>Google 搜尋這個錯誤訊息搭配 proxy 關鍵字，歸納出<strong>三大嫌疑方向</strong>：</p>
      <ol>
        <li><strong>ACL（存取控制清單）改變</strong> — 網路層被擋住了</li>
        <li><strong>DNS 解析/快取問題</strong> — proxy 的 domain 解析到錯的 IP</li>
        <li><strong>TLS/SSL 握手失敗</strong> — 憑證或加密協定出問題</li>
      </ol>
      <p>補充背景：封測機器 IP 在 19.204 網段，正式機器在 19.25 / 19.26 網段（同子網）。另外，公司的網管角色最近才交接給一位較資淺的同事。</p>
    `,
    insight: '三大嫌疑：ACL 改變 / DNS 問題 / TLS 握手失敗',
    references: ['CLUE-08'],
    order: 10
  },

  // ── CLUE-11 ── 網路排查全通過 ───────────────────────────
  {
    id: 'CLUE-11',
    keywords: ['ping', 'DNS', 'network', '網路', '網管', 'ACL', 'hosts', 'Test-NetConnection'],
    title: '網路排查全通過',
    type: 'dead-end',
    icon: '❌',
    content: `
      <p>逐一排查網路層的可能性，在封測與正式機器上都跑了一輪：</p>
      <pre><code>> ping message-proxy.tutorabc.com
回覆自 19.133.x.x    ← 兩邊解析結果一致 ✓

> cat C:\\Windows\\System32\\drivers\\etc\\hosts
（無 message-proxy 相關覆寫）       ✓

> Test-NetConnection message-proxy.tutorabc.com -Port 3128
TcpTestSucceeded : True             ✓</code></pre>
      <p>DNS 解析正常、沒有 hosts 檔覆寫、TCP 連線暢通。再向網管確認：最近<strong>沒有任何 ACL 變更</strong>，而且 19.x 網段之間本來就不應該有阻擋。</p>
      <p>網路層三項全部排除。嫌疑只剩下 <strong>TLS/SSL</strong> 了。</p>
    `,
    insight: 'DNS 正常、網路連通、ACL 無改動 → 排除網路層問題',
    references: ['CLUE-10'],
    order: 11
  },

  // ── CLUE-12 ── TLS 實驗突破 ─────────────────────────────
  {
    id: 'CLUE-12',
    keywords: ['TLS', 'SSL', '憑證', 'certificate', '握手', 'handshake', 'security'],
    title: 'TLS 實驗：跳過憑證 → 成功！',
    type: 'breakthrough',
    icon: '🔑',
    content: `
      <p>雖然這段程式碼已經穩定運行三年沒改過，但所有其他方向都排除了，只剩 TLS/SSL。硬著頭皮實驗。</p>
      <p>在封測和正式機器上，用 PowerShell 重現 TBDAPI 透過 proxy 發 HTTP request 的行為：</p>
      <pre><code># 一般請求（透過 proxy）
Invoke-WebRequest -Uri $teamsWebhookUrl -Proxy $proxyUrl ...
# 封測 → 成功 ✅ | 正式 → 失敗 ❌（與 Postman 結果一致）

# 指定 TLS 1.2
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
# 封測 → 成功 ✅ | 正式 → 失敗 ❌（但錯誤訊息不同！變成 "security error"）

# 跳過憑證驗證
[Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }
# 封測 → 成功 ✅ | 正式 → 成功 ✅ 🎉</code></pre>
      <p>關鍵發現：指定 TLS 1.2 後錯誤訊息<strong>變了</strong>（從泛用錯誤變成明確的 security error），而<strong>跳過憑證驗證後正式環境也能成功</strong>！確認是 TLS/SSL 憑證問題。</p>
    `,
    insight: '🔥 指定 TLS 1.2 失敗（錯誤不同），跳過憑證檢查 → 成功！確認是 TLS/SSL 問題',
    references: ['CLUE-10', 'CLUE-11'],
    order: 12
  },

  // ── CLUE-13 ── 第一次修復失敗 ───────────────────────────
  {
    id: 'CLUE-13',
    keywords: ['fix', '修復', '發版', '上線', '第一次', 'first fix'],
    title: '第一次修復：仍然失敗',
    type: 'log',
    icon: '📋',
    content: `
      <p>根據 CLUE-12 的發現，回到 TBDAPI 程式碼加上 TLS 設定和憑證跳過邏輯：</p>
      <pre><code>// 修改後的 TBDAPI 程式碼
ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;
handler.ServerCertificateCustomValidationCallback =
    (message, cert, chain, errors) => true;

var client = new HttpClient(handler);
var response = await client.PostAsync(webhookUrl, content);</code></pre>
      <p>部署到封測 → <strong>成功 ✅</strong>。部署到正式 → <strong>仍然失敗 ❌</strong>，錯誤訊息跟修改前一模一樣！</p>
      <p>檢查所有 3 台正式機器，全部都是 <strong>Windows Server 2012 R2</strong>。比對 runtime 設定，封測與正式完全相同。程式碼明明改了，設定也確認了，為什麼沒有生效？</p>
    `,
    insight: '程式碼修改後封測通過但正式仍失敗 → 程式碼設定沒有生效？',
    references: ['CLUE-12'],
    order: 13
  },

  // ── CLUE-14 ── 真兇：HttpClientHandler ──────────────────
  {
    id: 'CLUE-14',
    keywords: ['HttpClientHandler', 'handler', 'bug', '真兇', 'HttpClient'],
    title: '真兇浮現：HttpClientHandler',
    type: 'breakthrough',
    icon: '🔑',
    content: `
      <p>修了卻沒效果，只好再次 Google 深挖。這次搜尋的方向是 <code>HttpClientHandler ServerCertificateCustomValidationCallback not working</code>。</p>
      <p>找到了幾篇討論和 GitHub Issue，一開始還半信半疑，但仔細看完後確認：</p>
      <blockquote>
        <strong>HttpClientHandler 在某些情境 / OS 版本下，不會正確地將設定的 TLS 版本和 ServerCertificateCustomValidationCallback 套用到實際的 HTTP request 上。</strong>
      </blockquote>
      <p>也就是說，我們在 handler 上設定的 TLS 1.2 和憑證跳過，<strong>根本沒有被傳遞到底層的連線</strong>。這解釋了為什麼程式碼改了卻沒效果——設定寫了等於沒寫。</p>
      <div class="clue-image-placeholder" data-desc="相關 GitHub Issue 或文件截圖，說明 HttpClientHandler 的 TLS 設定問題"></div>
      <p>而封測環境能通過，很可能是因為封測機器的 OS 版本或憑證存儲狀態剛好不會觸發這個問題。</p>
    `,
    insight: '🔥 HttpClientHandler 不會正確將 TLS 版本和憑證檢查設定套用到實際 request！',
    references: ['CLUE-13'],
    order: 14
  },

  // ── CLUE-15 ── 破案 ─────────────────────────────────────
  {
    id: 'CLUE-15',
    keywords: ['HttpWebRequest', '解決', '搞定', '結案', 'WebRequest', 'solved', '破案'],
    title: '破案：改用 HttpWebRequest',
    type: 'breakthrough',
    icon: '🔑',
    content: `
      <p>既然 <code>HttpClient</code> + <code>HttpClientHandler</code> 的組合靠不住，那就換一個方式發 HTTP request。</p>
      <p>改用較舊但更底層的 <code>HttpWebRequest</code>，它可以<strong>直接、確實地</strong>設定 TLS 版本和憑證驗證回呼：</p>
      <pre><code>// 改用 HttpWebRequest 的寫法
ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;
ServicePointManager.ServerCertificateValidationCallback =
    (sender, cert, chain, errors) => true;

var request = (HttpWebRequest)WebRequest.Create(webhookUrl);
request.Proxy = new WebProxy(proxyUrl);
request.Method = "POST";
request.ContentType = "application/json";

using (var stream = request.GetRequestStream())
{
    stream.Write(payload, 0, payload.Length);
}

var response = (HttpWebResponse)request.GetResponse();</code></pre>
      <p>部署到正式環境 → <strong>成功 ✅ 🎉</strong>！Teams 頻道恢復收到付款通知，線上事件解除。</p>
      <p>至於為什麼正式環境的 TLS/憑證狀態會突然出問題（懷疑是 Windows Update 或憑證過期），以及 HttpClientHandler 的底層行為細節，留待後續 Root Cause 深入分析。案件——暫時結案。</p>
    `,
    insight: '🎉 改用 HttpWebRequest 後，TLS/憑證設定正確生效，線上問題解除！',
    references: ['CLUE-14', 'CLUE-12'],
    order: 15
  }
];

// ============================================================
// 搜尋引擎：提供關鍵字搜尋、ID 查詢、排序等功能
// ============================================================

/**
 * 以關鍵字搜尋線索（模糊比對）
 * 比對範圍：clue.keywords 陣列 + clue.title
 * @param {string} keyword - 使用者輸入的搜尋關鍵字
 * @returns {Array} 符合的線索物件陣列
 */
function searchClues(keyword) {
  if (!keyword || typeof keyword !== 'string') return [];

  var term = keyword.trim().toLowerCase();
  if (term === '') return [];

  return CLUES.filter(function (clue) {
    // 比對 keywords 陣列（子字串匹配，不分大小寫）
    var keywordMatch = clue.keywords.some(function (kw) {
      return kw.toLowerCase().indexOf(term) !== -1;
    });
    if (keywordMatch) return true;

    // 比對標題（子字串匹配，不分大小寫）
    return clue.title.toLowerCase().indexOf(term) !== -1;
  });
}

/**
 * 依 ID 取得單一線索
 * @param {string} id - 線索 ID，例如 'CLUE-01'
 * @returns {Object|undefined} 線索物件，找不到則回傳 undefined
 */
function getClueById(id) {
  if (!id || typeof id !== 'string') return undefined;

  var normalized = id.trim().toUpperCase();
  return CLUES.find(function (clue) {
    return clue.id === normalized;
  });
}

/**
 * 取得所有線索，依 order 欄位排序
 * @returns {Array} 排序後的線索物件陣列（淺拷貝）
 */
function getAllCluesSorted() {
  return CLUES.slice().sort(function (a, b) {
    return a.order - b.order;
  });
}

/**
 * 取得線索總數
 * @returns {number}
 */
function getTotalCount() {
  return CLUES.length;
}

// ============================================================
// 掛載到 window，供其他腳本使用
// ============================================================
window.ClueEngine = {
  CLUES: CLUES,
  CLUE_TYPES: CLUE_TYPES,
  searchClues: searchClues,
  getClueById: getClueById,
  getAllCluesSorted: getAllCluesSorted,
  getTotalCount: getTotalCount
};
