# Next Steps — 下一步待辦

## 🔴 必須做（上台前）

### 1. 替換截圖
在 `js/clues.js` 中，將佔位符替換為實際截圖：
```html
<!-- 目前 -->
<div class="clue-image-placeholder" data-desc="Teams 頻道截圖">
  🖼️ Teams 頻道截圖<br><small>請替換為實際截圖</small>
</div>

<!-- 替換為 -->
<img src="img/teams-channel.png" alt="Teams 頻道截圖" style="max-width:100%; border-radius:8px;">
```

需要的截圖清單：
- [ ] Teams 頻道通知截圖（最後成功 & 之後的靜默）
- [ ] ELK 錯誤日誌截圖
- [ ] Postman 測試結果（封測 OK / 正式 FAIL）
- [ ] TBDAPI 代碼截圖（HttpClientHandler 相關）
- [ ] 命令列測試截圖（TLS/跳過憑證）
- [ ] 修復後的代碼截圖（HttpWebRequest）

### 2. 線索文字微調
- 檢查每條線索的內容是否準確反映你的實際情況
- 調整時間、服務名、IP 等細節
- 可在 `js/clues.js` 中直接編輯 `content` 欄位

### 3. 整體瀏覽器測試
- 用投影的電腦/瀏覽器完整跑一遍四個場景
- 確認搜索關鍵字都能正確觸發
- 確認所有動畫流暢

---

## 🟡 建議做（提升體驗）

### 4. 調整搜索引導
- 考慮在分享時的引導節奏，先提問「你們會先查什麼？」
- 可能需要調整 keyword hints 的順序/呈現

### 5. 投影適配
- 確認投影解析度下的字體大小
- 可能需要微調 `css/style.css` 中的 `font-size`

### 6. 增加更多視覺元素
- 可以加入 GIF 動圖（放 `img/` 下）
- 可以加入系統架構圖

---

## 🟢 可選做（進階功能）

### 7. 計時器
- 加入分享計時器，控制節奏

### 8. 線索排序/篩選
- 在證據板中加入按類型篩選的功能

### 9. 主持人模式
- 加入快捷鍵一鍵觸發所有線索（不用一個個搜索）

### 10. 深究根本原因
- 你提到後續會探究 HttpClientHandler 的具體原因
- 可以加入 CLUE-16 等額外線索作為「後日談」

---

## 💡 恢復 Copilot 上下文

在公司機器上開啟此專案後，跟 Copilot 說：

```
請閱讀 .copilot-context/ 資料夾下的所有檔案來恢復我們之前的工作上下文，
然後我們繼續調整這個 "Who Killed the Webhook" 互動式分享網頁。
```

Copilot 會讀取 plan、session-log、todo-status 和 next-steps，
恢復對專案架構、設計決策和進度的完整理解。
