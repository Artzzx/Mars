# Agent Task: Build `extract-planner-exports.ts` — Last Epoch Filter Engine Pipeline (Script 2 of 3 — Replacement)

## Context & Scope

You are building **Script 2 of a 3-script data pipeline** for a Last Epoch loot filter generation engine. This script replaces the previous Maxroll build guide scraper (which attempted prose/DOM extraction) with a superior approach: **automating the Maxroll Planner's native Export function** to capture structured equipment JSON per build phase.

Script 1 (`analyze-filters.ts`) already exists and produces `data/pipeline/raw-frequency.json`. This script produces `data/pipeline/planner-exports.json`. Script 3 merges both. **Do not build Script 1 or Script 3. Do not modify any existing project files.**

---

## Why This Approach Is Superior to DOM Scraping

The previous Script 2 attempted to parse affix priorities from prose text in build guide pages. This approach was fragile, missed affix tiers entirely, and suffered from bot-protection timeouts on the build guide URLs.

This replacement takes a fundamentally different path:

- **The Maxroll Planner's Export button produces structured JSON natively** — no DOM parsing, no fuzzy name matching, no prose inference
- **Affix IDs are exact integers** — zero reconciliation required against `affixes.json`
- **Affix tiers are included directly** (`"tier": 7`) — this is the most critical data point for filter rule generation, as higher tier affixes must be shown earlier and more prominently
- **Equipment phase stratification is built-in** — Starter / Endgame / Aspirational / BiS phases tell the engine exactly when each item matters
- **Planner pages are distinct URLs** from build guide pages and do not trigger the same bot protection

---

## What the Planner Export JSON Looks Like

When a user clicks Export → All Equipment on the Maxroll Planner, the following JSON is copied to clipboard:

```json
{
  "items": {
    "head": {
      "itemType": 0,
      "subType": 2,
      "uniqueID": 256,
      "uniqueRolls": [1, 1],
      "affixes": [
        { "id": 515, "tier": 7, "roll": 1 },
        { "id": 526, "tier": 5, "roll": 1 },
        { "id": 52,  "tier": 5, "roll": 1 }
      ],
      "implicits": [1]
    },
    "neck": { ... },
    "finger1": { ... },
    "finger2": { ... },
    "offhand": { ... },
    "hands": { ... },
    "feet": { ... },
    "waist": { ... },
    "relic": { ... },
    "body": { ... },
    "weapon": { ... }
  },
  "idols": [ ... ],
  "blessings": [ ... ],
  "weaverItems": []
}
```

**Key fields:**
- `items[slot].affixes[n].id` — exact integer affix ID matching `affixes.json`
- `items[slot].affixes[n].tier` — tier 1–7, where 7 is highest quality (critical for filter weighting)
- `items[slot].uniqueID` — exact unique item ID (0 if rare/magic item)
- `idols[]` — array of idol items with same affix structure

---

## What You Are Building

### File to Create
```
scripts/pipeline/extract-planner-exports.ts
```

Standalone Node.js/TypeScript script run locally via `tsx`. Not part of the Next.js app.

### Supporting Config File to Create
```
data/maxroll/planner-urls.json
```

A manually maintained file mapping build slugs to Maxroll Planner page URLs. The script reads this file as its input list. Build slugs must match Script 1's output keys in `raw-frequency.json`.

**Format:**
```json
{
  "shadow_cascade_bladedancer": "https://maxroll.gg/last-epoch/planner/xxxxx",
  "avalanche_shaman":           "https://maxroll.gg/last-epoch/planner/yyyyy",
  "forgedweapons_forgeguard":   "https://maxroll.gg/last-epoch/planner/zzzzz"
}
```

> Note: These are Planner URLs (`.../planner/...`), not build guide URLs (`.../build-guides/...`). These are different pages and must be sourced accordingly.

---

## Inputs

| Input | Location | Notes |
|-------|----------|-------|
| Planner URL config | `data/maxroll/planner-urls.json` | Manually populated before running |
| Affix mapping | `data/mappings/affixes.json` | Used only for validation/enrichment, not resolution |
| Unique item mapping | `data/mappings/equipment.json` | Used to enrich uniqueID with a human-readable name |

---

## Phase Detection and Iteration

