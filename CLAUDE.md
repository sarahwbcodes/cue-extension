# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Cue** — a Chrome extension (Manifest V3, side panel) that acts as an ambient research companion. The user initializes a session with a goal/context, then Cue passively reads pages as they browse, extracts relevant ideas via Claude, and synthesizes them into a brainstorm on demand.

Core loop: **Context init → passive extraction on every page → idea garden → on-demand synthesis**

## Stack

- **Plasmo** framework (handles manifest generation, content scripts, hot reload)
- React + TypeScript for the side panel UI
- Claude API — `claude-haiku-4-5` for fast per-page extraction, `claude-sonnet-4-6` for brainstorm synthesis
- `chrome.storage.local` for all persistence (no backend)

## Commands

```bash
npm install        # install deps
npm run dev        # dev mode with hot reload (loads into Chrome as unpacked)
npm run build      # production build → build/chrome-mv3-prod/
npm run package    # zip for Chrome Web Store submission
```

To load in Chrome: go to `chrome://extensions` → Enable Developer mode → Load unpacked → select `build/chrome-mv3-dev/`

## Architecture

```
sidepanel.tsx           # Main UI — 3 views: setup, garden, brainstorm
background/index.ts     # Service worker — receives PAGE_CONTENT messages, calls Claude, manages storage
contents/reader.ts      # Content script — fires on every page, extracts text, sends to background
lib/claude.ts           # Claude API calls — extractIdeas() and brainstorm()
lib/storage.ts          # chrome.storage.local helpers — Session type, CRUD ops
```

**Message flow:**
1. `contents/reader.ts` sends `{ type: "PAGE_CONTENT", url, title, text }` to background
2. `background/index.ts` checks session exists, deduplicates by URL, calls `extractIdeas()`, stores results
3. Side panel polls `chrome.storage.local` every 5s and re-renders
4. "Brainstorm" button sends `{ type: "BRAINSTORM" }` to background → calls `brainstorm()` → stores result

## Key data shape

```typescript
Session {
  context: string          // user's initialized goal
  ideas: IdeaEntry[]       // accumulated across all pages
  lastBrainstorm: string | null
  processedUrls: string[]  // dedup guard
}
```

## Claude prompts

- **Extract** (`lib/claude.ts:EXTRACT_SYSTEM`): Structured JSON extraction — returns `[{ content: string }]` or `[]`
- **Brainstorm** (`lib/claude.ts:BRAINSTORM_SYSTEM`): Synthesis of all signals into structured output

The extraction prompt explicitly asks for an empty array on irrelevant pages to keep the idea garden clean.

## API key handling

Stored in `chrome.storage.local` under key `cue_api_key`. Never hardcoded. The user enters it once in the setup view.
