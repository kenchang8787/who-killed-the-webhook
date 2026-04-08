/**
 * clues.js — 線索資料定義與搜尋引擎
 * "Who Killed the Webhook" — 互動式偵探風格技術分享
 * 搜尋機制：Token-based 模糊比對，全命中優先
 */

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
// 28 條線索（每條 = 一個調查動作）
// ============================================================
const CLUES = [
  { id: 'CLUE-01', keywords: ['Teams通知', '回報'], aliases: ['通知', '業務', '付款', '消失', '停止', '通知中斷'], hintKeyword: 'Teams通知', hintQuestion: 'Teams 通知怎麼了？', title: 'Teams 通知怎麼了？', type: 'screenshot', icon: '🖼️',
    content: `<p>3/25（三）業務回報 Teams 完款通知消失。有交易但沒通知。各區頻道在 <strong>3/25 下午陸續中斷</strong>。完款通知的程式碼在 <strong>28202</strong>。</p>
      <div class="clue-image-group"><div class="clue-image-item"><img src="img/clue/最後一則通知_台北.png" alt="台北"><div class="clue-image-caption">台北 — 最後一則通知</div></div><div class="clue-image-item"><img src="img/clue/最後一則通知_台中.png" alt="台中"><div class="clue-image-caption">台中 — 最後一則通知</div></div><div class="clue-image-item"><img src="img/clue/最後一則通知_中國.png" alt="中國"><div class="clue-image-caption">中國 — 最後一則通知</div></div></div>`,
    insight: '3/25 下午陸續中斷，完款通知程式在 28202', references: [], order: 1 },

  { id: 'CLUE-02', keywords: ['封測Postman'], aliases: ['封測', 'staging', 'Postman', 'TBDAPI', '測試'], hintKeyword: '封測Postman', hintQuestion: '封測 Postman 測試', title: '封測 Postman 測試', type: 'test', icon: '🧪',
    content: `<p>在本地用 Postman 打 TBDAPI 封測環境，回傳 <code>Success: true, 執行成功</code>。<strong>封測正常</strong>。</p>
      <div class="clue-image-item clue-image-single"><img src="img/clue/TBDAPI_封測_Postman_Origin.png" alt="封測 Postman"><div class="clue-image-caption">封測 — Success: true</div></div>`,
    insight: '封測 Postman 回傳成功', references: ['CLUE-01'], order: 2 },

  { id: 'CLUE-03', keywords: ['28202Jenkins', '28202部署'], aliases: ['28202', '完款服務', '上版', '部署', 'deploy', '更版', 'Jenkins'], hintKeyword: '28202Jenkins', hintQuestion: '28202 有上版嗎？', title: '28202 有上版嗎？', type: 'dead-end', icon: '❌',
    content: `<p>28202 的 Jenkins 部署紀錄：<strong>最近沒有更版</strong>，最後一次部署遠早於問題發生時間。</p>
      <div class="clue-image-item clue-image-single"><img src="img/clue/28202_Jenkins_Origin.png" alt="28202 Jenkins"><div class="clue-image-caption">28202 Jenkins — 最近無更版</div></div>`,
    insight: '28202 最近無更版', references: ['CLUE-01'], order: 3 },

  { id: 'CLUE-04', keywords: ['28202代碼', '追code'], aliases: ['code', '原始碼', '代碼', '28202', 'SendWebhook', '呼叫鏈'], hintKeyword: '28202代碼', hintQuestion: '追 28202 原始碼', title: '追 28202 原始碼', type: 'code', icon: '💻',
    content: `<p>28202 的原始碼：它<strong>不是自己打 Teams Webhook</strong>，而是呼叫 <strong>TBDAPI</strong> 的 <code>/Teams/SendWebhook</code>。</p>
      <div class="clue-image-item clue-image-single"><img src="img/clue/28202_代碼_呼叫TBDAPI.png" alt="28202 代碼"><div class="clue-image-caption">28202 → TBDAPI /Teams/SendWebhook</div></div>`,
    insight: '28202 呼叫 TBDAPI 的 /Teams/SendWebhook', references: ['CLUE-03'], order: 4 },

  { id: 'CLUE-05', keywords: ['28202config'], aliases: ['config', '設定', '28202', '封測', '正式'], hintKeyword: '28202config', hintQuestion: '28202 的 Config？', title: '28202 的 Config？', type: 'analysis', icon: '🔬',
    content: `<p>28202 封測與正式的 TBDAPI 設定，各自指向對應環境的端點。</p>
      <div class="clue-image-compare"><div class="compare-col"><div class="compare-label">封測 Config</div><div class="clue-image-item"><img src="img/clue/28202_封測_TBDAPI_Config.png" alt="28202 封測 Config"></div></div><div class="compare-col"><div class="compare-label">正式 Config</div><div class="clue-image-item"><img src="img/clue/28202_正式_TBDAPI_Config.png" alt="28202 正式 Config"></div></div></div>`,
    insight: '封測/正式各自指向對應的 TBDAPI 端點', references: ['CLUE-04'], order: 5 },

  { id: 'CLUE-06', keywords: ['28202IP'], aliases: ['IP', '機器', '28202', '封測', '正式', '網段'], hintKeyword: '28202IP', hintQuestion: '28202 機器 IP？', title: '28202 機器 IP？', type: 'analysis', icon: '🔬',
    content: `<p>28202 封測與正式的機器 IP，兩邊在<strong>不同網段</strong>。</p>
      <div class="clue-image-compare"><div class="compare-col"><div class="compare-label">封測</div><div class="clue-image-item"><img src="img/clue/28202_封測_IP.png" alt="28202 封測 IP"></div></div><div class="compare-col"><div class="compare-label">正式</div><div class="clue-image-item"><img src="img/clue/28202_正式_IP.png" alt="28202 正式 IP"></div></div></div>`,
    insight: '封測與正式在不同網段', references: ['CLUE-04'], order: 6 },

  { id: 'CLUE-07', keywords: ['TBDAPIJenkins', 'TBDAPI部署'], aliases: ['TBDAPI', '部署', '上版', 'deploy', 'Jenkins'], hintKeyword: 'TBDAPIJenkins', hintQuestion: 'TBDAPI 有上版嗎？', title: 'TBDAPI 有上版嗎？', type: 'dead-end', icon: '❌',
    content: `<p>TBDAPI 的 Jenkins 部署紀錄：<strong>最近也沒有更版</strong>，穩定運行已久。</p>
      <div class="clue-image-item clue-image-single"><img src="img/clue/TBDAPI_Jenkins_Origin.png" alt="TBDAPI Jenkins"><div class="clue-image-caption">TBDAPI Jenkins — 最近無更版</div></div>`,
    insight: 'TBDAPI 最近也無更版', references: ['CLUE-04'], order: 7 },

  { id: 'CLUE-08', keywords: ['ELK', 'log'], aliases: ['日誌', '錯誤', 'error', '異常', '28202', '作業逾時', 'kibana'], hintKeyword: 'ELK', hintQuestion: '查 ELK 日誌', title: '查 ELK 日誌', type: 'log', icon: '📋',
    content: `<p>ELK 日誌：28202 呼叫 TBDAPI 的 <code>SendTeams</code> 時，TBDAPI 端拋出 <strong>ERROR</strong>，<code>message=作業逾時</code>。</p>
      <div class="clue-image-item clue-image-single"><img src="img/clue/28202_ELK_SendTeams.png" alt="ELK"><div class="clue-image-caption">ELK — SendTeams ERROR 作業逾時</div></div>`,
    insight: 'TBDAPI SendTeams 拋出「作業逾時」', references: ['CLUE-04', 'CLUE-07'], order: 8 },

  { id: 'CLUE-09', keywords: ['TBDAPI代碼', 'TBDAPI原始碼'], aliases: ['代碼', 'code', '原始碼', 'proxy', 'HttpClientHandler', 'WebProxy', 'TBDAPI', 'message-proxy'], hintKeyword: 'TBDAPI代碼', hintQuestion: '看 TBDAPI 原始碼', title: '看 TBDAPI 原始碼', type: 'code', icon: '💻',
    content: `<p>TBDAPI 原始碼：<code>SendMessage()</code> 讀取 <code>MessageProxyUrl</code>，透過 <code>TeamsApiProxy</code> 發送。底層 <code>PostRawJsonDataByProxy()</code> 使用 <strong>HttpClientHandler + WebProxy</strong> 經 message-proxy 打外網。</p>
      <div class="clue-image-group"><div class="clue-image-item"><img src="img/clue/TBDAPI_代碼_1.png" alt="代碼 1"><div class="clue-image-caption">SendMessage()</div></div><div class="clue-image-item"><img src="img/clue/TBDAPI_代碼_2.png" alt="代碼 2"><div class="clue-image-caption">SendMessage(WebhookMessage)</div></div><div class="clue-image-item"><img src="img/clue/TBDAPI_代碼_3.png" alt="代碼 3"><div class="clue-image-caption">PostRawJsonDataByProxy()</div></div></div>`,
    insight: 'HttpClientHandler + WebProxy 經 message-proxy 打外網', references: ['CLUE-08'], order: 9 },

  { id: 'CLUE-10', keywords: ['正式Postman'], aliases: ['Postman', '驗證', '測試', 'TBDAPI', '正式', '封測'], hintKeyword: '正式Postman', hintQuestion: 'Postman 打正式環境', title: 'Postman 打正式環境', type: 'test', icon: '🧪',
    content: `<p>Postman 對 TBDAPI 發 request。封測 <code>Success: true, 執行成功</code>；正式 <code>Success: false, "An error occurred while sending the request."</code>。</p>
      <div class="clue-image-compare"><div class="compare-col"><div class="compare-label compare-success">封測 ✅</div><div class="clue-image-item"><img src="img/clue/TBDAPI_封測_Postman_Origin.png" alt="封測 Postman"></div></div><div class="compare-col"><div class="compare-label compare-fail">正式 ❌</div><div class="clue-image-item"><img src="img/clue/TBDAPI_正式_Postman_Origin.png" alt="正式 Postman"></div></div></div>`,
    insight: '封測成功、正式 "An error occurred..."', references: ['CLUE-09', 'CLUE-02'], order: 10 },

  { id: 'CLUE-11', keywords: ['ProxyURL', 'proxy設定'], aliases: ['config', '設定', 'proxy', 'TBDAPI', '封測', '正式'], hintKeyword: 'ProxyURL', hintQuestion: '比對 ProxyURL 設定', title: '比對 ProxyURL 設定', type: 'dead-end', icon: '❌',
    content: `<p>封測與正式的 TBDAPI ProxyURL 設定：<strong>完全相同</strong>，都指向同一個 proxy 位址。</p>
      <div class="clue-image-compare"><div class="compare-col"><div class="compare-label">封測 ProxyURL</div><div class="clue-image-item"><img src="img/clue/TBDAPI_封測_ProxyURL_Config.png" alt="封測 ProxyURL"></div></div><div class="compare-col"><div class="compare-label">正式 ProxyURL</div><div class="clue-image-item"><img src="img/clue/TBDAPI_正式_ProxyURL_Config.png" alt="正式 ProxyURL"></div></div></div>`,
    insight: '封測/正式 ProxyURL 完全相同', references: ['CLUE-10'], order: 11 },

  { id: 'CLUE-12', keywords: ['GPT', 'ChatGPT'], aliases: ['搜尋', '原因', 'ACL', 'DNS', 'TLS', '錯誤', 'error', '嫌疑', '方向'], hintKeyword: 'GPT', hintQuestion: '問 ChatGPT 錯誤訊息', title: '問 ChatGPT 錯誤訊息', type: 'analysis', icon: '🔬',
    content: `<p>用 ChatGPT 查詢 <code>"An error occurred while sending the request"</code>，歸納三個方向：</p>
      <ol><li><strong>ACL 改變</strong> — 網路層被擋</li><li><strong>DNS 解析問題</strong> — 解析到錯的 IP</li><li><strong>TLS/SSL 握手失敗</strong> — 憑證或加密協定問題</li></ol>`,
    insight: 'ChatGPT 歸納：ACL / DNS / TLS', references: ['CLUE-10'], order: 12 },

  { id: 'CLUE-13', keywords: ['TBDAPIIP', 'TBDAPI機器'], aliases: ['IP', '機器', 'TBDAPI', '封測', '正式', '19.204', '19.25', '網段'], hintKeyword: 'TBDAPIIP', hintQuestion: 'TBDAPI 機器 IP？', title: 'TBDAPI 機器 IP？', type: 'analysis', icon: '🔬',
    content: `<p>TBDAPI 封測與正式的機器 IP。封測在 <strong>19.204</strong> 網段，正式在 <strong>19.25</strong> 網段。</p>
      <div class="clue-image-compare"><div class="compare-col"><div class="compare-label">封測 19.204</div><div class="clue-image-item"><img src="img/clue/TBDAPI_封測_IP.png" alt="TBDAPI 封測 IP"></div></div><div class="compare-col"><div class="compare-label">正式 19.25</div><div class="clue-image-item"><img src="img/clue/TBDAPI_正式_IP.png" alt="TBDAPI 正式 IP"></div></div></div>`,
    insight: '封測 19.204 / 正式 19.25', references: ['CLUE-12'], order: 13 },

  { id: 'CLUE-14', keywords: ['ping'], aliases: ['PING', '封測', '正式', '19.204', '19.25', '網路', 'IP'], hintKeyword: 'ping', hintQuestion: 'PING 測試', title: 'PING 測試', type: 'dead-end', icon: '❌',
    content: `<p>封測（19.204）與正式（19.25）對 message-proxy PING：<strong>兩邊都通</strong>。</p>
      <div class="clue-image-compare"><div class="compare-col"><div class="compare-label compare-success">封測 19.204 ✅</div><div class="clue-image-item"><img src="img/clue/19.204_PING.png" alt="封測 PING"></div></div><div class="compare-col"><div class="compare-label compare-success">正式 19.25 ✅</div><div class="clue-image-item"><img src="img/clue/19.25_PING.png" alt="正式 PING"></div></div></div>`,
    insight: 'PING 兩邊都正常', references: ['CLUE-12'], order: 14 },

  { id: 'CLUE-15', keywords: ['DNS', 'DNS解析'], aliases: ['封測', '正式', '19.204', '19.25', '網路', 'resolve', 'IP'], hintKeyword: 'DNS', hintQuestion: 'DNS 解析', title: 'DNS 解析', type: 'dead-end', icon: '❌',
    content: `<p>封測與正式的 DNS 解析 message-proxy：<strong>解析結果一致</strong>。</p>
      <div class="clue-image-compare"><div class="compare-col"><div class="compare-label compare-success">封測 19.204 ✅</div><div class="clue-image-item"><img src="img/clue/19.204_DNS_Resolve.png" alt="封測 DNS"></div></div><div class="compare-col"><div class="compare-label compare-success">正式 19.25 ✅</div><div class="clue-image-item"><img src="img/clue/19.25_DNS_Resolve.png" alt="正式 DNS"></div></div></div>`,
    insight: 'DNS 解析結果一致', references: ['CLUE-12'], order: 15 },

  { id: 'CLUE-16', keywords: ['hosts'], aliases: ['hosts檔', '封測', '正式', '19.204', '19.25', 'IP'], hintKeyword: 'hosts', hintQuestion: '檢查 hosts 檔案', title: '檢查 hosts 檔案', type: 'dead-end', icon: '❌',
    content: `<p>封測與正式的 hosts 檔案：<strong>無 message-proxy 相關覆寫</strong>。</p>
      <div class="clue-image-compare"><div class="compare-col"><div class="compare-label compare-success">封測 19.204 ✅</div><div class="clue-image-item"><img src="img/clue/19.204_hosts.png" alt="封測 hosts"></div></div><div class="compare-col"><div class="compare-label compare-success">正式 19.25 ✅</div><div class="clue-image-item"><img src="img/clue/19.25_hosts.png" alt="正式 hosts"></div></div></div>`,
    insight: 'hosts 無覆寫', references: ['CLUE-12'], order: 16 },

  { id: 'CLUE-17', keywords: ['TCP', 'port3128'], aliases: ['連線', 'Test-NetConnection', '3128', '封測', '正式', '19.204', '19.25', 'IP'], hintKeyword: 'TCP', hintQuestion: 'TCP Port 3128', title: 'TCP Port 3128', type: 'dead-end', icon: '❌',
    content: `<p>封測與正式對 message-proxy Port 3128 TCP 連線：<strong>TcpTestSucceeded = True</strong>。</p>
      <div class="clue-image-compare"><div class="compare-col"><div class="compare-label compare-success">封測 19.204 ✅</div><div class="clue-image-item"><img src="img/clue/19.204_Test-NetConnection.png" alt="封測 TCP"></div></div><div class="compare-col"><div class="compare-label compare-success">正式 19.25 ✅</div><div class="clue-image-item"><img src="img/clue/19.25_Test-NetConnection.png" alt="正式 TCP"></div></div></div>`,
    insight: 'TCP Port 3128 兩邊都通', references: ['CLUE-12'], order: 17 },

  { id: 'CLUE-18', keywords: ['GIS', '網管'], aliases: ['ACL', '協助', '確認', '網路'], hintKeyword: 'GIS', hintQuestion: '問 GIS 團隊 ACL', title: '問 GIS 團隊 ACL', type: 'dead-end', icon: '❌',
    content: `<p>向 GIS 網管團隊確認：最近<strong>沒有任何 ACL 變更</strong>。</p>
      <div class="clue-image-item clue-image-single"><img src="img/clue/GIS_協助.png" alt="GIS 確認"><div class="clue-image-caption">GIS 團隊 — 無 ACL 變更</div></div>`,
    insight: 'GIS 確認無 ACL 變更', references: ['CLUE-14'], order: 18 },

  { id: 'CLUE-19', keywords: ['HTTP測試'], aliases: ['HTTP', 'Invoke-WebRequest', 'PowerShell', '封測', '正式', '19.204', '19.25', 'proxy', 'IP'], hintKeyword: 'HTTP測試', hintQuestion: '一般 HTTP Request', title: '一般 HTTP Request', type: 'test', icon: '🧪',
    content: `<p>RDP 到封測/正式機器，PowerShell 透過 proxy 發一般 HTTP request。封測<strong>成功</strong>，正式<strong>失敗</strong>。</p>
      <div class="clue-image-compare"><div class="compare-col"><div class="compare-label compare-success">封測 19.204 ✅</div><div class="clue-image-item"><img src="img/clue/19.204_HTTP_Origin_1.png" alt="封測 HTTP 1"></div><div class="clue-image-item"><img src="img/clue/19.204_HTTP_Origin_2.png" alt="封測 HTTP 2"></div></div><div class="compare-col"><div class="compare-label compare-fail">正式 19.25 ❌</div><div class="clue-image-item"><img src="img/clue/19.25_HTTP_Origin.png" alt="正式 HTTP"></div></div></div>`,
    insight: '一般 HTTP：封測成功、正式失敗', references: ['CLUE-12'], order: 19 },

  { id: 'CLUE-20', keywords: ['TLS12', 'TLS1.2'], aliases: ['TLS', 'SSL', '封測', '正式', '19.204', '19.25', 'security', 'IP'], hintKeyword: 'TLS12', hintQuestion: '指定 TLS 1.2', title: '指定 TLS 1.2', type: 'test', icon: '🧪',
    content: `<p>指定 TLS 1.2 後重試。封測<strong>成功</strong>，正式<strong>仍失敗但錯誤訊息變了</strong>（從泛用錯誤變成 security error）。</p>
      <div class="clue-image-compare"><div class="compare-col"><div class="compare-label compare-success">封測 19.204 ✅</div><div class="clue-image-item"><img src="img/clue/19.204_HTTP_TLS12_1.png" alt="封測 TLS12 1"></div><div class="clue-image-item"><img src="img/clue/19.204_HTTP_TLS12_2.png" alt="封測 TLS12 2"></div></div><div class="compare-col"><div class="compare-label compare-fail">正式 19.25 ❌ (不同錯誤!)</div><div class="clue-image-item"><img src="img/clue/19.25_HTTP_TLS12.png" alt="正式 TLS12"></div></div></div>`,
    insight: '指定 TLS 1.2：正式仍失敗但錯誤訊息改變', references: ['CLUE-19'], order: 20 },

  { id: 'CLUE-21', keywords: ['跳過憑證', 'SkipCert'], aliases: ['憑證', 'certificate', '封測', '正式', '19.204', '19.25', 'TLS', 'IP'], hintKeyword: '跳過憑證', hintQuestion: '跳過憑證驗證', title: '跳過憑證驗證', type: 'breakthrough', icon: '🔑',
    content: `<p>TLS 1.2 + 跳過憑證驗證。封測<strong>成功</strong>，正式<strong>也成功了！</strong></p>
      <div class="clue-image-compare"><div class="compare-col"><div class="compare-label compare-success">封測 19.204 ✅</div><div class="clue-image-item"><img src="img/clue/19.204_HTTP_TLS12_SkipCert.png" alt="封測 SkipCert"></div></div><div class="compare-col"><div class="compare-label compare-success">正式 19.25 ✅</div><div class="clue-image-item"><img src="img/clue/19.25_HTTP_TLS12_SkipCert.png" alt="正式 SkipCert"></div></div></div>`,
    insight: '跳過憑證 → 正式也成功！確認是 TLS/憑證問題', references: ['CLUE-20'], order: 21 },

  { id: 'CLUE-22', keywords: ['憑證比對', 'cert'], aliases: ['憑證', 'certificate', '封測', '正式', '19.204', '19.25', 'IP'], hintKeyword: '憑證比對', hintQuestion: '比對憑證', title: '比對憑證', type: 'analysis', icon: '🔬',
    content: `<p>封測與正式機器的憑證清單比對：</p>
      <div class="clue-image-compare"><div class="compare-col"><div class="compare-label">封測 19.204</div><div class="clue-image-item"><img src="img/clue/19.204_Cert.png" alt="封測 Cert"></div></div><div class="compare-col"><div class="compare-label">正式 19.25</div><div class="clue-image-item"><img src="img/clue/19.25_Cert.png" alt="正式 Cert"></div></div></div>`,
    insight: '封測與正式的憑證清單', references: ['CLUE-21'], order: 22 },

  { id: 'CLUE-23', keywords: ['TLS版本'], aliases: ['TLS', '版本', '封測', '正式', '19.204', '19.25', 'IP'], hintKeyword: 'TLS版本', hintQuestion: '比對 TLS 版本', title: '比對 TLS 版本', type: 'analysis', icon: '🔬',
    content: `<p>封測與正式機器的 TLS 版本設定比對：</p>
      <div class="clue-image-compare"><div class="compare-col"><div class="compare-label">封測 19.204</div><div class="clue-image-item"><img src="img/clue/19.204_OS_Tls_version.png" alt="封測 TLS 版本"></div></div><div class="compare-col"><div class="compare-label">正式 19.25</div><div class="clue-image-item"><img src="img/clue/19.25_OS_Tls_verion.png" alt="正式 TLS 版本"></div></div></div>`,
    insight: '封測與正式的 TLS 版本設定', references: ['CLUE-21'], order: 23 },

  { id: 'CLUE-24', keywords: ['fix', '修復'], aliases: ['發版', '上線', '代碼', 'TBDAPI', 'TLS', 'HttpClientHandler'], hintKeyword: 'fix', hintQuestion: '第一次修復上線', title: '第一次修復上線', type: 'log', icon: '📋',
    content: `<p>在 TBDAPI 透過 <code>HttpClientHandler</code> 加上 TLS 1.2 + 跳過憑證。部署封測 <strong>成功 ✅</strong>，部署正式 <strong>仍失敗 ❌</strong>，錯誤訊息與修改前相同。</p>
      <div class="clue-image-item clue-image-single"><img src="img/clue/TBDAPI_修正代碼_Proxy代打_指定TLS_跳過憑證.png" alt="修改代碼"><div class="clue-image-caption">HttpClientHandler 加 TLS 1.2 + 跳過憑證</div></div>`,
    insight: '加了 TLS + 跳過憑證，封測成功但正式仍失敗', references: ['CLUE-21'], order: 24 },

  { id: 'CLUE-25', keywords: ['OS版本', 'Windows'], aliases: ['OS', '2012', '封測', '正式', '19.204', '19.25', 'IP'], hintKeyword: 'OS版本', hintQuestion: '比對 OS 版本', title: '比對 OS 版本', type: 'analysis', icon: '🔬',
    content: `<p>封測與正式的 OS 版本：兩邊都是 <strong>Windows Server 2012 R2</strong>。</p>
      <div class="clue-image-compare"><div class="compare-col"><div class="compare-label">封測 19.204</div><div class="clue-image-item"><img src="img/clue/19.204_OS_ver.png" alt="封測 OS"></div></div><div class="compare-col"><div class="compare-label">正式 19.25</div><div class="clue-image-item"><img src="img/clue/19.25_OS_ver.png" alt="正式 OS"></div></div></div>`,
    insight: '兩邊都是 Windows Server 2012 R2', references: ['CLUE-24'], order: 25 },

  { id: 'CLUE-26', keywords: ['HttpClientHandler', 'HttpClient'], aliases: ['handler', 'bug', '真兇', '無效', 'GPT', 'ChatGPT', 'TBDAPI', 'TLS'], hintKeyword: 'HttpClientHandler', hintQuestion: '查 HttpClientHandler', title: '查 HttpClientHandler', type: 'breakthrough', icon: '🔑',
    content: `<p>ChatGPT 搜尋 <code>HttpClientHandler ServerCertificateCustomValidationCallback not working</code>。結論：<strong>HttpClientHandler 在某些 OS 下不會正確將 TLS/憑證設定套用到實際 request</strong>。</p>
      <div class="clue-image-group"><div class="clue-image-item"><img src="img/clue/GPT_HttpClient_無效.png" alt="HttpClient 問題"><div class="clue-image-caption">HttpClientHandler 已知問題</div></div><div class="clue-image-item"><img src="img/clue/GPT_HttpClient_解法_1.png" alt="解法建議"><div class="clue-image-caption">建議解法方向</div></div></div>`,
    insight: 'HttpClientHandler 在某些 OS 下不會正確套用 TLS/憑證設定', references: ['CLUE-24'], order: 26 },

  { id: 'CLUE-27', keywords: ['GPT解法'], aliases: ['GPT', 'ChatGPT', 'HttpWebRequest', 'WebRequest', '解法'], hintKeyword: 'GPT解法', hintQuestion: 'ChatGPT 查 HttpWebRequest', title: 'ChatGPT 查 HttpWebRequest', type: 'analysis', icon: '🔬',
    content: `<p>ChatGPT 建議改用 <code>HttpWebRequest</code>，可以直接設定 TLS 版本和憑證驗證回呼。</p>
      <div class="clue-image-item clue-image-single"><img src="img/clue/GPT_HttpWebRequest.png" alt="GPT HttpWebRequest"><div class="clue-image-caption">ChatGPT — HttpWebRequest 解法</div></div>`,
    insight: 'ChatGPT 建議改用 HttpWebRequest', references: ['CLUE-26'], order: 27 },

  { id: 'CLUE-28', keywords: ['破案', '結案'], aliases: ['HttpWebRequest', 'WebRequest', '解決', '搞定', 'TBDAPI', '代碼', 'code'], hintKeyword: '破案', hintQuestion: '改用 HttpWebRequest 破案', title: '改用 HttpWebRequest 破案', type: 'breakthrough', icon: '🔑',
    content: `<p>改用 <code>HttpWebRequest</code> 取代 <code>HttpClient + HttpClientHandler</code>。部署正式環境 → <strong>成功 ✅</strong>。Teams 頻道恢復收到完款通知。</p>
      <div class="clue-image-item clue-image-single"><img src="img/clue/TBDAPI_修正代碼_Proxy代打_HttpWebRequest.png" alt="最終代碼"><div class="clue-image-caption">最終修改 — HttpWebRequest</div></div>`,
    insight: '改用 HttpWebRequest，部署正式成功', references: ['CLUE-27'], order: 28 }
];