Each Maxroll Planner page has an **Equipment phase dropdown** with up to 4 options:
- **Starter**
- **Endgame**
- **Aspirational**
- **BiS** (Best in Slot — not always present)

The script must:
1. On page load, detect which phases are available in the dropdown
2. Iterate through each available phase in order
3. For each phase: trigger the export and capture the JSON
4. Never assume all 4 phases exist — detect dynamically

The dropdown appears as a `<select>` or custom React component in the Equipment panel. See **Inspect Mode** below for how to confirm the exact selector before implementation.

---

## Export Trigger Sequence Per Phase

For each phase, the automation must:

1. Select the phase from the Equipment dropdown (if not already selected)
2. Wait for the UI to update (React state change — wait for DOM stability, not just a fixed timeout)
3. Click the **Export/Import** button
4. Wait for the modal to appear
5. Click **All Equipment** tab inside the modal
6. Intercept the clipboard write (see below) to capture the JSON
7. Close the modal
8. Repeat for next phase

---

## Clipboard Capture Strategy — Critical Implementation Detail

**Do not rely on OS-level clipboard read permissions.** These require explicit browser permission grants that are unreliable across environments and operating systems.

**Instead, intercept `navigator.clipboard.writeText` at the JavaScript level:**

```typescript
// Inject before page navigation
await page.addInitScript(() => {
  const originalWriteText = navigator.clipboard.writeText.bind(navigator.clipboard);
  (window as any).__capturedClipboard = null;
  navigator.clipboard.writeText = async (text: string) => {
    (window as any).__capturedClipboard = text;
    return originalWriteText(text);
  };
});
```

After clicking **All Equipment**, read the captured value:

```typescript
async function getClipboardCapture(page: Page): Promise<string | null> {
  // Reset before each capture
  await page.evaluate(() => { (window as any).__capturedClipboard = null; });

  // Click All Equipment button (triggers clipboard write)
  await page.click('[data-testid="all-equipment-button"]'); // confirm selector via --inspect

  // Wait for the write to happen
  await page.waitForFunction(() => (window as any).__capturedClipboard !== null, { timeout: 5000 });

  return await page.evaluate(() => (window as any).__capturedClipboard);
}
```

> ⚠️ `addInitScript` must be called **before** `page.goto()` — it runs on every page load. If you navigate before injecting, the intercept will not be active.

---

## UI Structure Reference — What the Page Actually Looks Like

This section documents the confirmed visual structure of the Maxroll Planner page based on direct observation. Use this to guide selector strategy. All selectors must still be verified against live HTML via `--inspect` before finalizing, but the element hierarchy and labels below are confirmed accurate.

---

### Page Layout Overview

The Maxroll Planner page has two main regions:

**Left panel — Equipment**
- Header: "EQUIPMENT" in all-caps
- Phase dropdown (custom styled, not native `<select>`) — appears directly below the "EQUIPMENT" header
- Subclass dropdown (e.g. "Bladedancer") — appears below the phase dropdown
- Level field ("Level 100") — appears alongside the subclass dropdown
- Equipment item slots — visual grid of item icons below the dropdowns (head, body, weapon, etc.)

**Right panel — Passives / Skills tabs**
- Not relevant to this script — ignore entirely

**Top-right corner of the planner (above the right panel)**
- Three icon buttons (cloud save, settings gear, copy page icon)
- **"Export/Import"** — text button, visible label, positioned left of "Loot Filter"
- **"Loot Filter"** — text button, to the right of Export/Import

---

### Element 1 — Phase Dropdown

**Location:** Left panel, immediately below the "EQUIPMENT" section header

**Visual appearance:** A styled dropdown button showing the current phase name (e.g. "Endgame") with a small arrow indicator. This is a **custom React dropdown component**, not a native HTML `<select>`. Clicking it opens a dropdown list showing all available phases.

**Confirmed phase option labels (exact text):**
- `Starter`
- `Endgame`
- `Aspirational`
- (Possibly `BiS` — detect dynamically)

