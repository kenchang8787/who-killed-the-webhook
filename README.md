# 🔍 Who Killed the Webhook?

一場 Teams 完款通知的離奇死亡事件 — 互動式偵探分享網頁

## 簡介

這是一個用於 Tech Sharing（20-30 分鐘）的互動式靜態網頁，以偵探破案的形式呈現一次 Webhook 故障排查過程。

## 使用方式

直接用瀏覽器開啟 `index.html` 即可。

```
# 方法一：直接開啟
double-click index.html

# 方法二：使用 Live Server（推薦）
npx live-server .
```

## 操作說明

### 場景 1：開場 Landing
- 點擊 **「🔍 開啟案件」** 或按 `→` 鍵進入

### 場景 2：案件概述 Briefing
- 瀏覽案件基本資訊
- 點擊 **「🔎 開始調查」** 或按 `→` 鍵進入調查室

### 場景 3：調查室 Investigation（核心互動）
- **左側終端**：輸入關鍵字搜索線索（Enter 或點擊搜索）
- **中間區域**：展示找到的線索卡片
- **右側證據板**：收集的線索列表

#### 可用關鍵字
`Teams通知` `28202` `code` `TBDAPI` `ELK` `proxy` `Postman` `config` `Google` `ping` `TLS` `fix` `HttpClientHandler` `HttpWebRequest`

#### 互動方式
1. 輸入關鍵字 → 搜索線索
2. 閱讀線索卡片內容
3. 點擊 **「📌 收集此線索」** 加入證據板
4. 點擊 `@CLUE-XX` 引用可跳轉到相關線索
5. 收集足夠線索（≥12/15）後出現「破案」按鈕

### 場景 4：破案慶祝
- 展示真相總結和調查時間線
- 🎉 Confetti 慶祝動畫

## 替換截圖

`img/` 資料夾放置截圖，線索中使用佔位符標示需要替換的位置。
將實際截圖放入 `img/` 後，在 `js/clues.js` 中修改對應的 `<div class="clue-image-placeholder">` 為 `<img>` 標籤。

## 技術棧

純 HTML + CSS + JavaScript，零依賴。

## 檔案結構

```
├── index.html              # 主頁面（4 個場景）
├── css/style.css           # 偵探風格主題
├── js/
│   ├── clues.js            # 線索資料 & 搜索引擎
│   ├── effects.js          # 動畫特效
│   ├── evidence-board.js   # 證據板模組
│   └── app.js              # 主程式邏輯
└── img/                    # 截圖（佔位符）
```
