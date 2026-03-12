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

Static elements are hidden with CSS injected at `document_start` to prevent any flash of unwanted content. Promoted tweets, which load dynamically as you scroll, are detected and hidden by a lightweight `MutationObserver` that checks for normalized promoted labels across multiple languages, stable premium-related selectors, and SVG icon fingerprints.

## Install

1. Clone or download this repository
2. Open `chrome://extensions` in Chrome
3. Enable **Developer Mode** (toggle in the top right)
4. Click **Load unpacked** and select the `clean-tweetx` folder
5. Navigate to [x.com](https://x.com) — the extension is active immediately

## Supported languages for ad detection

English, French, Spanish, German, Italian, and Portuguese.

## Development

- Build the extension script with `bun run build`
- Run tests with `bun test` or `bun run test`
- The TypeScript source lives in `src/content.ts` and compiles to `content.js` for the extension manifest
- The content script includes lightweight Bun-based tests for promoted tweet detection and premium modal filtering