**Selector strategy (try in this order):**
```typescript
// Strategy 1: Find by visible text of the current selected value
// The dropdown trigger is likely a <button> or <div> with role="button"
// containing the phase name as text

// Strategy 2: Look for a container with "EQUIPMENT" heading, then find
// the first interactive dropdown element within it
const equipmentPanel = page.locator('text=EQUIPMENT').locator('..');
const phaseDropdown = equipmentPanel.locator('[role="combobox"], [role="button"]').first();

// Strategy 3: aria-label or data attribute — check inspect output
```

**How to read available phases:**
```typescript
// 1. Click the dropdown trigger to open it
await phaseDropdown.click();

// 2. Wait for the options list to appear
// Options will be list items — look for <ul>, <li>, or [role="option"] elements
const options = await page.locator('[role="option"], [role="listbox"] li').allTextContents();
// Filter to known phase names
const knownPhases = ['Starter', 'Endgame', 'Aspirational', 'BiS'];
const availablePhases = options.filter(o => knownPhases.includes(o.trim()));

// 3. Close dropdown without selecting (press Escape) if just reading
await page.keyboard.press('Escape');
```

**How to select a phase:**
```typescript
// 1. Click dropdown to open
await phaseDropdown.click();
// 2. Click the option by its exact text
await page.locator(`text="${phaseName}"`).click();
// 3. Wait for equipment grid to re-render before proceeding
// (React state update — do NOT proceed immediately)
await page.waitForTimeout(800); // baseline; tune after testing
// Better: wait for a stable DOM signal, e.g. item images to reload
```

---

### Element 2 — Export/Import Button

**Location:** Top-right corner of the planner, left of the "Loot Filter" button

**Visual appearance:** Plain text button with label **"Export/Import"** — no icon, just text. Dark background styling consistent with the planner header.

**Selector strategy (try in this order):**
```typescript
// Strategy 1: By exact visible text (most reliable)
const exportButton = page.locator('button:has-text("Export/Import"), [role="button"]:has-text("Export/Import")');

// Strategy 2: By text content alone
const exportButton = page.getByText('Export/Import', { exact: true });

// Strategy 3: If neither works, locate relative to "Loot Filter" button
const lootFilterButton = page.getByText('Loot Filter', { exact: true });
// Export/Import is immediately to the left of Loot Filter
```

**Action:**
```typescript
await exportButton.click();
// Wait for the modal to appear
await page.waitForSelector('[role="dialog"], .modal, [class*="modal"]', { timeout: 5000 });
```

---

### Element 3 — Import/Export Modal

**Visual appearance:** A centered overlay modal with:
- Title: **"Import/Export Profile Data"** (large, white text)
- Subtitle: "You can export and import individual parts of profile to more easily synchronize different sets."
- An **X close button** in the top-right corner of the modal
- Two rows of tab buttons
- An empty text area / display area below the tabs
- An **"Import"** button at the bottom

**Tab rows confirmed (exact labels):**

Row 1 (data categories):
| Tab Label | Icon | Purpose |
|-----------|------|---------|
| **All Equipment** | upload icon | Exports ALL equipment + idols + blessings as one JSON — **this is the tab to click** |
| Equipment | upload icon | Exports items only |
| Idols | upload icon | Exports idols only |
| Blessings | upload icon | Exports blessings only |
| Weaver Tree | upload icon | Exports weaver tree |

Row 2:
| Tab Label | Purpose |
|-----------|---------|
| Passives | Exports passive tree |

Row 3 (skill-specific tabs, variable per build):
- Shows individual skill names (e.g. "Synchronized Strike", "Shadow Cascade", "Shift", etc.)
- These vary per build — do not hardcode

> ⚠️ **Clicking "All Equipment" is what triggers the clipboard write.** The tab click itself copies the JSON — there is no separate "Copy" or "Export" button to click afterward. The moment "All Equipment" is clicked, `navigator.clipboard.writeText` is called with the full export JSON.

**Selector strategy for modal detection:**
```typescript
// Wait for modal to be visible
await page.waitForSelector('text=Import/Export Profile Data', { timeout: 5000 });
```

**Selector strategy for "All Equipment" tab:**
```typescript
// Strategy 1: By exact text within the modal
const allEquipmentTab = page.locator('text=All Equipment').first();

// Strategy 2: By role within dialog
const modal = page.locator('[role="dialog"]');
const allEquipmentTab = modal.locator('button:has-text("All Equipment")');
```

