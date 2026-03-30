# Todo Status — 任務追蹤

> 所有任務已完成 ✅

| ID | 任務 | 狀態 |
|----|------|------|
| project-setup | 建立專案結構 & 基礎 HTML | ✅ done |
| css-theme | 偵探風格 CSS 主題系統 | ✅ done |
| scene-landing | Scene 1: Landing 開場頁 | ✅ done |
| scene-briefing | Scene 2: 案件概述頁 | ✅ done |
| clue-system | 線索資料 & 搜索引擎 | ✅ done |
| scene-investigation | Scene 3: 調查室 | ✅ done |
| clue-cards | Clue Card 渲染 & @引用 | ✅ done |
| scene-solved | Scene 4: 破案慶祝頁 | ✅ done |
| effects | 動畫特效 | ✅ done |
| polish | 整體優化 | ✅ done |

## 依賴關係（已全部完成）
```
project-setup
  ├── css-theme
  │     ├── scene-landing
  │     ├── scene-briefing
  │     ├── scene-investigation (also depends on clue-system)
  │     ├── clue-cards (also depends on clue-system)
  │     └── scene-solved
  └── clue-system
        ├── scene-investigation
        └── clue-cards

effects (depends on: scene-landing, scene-investigation, scene-solved)
polish (depends on: effects)
```