// ============================================================
// 關鍵字 → 線索 反向索引（精確 keyword 快速路徑）
// ============================================================
var KEYWORD_INDEX = {};
CLUES.forEach(function (clue) {
  clue.keywords.forEach(function (kw) {
    KEYWORD_INDEX[kw.toLowerCase()] = clue;
  });
});

// ============================================================
// Token 工具
// ============================================================
var NOISE_WORDS = ['有沒有', '是不是', '看看', '一下', '有', '沒', '嗎', '呢', '查', '的', '了', '在', '是'];

function tokenize(input) {
  if (!input) return [];
  var raw = input.trim().toLowerCase();
  var sorted = NOISE_WORDS.slice().sort(function (a, b) { return b.length - a.length; });
  sorted.forEach(function (w) { raw = raw.split(w).join(' '); });
  var matches = raw.match(/([a-zA-Z0-9\.\-]+|[\u4e00-\u9fff]+)/g);
  if (!matches) return [];
  return matches.filter(function (t) { return t.length > 0; });
}

function getMatchPool(clue) {
  var pool = [];
  (clue.keywords || []).forEach(function (kw) { pool.push(kw.toLowerCase()); });
  (clue.aliases || []).forEach(function (a) { pool.push(a.toLowerCase()); });
  return pool;
}