**How to close the modal after capture:**
```typescript
// Strategy 1: Click the X button
await page.locator('[aria-label="Close"], button:has-text("×"), button:has-text("✕")').click();

// Strategy 2: Press Escape
await page.keyboard.press('Escape');

// Wait for modal to be gone
await page.waitForSelector('text=Import/Export Profile Data', { state: 'hidden', timeout: 3000 });
```

---

### Full Per-Phase Sequence with DOM Stability Checks

```typescript
async function capturePhase(page: Page, phaseName: string): Promise<string> {
  // Step 1: Open phase dropdown and select phase
  const phaseDropdown = page.locator(/* confirmed selector */);
  await phaseDropdown.click();
  await page.locator(`text="${phaseName}"`).click();

  // Step 2: Wait for equipment grid to stabilize after React re-render
  // Do NOT trust a fixed timeout alone — also wait for network idle
  await page.waitForLoadState('networkidle', { timeout: 10000 });
  await page.waitForTimeout(500); // short additional buffer for React commit

  // Step 3: Reset clipboard capture buffer
  await page.evaluate(() => { (window as any).__capturedClipboard = null; });

  // Step 4: Open Export/Import modal
  await page.locator('text=Export/Import').click();
  await page.waitForSelector('text=Import/Export Profile Data', { timeout: 5000 });

  // Step 5: Click "All Equipment" — this triggers the clipboard write
  await page.locator('text=All Equipment').first().click();

  // Step 6: Wait for clipboard to be populated
  await page.waitForFunction(
    () => (window as any).__capturedClipboard !== null,
    { timeout: 5000 }
  );

  // Step 7: Read the captured JSON
  const json = await page.evaluate(() => (window as any).__capturedClipboard as string);

  // Step 8: Close the modal
  await page.keyboard.press('Escape');
  await page.waitForSelector('text=Import/Export Profile Data', { state: 'hidden', timeout: 3000 });

  return json;
}
```

---

### What to Do If a Selector Fails

If any selector in this section does not match the live DOM, do not guess. Instead:

1. Log the failure with the attempted selector
2. Take a screenshot: `await page.screenshot({ path: 'data/maxroll/inspect/error-<slug>.png' })`
3. Record it in `planner-warnings.json` under `buildsFailed` with `reason: "Selector not found: <selector>"`
4. Skip that build and continue

---

## Inspect Mode

**Before writing any selector-dependent logic, run inspect mode and examine the live DOM.**

Add a `--inspect <build-slug>` CLI flag that:
1. Loads `planner-urls.json` and resolves the URL for that slug
2. Injects the clipboard intercept script
3. Navigates to the planner URL and waits for full render
4. Saves full rendered HTML to `data/maxroll/inspect/<build-slug>.html`
5. Also saves a screenshot to `data/maxroll/inspect/<build-slug>.png`
6. Exits without performing any export

This must be the first thing run before implementing selectors. Document confirmed selectors as comments in the script.

```bash
npx tsx scripts/pipeline/extract-planner-exports.ts --inspect shadow_cascade_bladedancer
```

---

## Output

### File: `data/pipeline/planner-exports.json`

```json
{
  "_meta": {
    "generatedAt": "2025-09-15T14:32:00Z",
    "buildsProcessed": ["shadow_cascade_bladedancer", "avalanche_shaman"],
    "buildsFailed": [],
    "totalPhasesCaptured": 7
  },
  "builds": {
    "shadow_cascade_bladedancer": {
      "sourceUrl": "https://maxroll.gg/last-epoch/planner/xxxxx",
      "scrapedAt": "2025-09-15T14:32:00Z",
      "phasesAvailable": ["Starter", "Endgame", "Aspirational", "BiS"],
      "phases": {
        "Starter": {
          "items": {
            "head": {
              "slot": "head",
              "uniqueID": 256,
              "uniqueName": "Valent's Noctua",
              "affixes": [
                { "id": 515, "tier": 7, "roll": 1 },
                { "id": 526, "tier": 5, "roll": 1 }
              ],
              "implicits": [1]
            },
            "body": { ... }
          },
          "idols": [
            null,
            {
              "slot": 1,
              "itemType": 27,
              "subType": 1,
              "affixes": [
                { "id": 866, "tier": 1, "roll": 1 },
                { "id": 872, "tier": 1, "roll": 1 }
              ]
            }
          ],
          "rawExport": "{...}" 
        },
        "Endgame": { ... },
        "Aspirational": { ... },
        "BiS": { ... }
      }
    }
  }
}
```

