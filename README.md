<p align="center">
  <img src="icons/logo.svg" alt="Logo" width="200">
</p>

<h1 align="center">Clean TweetX</h1>

<p align="center">
   <strong>A minimal Chrome extension that cleans up the X (Twitter) interface by hiding distracting and promotional UI elements.</strong><br>
   <em>No configuration, no popup — it just works.</em>
</p>
 

## What it hides

- **Right sidebar** (trending topics, who to follow, promotions)
- **Promoted/ad tweets** as you scroll the timeline
- **Grok AI** features (nav link, drawer, image gen button, action buttons)
- **Premium upsells** (signup links, tabs, subscription modals)
- **Creator Studio** nav link
- **Verified Organizations** nav link

## How it works

Static elements are hidden with CSS injected at `document_start` to prevent any flash of unwanted content. Each rule is gated by a per-feature class so toggling a feature off in the popup re-shows only that category. Promoted tweets and premium modals, which load dynamically as you scroll, are detected and hidden by a lightweight `MutationObserver` that checks for normalized promoted labels across multiple languages, stable premium-related selectors, and SVG icon fingerprints.

A toolbar popup (React + [Base UI](https://base-ui.com)) exposes a master on/off switch plus an independent switch for each hidden category. Settings persist in `chrome.storage.local` and apply live — no page reload needed.

## Tech stack

Built with [WXT](https://wxt.dev) + Bun + React + Base UI. Chrome MV3.

## Install (from source)

1. Clone the repository and run `bun install`
2. Build with `bun run build` — output lands in `.output/chrome-mv3`
3. Open `chrome://extensions` in Chrome
4. Enable **Developer Mode** (toggle in the top right)
5. Click **Load unpacked** and select the `.output/chrome-mv3` folder
6. Navigate to [x.com](https://x.com) — the extension is active immediately

## Supported languages for ad detection

English, French, Spanish, German, Italian, and Portuguese.

## Development

- `bun run dev` — launch WXT in dev mode with HMR (auto-loads a dev build)
- `bun run build` — production build into `.output/chrome-mv3`
- `bun run zip` — package a distributable zip
- `bun run compile` — type-check with `tsc --noEmit`
- `bun test` — run the detection unit tests

Project layout:

- `entrypoints/content/` — content script + gated static CSS
- `entrypoints/popup/` — React + Base UI settings popup
- `entrypoints/background.ts` — service worker (badge sync)
- `utils/detection.ts` — pure, unit-tested promoted/premium detection logic
- `utils/settings.ts` — shared storage-backed settings model
