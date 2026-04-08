# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

An interactive detective-themed static webpage for a 20-30 minute Tech Sharing presentation. It tells the story of debugging a broken Teams payment notification webhook, presented as a mystery investigation. Written in Traditional Chinese (zh-TW).

**Tech stack:** Pure HTML + CSS + JavaScript, zero dependencies.

## Running Locally

```bash
# Option 1: Open index.html directly in a browser

# Option 2: Live server (recommended for development)
npx live-server .
```

There is no build step, linter, or test suite.

## Architecture

The app is a single-page application with 4 scenes (Landing → Briefing → Investigation → Solved), managed by scene transitions in `app.js`.

**Module loading order** (via `<script>` tags in `index.html`):
1. `js/clues.js` — Clue data (15 clues) and search engine, exposes `window.ClueEngine`
2. `js/effects.js` — Animation effects library (typewriter, confetti, glitch, etc.), exposes `window.Effects`
3. `js/evidence-board.js` — Evidence collection panel, exposes `window.EvidenceBoard`
4. `js/app.js` — Main orchestrator, exposes `window.App`. Depends on all three above.

All modules attach to `window.*` — there are no ES modules or bundlers.

## Key Patterns

- **Clue system:** 15 clues defined in `CLUES` array in `clues.js`, each with `id`, `keywords`, `title`, `type`, `content` (HTML), `insight`, `references`, and `order`. Search is keyword-based substring matching.
- **Scene transitions:** `App.switchScene()` handles fade-out/fade-in with CSS classes (`active`). Arrow keys navigate forward in Landing/Briefing.
- **Evidence threshold:** The "solve" button appears when ≥12 of 15 clues are collected (`evidence-board.js:_updateSolveButton`).
- **XSS prevention:** `escapeHtml()` in `app.js` is used for user-provided text. Clue `content` fields contain trusted HTML.
- **Image placeholders:** Clues use `<div class="clue-image-placeholder">` where real screenshots should go. Replace with `<img>` tags pointing to files in `img/`.

## Content Editing

- To modify clue text, keywords, or add clues: edit the `CLUES` array in `js/clues.js`
- To replace screenshot placeholders: swap `clue-image-placeholder` divs with `<img src="img/...">` in clue `content` fields
- Briefing scene content is in `index.html` directly (not JS-generated)
- Keyword hints shown in the investigation UI are defined in `KEYWORD_HINTS` in `app.js`

## Copilot Context

The `.copilot-context/` directory contains prior planning context (plan, session log, next steps, todo status) from the initial build with GitHub Copilot.