**Notes on output structure:**
- `uniqueName` is resolved from `equipment.json` using `uniqueID` — add `null` if not found, never crash
- `rawExport` stores the original clipboard JSON string as a safety net for reprocessing
- Idol array preserves `null` entries (null = empty idol slot in the planner grid)
- Blessings and weaverItems from the raw export are stored in `rawExport` only — not parsed at this stage

### File: `data/pipeline/planner-warnings.json`

```json
{
  "buildsFailed": [
    {
      "buildSlug": "forgedweapons_forgeguard",
      "url": "https://maxroll.gg/last-epoch/planner/zzzzz",
      "phase": "Endgame",
      "reason": "Clipboard capture timed out after 5000ms"
    }
  ],
  "unknownUniqueIDs": [
    {
      "uniqueID": 999,
      "buildSlug": "avalanche_shaman",
      "phase": "BiS",
      "slot": "head"
    }
  ],
  "phasesNotFound": [
    {
      "buildSlug": "some_build",
      "expectedPhases": ["Starter", "Endgame", "Aspirational"],
      "foundPhases": ["Starter", "Endgame"]
    }
  ]
}
```

---

## Technical Requirements

- **Language:** TypeScript
- **Runtime:** Node.js via `tsx`
- **Browser automation:** Playwright — Chromium
- **File I/O:** `fs/promises`
- **No framework dependencies** — no Next.js, React, Prisma, Supabase, database connections
- Add npm scripts:
  ```
  "extract-planner": "tsx scripts/pipeline/extract-planner-exports.ts"
  "extract-planner:inspect": "tsx scripts/pipeline/extract-planner-exports.ts --inspect"
  ```

### Playwright Browser Setup

```typescript
const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const context = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  viewport: { width: 1280, height: 900 },
});

const page = await context.newPage();

// MUST inject clipboard intercept before any navigation
await page.addInitScript(() => {
  (window as any).__capturedClipboard = null;
  const orig = navigator.clipboard.writeText.bind(navigator.clipboard);
  navigator.clipboard.writeText = async (text: string) => {
    (window as any).__capturedClipboard = text;
    return orig(text);
  };
});

await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
```

### Rate Limiting

- **5-second delay between builds** (full page navigations)
- **1-second delay between phase switches** within the same page
- Always sequential — never parallel

```typescript
const DELAY_BETWEEN_BUILDS_MS = 5000;
const DELAY_BETWEEN_PHASES_MS = 1000;
```

### Error Handling

Per-build and per-phase error isolation. A failed phase does not skip the remaining phases of the same build. A failed build does not stop the script.

```typescript
for (const [buildSlug, url] of Object.entries(plannerUrls)) {
  try {
    const result = await processBuild(page, buildSlug, url, uniqueMap);
    builds[buildSlug] = result;
  } catch (err) {
    console.error(`[FAIL] ${buildSlug}: ${err}`);
    warnings.buildsFailed.push({ buildSlug, url, phase: 'unknown', reason: String(err) });
  }
  await sleep(DELAY_BETWEEN_BUILDS_MS);
}
```

---

## CLI Interface

```bash
# Process all builds in planner-urls.json
npx tsx scripts/pipeline/extract-planner-exports.ts

# Inspect one planner page (saves HTML + screenshot, no export)
npx tsx scripts/pipeline/extract-planner-exports.ts --inspect shadow_cascade_bladedancer

# Process only one specific build
npx tsx scripts/pipeline/extract-planner-exports.ts --only shadow_cascade_bladedancer

# Verbose logging (print raw clipboard JSON per phase)
npx tsx scripts/pipeline/extract-planner-exports.ts --verbose
```

Parse args from `process.argv`. No external CLI library needed.

---

## Console Output Format