// ============================================================
// 搜尋引擎
// ============================================================
function searchClues(keyword) {
  if (!keyword || typeof keyword !== 'string') return { clue: null, suggestion: null };
  var term = keyword.replace(/\s+/g, ' ').trim().toLowerCase();
  if (term === '') return { clue: null, suggestion: null };

  if (KEYWORD_INDEX[term]) return { clue: KEYWORD_INDEX[term], suggestion: null };

  var idMatch = term.toUpperCase();
  var byId = CLUES.find(function (c) { return c.id === idMatch; });
  if (byId) return { clue: byId, suggestion: null };

  var tokens = tokenize(term);
  if (tokens.length > 0) {
    var bestClue = null, bestScore = 0;
    CLUES.forEach(function (clue) {
      var pool = getMatchPool(clue), matched = 0;
      tokens.forEach(function (token) {
        if (pool.some(function (p) { return p.indexOf(token) !== -1 || token.indexOf(p) !== -1; })) matched++;
      });
      if (matched === 0) return;
      var score = matched;
      if (matched === tokens.length) score += tokens.length * 100;
      if (score > bestScore || (score === bestScore && (!bestClue || clue.order < bestClue.order))) {
        bestScore = score; bestClue = clue;
      }
    });
    if (bestClue) return { clue: bestClue, suggestion: null };
  }

  var allKeywords = Object.keys(KEYWORD_INDEX), suggestion = null;
  for (var i = 0; i < allKeywords.length; i++) {
    var kw = allKeywords[i];
    if (kw.indexOf(term) !== -1 || term.indexOf(kw) !== -1) { suggestion = kw; break; }
  }
  return { clue: null, suggestion: suggestion };
}

