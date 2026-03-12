# Test Coverage Analysis — Clean TweetX

_Generated: 2026-03-12_

## Current State

The test suite has **7 tests** in `test/content.test.js` (~150 lines) covering
a source of ~310 lines in `src/content.ts`. Tests use Node's built-in
`node:test` module with a custom `FakeElement` DOM mock.

## What's Covered

| Function              | Coverage                                                                       |
| --------------------- | ------------------------------------------------------------------------------ |
| `ScanCell`            | Tested: no-op on empty cell, promoted text detection, SVG fallback, text normalization (French) |
| `ShouldHidePremiumModal` | Tested: ignores generic dialogs, detects premium links, handles French localization |
| `CollectCandidates`   | Tested: finds closest + descendant matches                                     |

## Key Gaps (by priority)

### 1. `CreateProcessor` — No tests (HIGH)

Core orchestration layer (~70 lines). Manages dirty-element queuing,
deduplication via `pending` flag, full-scan mode, and `requestAnimationFrame`
scheduling. None of this is tested.

**Recommended tests:**

- `QueueElementWork` correctly buckets elements into `dirtyCells` vs `dirtyModals`
- `ProcessMutations` processes queued cells/modals and clears the sets
- `RequestFullScan` causes `ProcessMutations` to query the whole document instead
  of just dirty elements
- `ScheduleProcessing` deduplicates — calling it twice before the frame fires
  only processes once
- `HandleMutations` extracts targets and added nodes from `MutationRecord`-like
  objects

### 2. `HidePremiumModal` — No tests (HIGH)

Three distinct code paths, none tested:

- Already-hidden modal (`getAttribute(HIDDEN_ATTR) === "1"`) → returns `false`
- Modal that `ShouldHidePremiumModal` rejects → returns `false`
- Modal that gets hidden → calls `HideElement`, returns `true`

### 3. `NormalizeText` — No direct tests (MEDIUM)

Currently only exercised indirectly through `ScanCell`. Direct unit tests would
catch regressions faster:

- NFKD decomposition strips diacritics (`"Sponsorisé"` → `"sponsorise"`)
- Collapses multiple whitespace to single space
- Trims leading/trailing whitespace
- Handles `null`/`undefined` input (returns `""`)
- Lowercases mixed-case input

### 4. `ShouldHidePremiumModal` — Incomplete coverage (MEDIUM)

- Only **1 of 6** `PREMIUM_HINT_SELECTORS` is tested (`a[href*="/i/premium"]`).
  The others (`premium_sign_up`, `verified-orgs-signup`,
  `verified-organizations`, `premium-signup-tab`,
  `premium-business-signup-tab`) are untested.
- Only **1 of 27** `PREMIUM_TEXT_PATTERNS` is tested (French). No coverage for
  Spanish, German, Italian, Portuguese, or most English patterns.
- The `aside[aria-label="Subscribe to Premium"]` fast-path is never hit in tests.
- `null` input path has no explicit test.

### 5. `HideElement` — No tests (MEDIUM)

Three fallback branches:

1. Element has `.style` property → sets `style.display = "none"`
2. Element is `instanceof HTMLElement` → same
3. Neither → falls back to `setAttribute("style", ...)`

The `FakeElement` mock always has `.style`, so only branch 1 is ever exercised
(indirectly).

### 6. `CellContainsPromotedContent` — No direct tests (LOW)

Only exercised through `ScanCell`. Only 2 of 6 `PROMOTED_LABELS` are tested
(`"promoted"` and `"sponsorise"` via normalization). Missing: `"ad"`,
`"promocionado"`, `"gesponsert"`, `"sponsorizzato"`, `"promovido"`.

### 7. `Boot` — No tests (LOW)

Top-level initializer that creates a `MutationObserver` and triggers a full scan.
Lower priority since it's mostly glue code, but an integration test ensuring
`Boot` returns a working `{ observer, processor }` pair would be valuable.

## Structural Improvements

- **Mock limitations**: `FakeElement` doesn't support `matches()` for compound
  CSS selectors — it does exact string comparison. Consider using a lightweight
  DOM like `linkedom` or `happy-dom` for higher-fidelity tests.
- **No coverage tooling**: There's no coverage reporting configured. Adding `c8`
  or Bun's built-in coverage (`bun test --coverage`) would make gaps visible
  going forward.
- **No CI**: Tests only run locally. A GitHub Actions workflow would prevent
  regressions.

## Recommended Action Plan

1. Add direct `NormalizeText` tests (quick win, catches the most subtle bugs)
2. Add `HidePremiumModal` tests (3 branches, easy to write)
3. Add `CreateProcessor` tests with a mock `requestAnimationFrame` (biggest impact)
4. Expand `ShouldHidePremiumModal` to cover all hint selectors and a sample of
   each language's text patterns
5. Enable `bun test --coverage` in the test script for ongoing visibility