```
[1/52] shadow_cascade_bladedancer
  → Navigating to planner...
  → Phases found: Starter, Endgame, Aspirational, BiS
  → [Starter] Exported: 11 items, 14 idols
  → [Endgame] Exported: 11 items, 22 idols
  → [Aspirational] Exported: 11 items, 22 idols
  → [BiS] Exported: 11 items, 22 idols
  ✓ Done (4 phases)

[2/52] avalanche_shaman
  → ...

─────────────────────────────────
Summary: 51/52 builds succeeded | 7 phase failures | 204 total phases captured
Output: data/pipeline/planner-exports.json
Warnings: data/pipeline/planner-warnings.json
```

---

## What This Script Must NOT Do

- ❌ Do not use OS clipboard read permissions — use the `addInitScript` intercept only
- ❌ Do not modify `raw-frequency.json` or any Script 1 output
- ❌ Do not build Script 1 or Script 3
- ❌ Do not write or modify any `.ts` files in `src/`
- ❌ Do not connect to any database or external service
- ❌ Do not make parallel requests — always sequential with delay
- ❌ Do not crash on a single build or phase failure
- ❌ Do not hardcode selectors without first running `--inspect` and confirming them

---

## Implementation Order

Build in this order to avoid blocking on unknown selectors:

1. **File I/O and config loading** — load `planner-urls.json`, `affixes.json`, `equipment.json`
2. **Playwright setup** — browser init, clipboard intercept injection, `--inspect` mode
3. **Phase detection stub** — function that reads phase options from dropdown (implement selector after inspect)
4. **Phase iteration and clipboard capture** — the core loop (implement selectors after inspect)
5. **JSON parsing and enrichment** — parse raw clipboard JSON, enrich uniqueID → uniqueName
6. **Output writing** — write `planner-exports.json` and `planner-warnings.json`
7. **CLI flags** — `--only`, `--verbose`

Steps 1–2 and 5–7 can be built immediately. Steps 3–4 require running `--inspect` first to confirm selectors.

---

## Deliverables

1. `scripts/pipeline/extract-planner-exports.ts` — the script
2. `data/maxroll/planner-urls.json` — config file structure (initially empty `{}`, to be populated manually)
3. `data/maxroll/inspect/` — directory exists for inspect output
4. Running `--inspect <slug>` saves `.html` and `.png` and exits cleanly
5. Running without flags produces:
   - `data/pipeline/planner-exports.json`
   - `data/pipeline/planner-warnings.json`
6. Console output matches the format above

---

## Known Constraints and Assumptions

| Item | Status | Notes |
|------|--------|-------|
| Planner URLs are distinct from build guide URLs | ✅ Confirmed | Format: `/last-epoch/planner/HASH` |
| Export produces clipboard JSON natively | ✅ Confirmed | See example in spec |
| Affix IDs in export match `affixes.json` exactly | ✅ Confirmed | No fuzzy matching needed |
| Tier data is included in export | ✅ Confirmed | `"tier": 7` directly in affix objects |
| Phases available: Starter, Endgame, Aspirational, BiS | ✅ Confirmed visually | Detect dynamically — not all phases guaranteed on every build |
| Phase dropdown is a custom React component | ✅ Confirmed | Not a native `<select>` — use click + option list strategy |
| Phase dropdown location | ✅ Confirmed | Left panel, directly below "EQUIPMENT" section header |
| Phase option labels | ✅ Confirmed | Exact strings: "Starter", "Endgame", "Aspirational" (+ possibly "BiS") |
| Export/Import button label | ✅ Confirmed | Exact text: "Export/Import" — top-right of planner, left of "Loot Filter" |
| Modal title | ✅ Confirmed | "Import/Export Profile Data" — use as modal detection anchor |
| "All Equipment" tab triggers clipboard write | ✅ Confirmed | Clicking the tab itself copies JSON — no separate copy button |
| Modal tab labels | ✅ Confirmed | Row 1: "All Equipment", "Equipment", "Idols", "Blessings", "Weaver Tree"; Row 2: "Passives"; Row 3: skill tabs (variable) |
| Exact CSS selectors / data-testid attributes | ❓ Unknown | Confirm via `--inspect` — use text/role selectors as primary strategy |
| Bot protection on planner pages | ❓ Unknown | Verify during inspect — suspected lower than guide pages |
