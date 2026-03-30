# Who Killed the Webhook — 互動式偵探分享網頁

## 問題概述
建立一個靜態互動式網頁，取代傳統簡報，用於 20-30 分鐘的 Tech Sharing。
主題為「Who Killed the Webhook」——Teams 完款通知壞掉的偵查過程。
風格：現代簡潔 + 偵探元素。技術棧：純 HTML + CSS + JavaScript（零依賴）。

## 整體架構

```
who-killed-the-webhook/
├── index.html              # 主頁面
├── css/
│   └── style.css           # 所有樣式
├── js/
│   ├── app.js              # 主程式邏輯（場景切換、全域狀態）
│   ├── clues.js            # 線索資料定義 & 搜索引擎
│   ├── evidence-board.js   # 證據板（收集的線索面板）
│   └── effects.js          # 動畫 & 特效（打字機、confetti 等）
├── img/                    # 截圖 & 圖片（佔位符先放）
│   └── placeholder.svg
└── README.md               # 使用說明
```

## 頁面流程設計（4 大場景）

### Scene 1: 開場 Landing
- 大標題動畫：「WHO KILLED THE WEBHOOK?」（打字機效果）
- 副標題：案件編號、日期
- 偵探主題圖示（🔍🕵️）
- 「開啟案件」按鈕 → 進入 Scene 2

### Scene 2: 案件概述 Case Briefing
- 案件簡報卡片：
  - Teams 完款通知壞掉了
  - 最後成功通知時間
  - 封測環境正常，正式環境異常
- 截圖佔位區（Teams 頻道截圖）
- 「開始調查」按鈕 → 進入 Scene 3

### Scene 3: 調查室 Investigation Room（核心互動區）
#### 左側：搜索終端
- 模擬終端介面，輸入關鍵字搜索線索
- 輸入框 + 搜索按鈕
- 支援模糊匹配（多組關鍵字可觸發同一線索）
- 找不到時顯示「沒有匹配的線索，試試其他方向」

#### 中間：線索展示區
- 搜索到的線索以卡片形式展示
- 統一 Clue Card 格式（見下方）
- 支援多種渲染類型

#### 右側：證據板 Evidence Board
- 收集的線索列表（可摺疊）
- 每條線索可點擊快速跳回查看
- 線索計數器：「已收集 X / Y 條線索」
- 收集足夠線索後出現「破案」按鈕

### Scene 4: 破案慶祝 Case Solved
- 大字：「🎉 案件偵破！」
- 真相總結卡片
- Confetti 動畫特效
- 時間線回顧（所有線索按順序排列）

## 線索系統設計

### Clue Card 統一格式
```
┌─────────────────────────────────────────┐
│ [圖示] CLUE #03          [類型 Badge]    │
│ ─────────────────────────────────────── │
│ 標題                                     │
│                                          │
│ 內容（文字/截圖/code block）              │
│                                          │
│ 💡 關鍵發現：...                          │
│                                          │
│ [📌 收集此線索]    [@CLUE-01] [@CLUE-02] │
└─────────────────────────────────────────┘
```

### 線索類型 & Badge
| 類型 | Badge | 說明 |
|------|-------|------|
| `log` | 📋 Log 記錄 | ELK/系統 log |
| `screenshot` | 🖼️ 截圖 | 畫面截圖證據 |
| `code` | 💻 程式碼 | 程式碼片段 |
| `analysis` | 🔬 分析 | 分析結論 |
| `test` | 🧪 測試 | Postman/手動測試結果 |
| `dead-end` | ❌ 排除 | 已排除的方向 |
| `breakthrough` | 🔑 突破 | 關鍵突破發現 |

### 線索 @ 引用機制
- 每條線索有唯一 ID（如 `CLUE-01`）
- 線索內容中可用 `@CLUE-XX` 引用其他線索
- 點擊引用可跳轉/高亮對應線索

### 線索資料（15 條，按調查順序）

| ID | 關鍵字 | 標題 | 類型 |
|----|--------|------|------|
| CLUE-01 | Teams通知, issue, 回報, 壞掉 | 案發現場：通知停了 | screenshot |
| CLUE-02 | 封測, staging, pre, 環境 | 封測環境一切正常 | test |
| CLUE-03 | 28202, 更版, deploy, 完款 | 完款服務 28202 — 無更版 | dead-end |
| CLUE-04 | code, 代碼, SendWebhook, 追code | 追蹤呼叫鏈：28202 → TBDAPI | code |
| CLUE-05 | TBDAPI, 更版, deploy | TBDAPI 也無更版 | dead-end |
| CLUE-06 | ELK, log, 錯誤, error | ELK 異常日誌：連線正常但有錯 | log |
| CLUE-07 | proxy, message-proxy, 代理, 外網 | 發現中繼站：message-proxy | analysis |
| CLUE-08 | Postman, test, 測試, 驗證 | Postman 驗證：封測✓ 正式✗ | test |
| CLUE-09 | config, 設定, proxy url, 網址 | Proxy 設定完全相同 | dead-end |
| CLUE-10 | Google, 方向, 可能, 原因 | 三大嫌疑方向：ACL / DNS / TLS | analysis |
| CLUE-11 | ping, DNS, network, 網路, 網管, ACL | 網路排查全通過 | dead-end |
| CLUE-12 | TLS, SSL, 憑證, certificate, 握手 | TLS 實驗：跳過憑證 → 成功！ | breakthrough |
| CLUE-13 | fix, 修復, 發版, 上線 | 第一次修復：仍然失敗 | log |
| CLUE-14 | HttpClientHandler, handler, bug | 真兇浮現：HttpClientHandler | breakthrough |
| CLUE-15 | HttpWebRequest, 解決, 搞定, 結案 | 破案：改用 HttpWebRequest | breakthrough |

## 互動特效

- **打字機效果**：標題、重要文字逐字顯現
- **搜索動畫**：輸入關鍵字後有「搜索中...」的 loading 效果
- **線索出現動畫**：卡片從下方滑入 + 淡入
- **證據板動畫**：線索收集時飛入右側面板
- **Confetti**：破案時的彩紙特效（純 CSS/JS 實現）
- **打字音效提示**：可選（預設關閉）
- **快捷鍵**：
  - `Enter` 搜索
  - `Esc` 關閉彈窗
  - `→` 下一場景（Landing/Briefing 中）

## 截圖佔位

所有需要截圖的地方先用帶說明文字的 placeholder 佔位，
使用者之後可替換 `img/` 下的圖片。需要的截圖：
- Teams 頻道通知截圖（最後成功 & 失敗）
- ELK 錯誤日誌截圖
- Postman 測試結果截圖
- 代碼截圖（HttpClientHandler vs HttpWebRequest）
- 其他你覺得有用的截圖

## Todos

1. **project-setup** — 建立專案結構 & 基礎 HTML
2. **css-theme** — 偵探風格 CSS 主題系統（現代簡潔 + 偵探元素）
3. **scene-landing** — Scene 1: Landing 開場頁
4. **scene-briefing** — Scene 2: 案件概述頁
5. **clue-system** — 線索資料定義 & 搜索引擎邏輯
6. **scene-investigation** — Scene 3: 調查室（搜索終端 + 線索展示 + 證據板）
7. **clue-cards** — Clue Card 多類型渲染 & @ 引用機制
8. **scene-solved** — Scene 4: 破案慶祝頁
9. **effects** — 動畫特效（打字機、confetti、過場動畫）
10. **polish** — 整體優化、快捷鍵、響應式、README
