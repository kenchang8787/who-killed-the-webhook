# Session Log — 討論記錄

## 基本資訊
- **專案**: Who Killed the Webhook — 互動式偵探分享網頁
- **用途**: 後端工程師主管的 20-30 分鐘 Tech Sharing
- **建立時間**: 2026-03-30

---

## 需求確認（Q&A）

### Q1: 技術棧？
**A: 純 HTML + CSS + JavaScript（零依賴，最簡單）**

### Q2: 搜索關鍵字互動機制？
**A: 預先設定好關鍵字 → 對應線索，主持時引導觸發**
- 不是自由搜索，而是預設好的關鍵字 mapping
- 主持人引導 Member 討論方向，然後觸發對應內容

### Q3: 內容語言？
**A: 中英混合（技術術語用英文，說明用中文）**

### Q4: 視覺風格？
**A: 現代簡潔風 + 偵探元素**
- 不是全暗黑 noir 風格
- 暗色主題但保持專業簡潔感
- 加入偵探主題裝飾元素

---

## 故事原文（偵查過程完整紀錄）

以下是用戶提供的完整偵查過程，為線索設計的來源：

1. 收到回報：Teams 完款通知壞掉了
2. 在 Teams 頻道確認 issue 屬實，記住最後通知時間，同時發現封測環境通知正常
3. 完款通知發生在完款處 (28202)，先查 28202 是否更版 → 沒有
4. 確認 28202 完款時透過 `TBDAPI/Teams/SendWebhook` 接口發送通知
5. 查看 TBDAPI 是否更版 → 沒有
6. 查 ELK 確認 28202→TBDAPI 連線正常但有錯誤訊息（不明顯）
7. 開 TBDAPI 專案看 `/Teams/SendWebhook` 代碼，發現 TBDAPI 是純內網服務，透過 `message-proxy.tutorabc.com` 代理打到外網
8. ELK 確認 TBDAPI 的錯誤就發生在透過 Proxy 打外網的地方
9. Postman 驗證：封測 ✅ 正式 ❌
10. 檢查封測/正式的 proxy 網址設定 → 完全相同
11. 此時排除 28202 問題，鎖定 TBDAPI → Proxy 這段，錯誤：`An error occurred while sending the request`
12. Google 錯誤訊息，可能方向：1.ACL 改變 2.DNS 問題 3.TLS/SSL 握手失敗
13. 補充：封測=19.204, 正式=19.25/19.26（相同網段），網管最近由菜鳥接手
14. 在正式/封測機 ping `message-proxy.tutorabc.com` → 都正確解析 19.133（確認過 hosts），Test-NetConnection OK
15. 詢問網管 ACL 有沒有改動 → 沒有，19 網段沒有阻擋
16. 轉向 TLS/SSL 方向（儘管程式 3 年沒動）
17. 在封測/正式機用 cmd 復刻 Proxy HTTP request → 結果跟 Postman 相同
18. 指定 TLS 1.2 → 失敗，但錯誤訊息不同（安全性錯誤）
19. 跳過憑證檢查 → 成功！ → 確定是 TLS/SSL 問題
20. 回頭調整 TBDAPI 上線 → 封測 ✅ 正式還是 ❌（相同錯誤）
21. 三台正式機都是 Windows Server 2012 R2
22. 封測/正式的 config（runtime version 等）都相同
23. 發現 `HttpClientHandler` 重大問題：不會正確將指定 TLS 和跳過憑證檢查設定到 HTTP request
24. 改用 `HttpWebRequest` → 正式 ✅ 線上問題解除！
25. 後續會根據資訊探究具體原因

---

## 架構決策

### 檔案結構
```
index.html              # 單頁面，4 個場景
css/style.css           # 完整 CSS 主題
js/clues.js             # 線索資料 + 搜索引擎
js/effects.js           # 動畫特效工具集
js/evidence-board.js    # 證據板模組
js/app.js               # 主程式邏輯
img/                    # 截圖（目前是佔位符）
```

### 模組設計
- `window.ClueEngine` — 線索資料 & 搜索（clues.js）
- `window.Effects` — 10 種動畫特效（effects.js）
- `window.EvidenceBoard` — 證據板收集管理（evidence-board.js）
- `window.App` — 場景管理 & 事件綁定（app.js）

### 線索系統
- 15 條線索，7 種類型
- 每條線索有：ID、關鍵字陣列、標題、類型、HTML 內容、insight、引用
- 搜索引擎支援模糊子字串匹配（case-insensitive）
- `@CLUE-XX` 引用機制可點擊跳轉

---

## 已完成的工作

### 第一輪：平行建立所有檔案（6 個 Agent）
1. ✅ clues.js — 15 條完整線索資料 + 搜索引擎
2. ✅ style.css — ~850 行 CSS 主題
3. ✅ effects.js — 10 種動畫方法
4. ✅ evidence-board.js — 證據板完整模組
5. ✅ index.html — 4 場景 HTML 結構
6. ✅ app.js — 主程式邏輯

### 第二輪：整合檢查 & 修復
- 進行了 CSS-JS class name 整合檢查，發現多處 mismatch
- 修復了 CSS 缺少的 class（terminal 歷史、hint chips、timeline、clue types 等）
- 修復了 evidence-board.js 的 progress bar selector 問題（#evidence-progress-bar → #evidence-progress）
- 所有 JS 語法驗證通過（node --check）

---

## 已知需要注意的事項

1. **截圖替換**：`js/clues.js` 中所有 `<div class="clue-image-placeholder">` 需替換為實際截圖 `<img>`
2. **線索內容微調**：線索文字內容可能需要根據實際情況調整用詞
3. **瀏覽器測試**：建議在 Chrome/Edge 測試，其他瀏覽器可能有小差異
4. **RWD**：有做響應式但主要為桌面展示設計（投影分享用途）