function autocomplete(input) {
  if (!input || input.length < 1) return [];
  var p = input.replace(/\s+/g, ' ').trim().toLowerCase();
  if (!p) return [];
  var seen = {}, results = [];
  var tokens = tokenize(p);
  if (tokens.length === 0) tokens = [p];

  CLUES.forEach(function (clue) {
    var pool = getMatchPool(clue), matched = 0;
    tokens.forEach(function (token) {
      if (pool.some(function (pw) { return pw.indexOf(token) !== -1 || token.indexOf(pw) !== -1; })) matched++;
    });
    if (matched > 0 && !seen[clue.id]) {
      seen[clue.id] = true;
      var score = matched;
      if (matched === tokens.length) score += tokens.length * 100;
      results.push({ keyword: clue.hintKeyword, title: clue.title, clueId: clue.id, score: score });
    }
  });

  results.sort(function (a, b) {
    if (b.score !== a.score) return b.score - a.score;
    var ca = getClueById(a.clueId), cb = getClueById(b.clueId);
    return (ca ? ca.order : 99) - (cb ? cb.order : 99);
  });
  return results;
}

function getClueById(id) {
  if (!id || typeof id !== 'string') return undefined;
  return CLUES.find(function (clue) { return clue.id === id.trim().toUpperCase(); });
}

function getAllCluesSorted() {
  return CLUES.slice().sort(function (a, b) { return a.order - b.order; });
}

function getTotalCount() { return CLUES.length; }

// ============================================================
// 掛載到 window
// ============================================================
window.ClueEngine = {
  CLUES: CLUES,
  CLUE_TYPES: CLUE_TYPES,
  KEYWORD_INDEX: KEYWORD_INDEX,
  searchClues: searchClues,
  autocomplete: autocomplete,
  getClueById: getClueById,
  getAllCluesSorted: getAllCluesSorted,
  getTotalCount: getTotalCount
};
