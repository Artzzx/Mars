/**
 * extract-planner-exports.ts — Script 2 of 3: Last Epoch Filter Engine Pipeline
 *
 * Automates the Maxroll Planner's native Export function to capture structured
 * equipment JSON per build phase. For each build URL in data/maxroll/planner-urls.json,
 * iterates available phases (Starter / Endgame / Aspirational / BiS), triggers the
 * "All Equipment" export, intercepts the clipboard write, and stores the result.
 *
 * Outputs:
 *   data/pipeline/planner-exports.json  — structured phase data per build
 *   data/pipeline/planner-warnings.json — failures, unknown IDs, missing phases
 *
 * CLI:
 *   npx tsx scripts/pipeline/extract-planner-exports.ts
 *   npx tsx scripts/pipeline/extract-planner-exports.ts --inspect <slug>
 *   npx tsx scripts/pipeline/extract-planner-exports.ts --only <slug>
 *   npx tsx scripts/pipeline/extract-planner-exports.ts --verbose
 */

import { chromium, type Page } from 'playwright';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../');

const PLANNER_URLS_PATH = path.join(PROJECT_ROOT, 'data/maxroll/planner-urls.json');
const EQUIPMENT_PATH = path.join(PROJECT_ROOT, 'scripts/data/mappings/equipment.json');
const INSPECT_DIR = path.join(PROJECT_ROOT, 'data/maxroll/inspect');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'data/pipeline');
const EXPORTS_OUT = path.join(OUTPUT_DIR, 'planner-exports.json');
const WARNINGS_OUT = path.join(OUTPUT_DIR, 'planner-warnings.json');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const KNOWN_PHASES = ['Starter', 'Endgame', 'Aspirational', 'BiS'] as const;
type PhaseName = (typeof KNOWN_PHASES)[number];

const DELAY_BETWEEN_BUILDS_MS = 5000;
const DELAY_BETWEEN_PHASES_MS = 1000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PlannerUrls {
  [buildSlug: string]: string;
}

interface ExportAffix {
  id: number;
  tier: number;
  roll: number;
}

interface RawExportItem {
  itemType?: number;
  subType?: number;
  uniqueID?: number;
  uniqueRolls?: number[];
  affixes?: ExportAffix[];
  implicits?: number[];
}

interface RawExportIdol {
  slot?: number;
  itemType?: number;
  subType?: number;
  affixes?: ExportAffix[];
  implicits?: number[];
}

interface RawExportJson {
  items?: Record<string, RawExportItem>;
  idols?: (RawExportIdol | null)[];
  blessings?: unknown[];
  weaverItems?: unknown[];
}

interface ProcessedItem {
  slot: string;
  uniqueID: number;
  uniqueName: string | null;
  affixes: ExportAffix[];
  implicits: number[];
}

interface ProcessedIdol {
  slot: number;
  itemType: number;
  subType: number;
  affixes: ExportAffix[];
}

interface PhaseData {
  items: Record<string, ProcessedItem>;
  idols: (ProcessedIdol | null)[];
  rawExport: string;
}

interface BuildResult {
  sourceUrl: string;
  scrapedAt: string;
  phasesAvailable: string[];
  phases: Record<string, PhaseData>;
}

interface BuildFailed {
  buildSlug: string;
  url: string;
  phase: string;
  reason: string;
}

interface UnknownUniqueID {
  uniqueID: number;
  buildSlug: string;
  phase: string;
  slot: string;
}

interface PhaseNotFound {
  buildSlug: string;
  expectedPhases: string[];
  foundPhases: string[];
}

interface Warnings {
  buildsFailed: BuildFailed[];
  unknownUniqueIDs: UnknownUniqueID[];
  phasesNotFound: PhaseNotFound[];
}

// ---------------------------------------------------------------------------
// equipment.json types
// ---------------------------------------------------------------------------

interface UniqueEntry {
  uniqueId: number;
  displayName: string;
}

interface SubItemEntry {
  uniques?: Record<string, UniqueEntry>;
}

interface BaseTypeEntry {
  subItems?: Record<string, SubItemEntry>;
}

interface EquipmentJson {
  baseTypes?: Record<string, BaseTypeEntry>;
}

// ---------------------------------------------------------------------------
// Unique name map builder
// Traverses baseTypes → subItems → uniques to build a flat uniqueId → displayName map
// ---------------------------------------------------------------------------

function buildUniqueMap(equipmentJson: EquipmentJson): Map<number, string> {
  const map = new Map<number, string>();
  for (const baseType of Object.values(equipmentJson.baseTypes ?? {})) {
    for (const subItem of Object.values(baseType.subItems ?? {})) {
      for (const unique of Object.values(subItem.uniques ?? {})) {
        map.set(unique.uniqueId, unique.displayName);
      }
    }
  }
  return map;
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Clipboard intercept injection
//
// MUST be called via page.addInitScript() BEFORE page.goto() so the intercept
// is active on every page load. Intercepts navigator.clipboard.writeText at the
// JavaScript level — avoids OS clipboard permission requirements.
// ---------------------------------------------------------------------------

async function injectClipboardIntercept(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__capturedClipboard = null;
    const orig = navigator.clipboard.writeText.bind(navigator.clipboard);
    navigator.clipboard.writeText = async (text: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__capturedClipboard = text;
      return orig(text);
    };
  });
}

async function resetClipboardCapture(page: Page): Promise<void> {
  await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__capturedClipboard = null;
  });
}

async function getClipboardCapture(page: Page, timeoutMs = 5000): Promise<string | null> {
  try {
    await page.waitForFunction(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      () => (window as any).__capturedClipboard !== null,
      { timeout: timeoutMs },
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await page.evaluate(() => (window as any).__capturedClipboard as string);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Phase detection
//
// The phase dropdown is a custom React component (not a native <select>).
// Located in the left Equipment panel, directly below the "EQUIPMENT" heading.
// Confirmed phase labels: "Starter", "Endgame", "Aspirational", possibly "BiS".
// Strategy: click the trigger to open, read option text, close with Escape.
// ---------------------------------------------------------------------------

async function detectPhases(page: Page): Promise<string[]> {
  try {
    // Strategy 1: Find dropdown trigger near EQUIPMENT section header
    const equipmentSection = page.locator('text=EQUIPMENT').locator('..');
    const dropdownTrigger = equipmentSection
      .locator('[role="combobox"], [role="button"], button')
      .first();

    const isVisible = await dropdownTrigger.isVisible().catch(() => false);
    if (!isVisible) {
      // Strategy 2: Any element containing a known phase name as its text
      const phaseTexts = await page
        .locator('button, [role="button"]')
        .allTextContents()
        .catch(() => [] as string[]);
      const found = phaseTexts
        .map((t) => t.trim())
        .filter((t) => (KNOWN_PHASES as readonly string[]).includes(t));
      if (found.length > 0) {
        return found;
      }
      // Cannot determine phases — default to Endgame
      return ['Endgame'];
    }

    await dropdownTrigger.click({ timeout: 5000 });
    await page.waitForTimeout(500);

    // Read option texts — standard ARIA list patterns + custom class patterns
    const optionTexts = await page
      .locator('[role="option"], [role="listbox"] li, ul li, [class*="option"], [class*="item"]')
      .allTextContents()
      .catch(() => [] as string[]);

    const phases = optionTexts
      .map((t) => t.trim())
      .filter((t) => (KNOWN_PHASES as readonly string[]).includes(t));

    // Close dropdown without selecting
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    return phases.length > 0 ? phases : ['Endgame'];
  } catch {
    return ['Endgame'];
  }
}

// ---------------------------------------------------------------------------
// Phase selection
//
// Opens the custom React phase dropdown and clicks the target phase option.
// Waits for network idle + short buffer for React re-render before continuing.
// ---------------------------------------------------------------------------

async function selectPhase(page: Page, phaseName: string): Promise<void> {
  // Find and click the dropdown trigger in the Equipment panel
  const equipmentSection = page.locator('text=EQUIPMENT').locator('..');
  const dropdownTrigger = equipmentSection
    .locator('[role="combobox"], [role="button"], button')
    .first();

  await dropdownTrigger.click({ timeout: 5000 });
  await page.waitForTimeout(300);

  // Click the phase option by its exact confirmed text label
  await page.locator(`text="${phaseName}"`).first().click({ timeout: 5000 });

  // Wait for React state update and any network activity from phase switch
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(800); // additional buffer for React commit phase
}

// ---------------------------------------------------------------------------
// Per-phase export capture
//
// Full sequence per spec:
//   1. Reset clipboard buffer
//   2. Click "Export/Import" button (confirmed: top-right, left of "Loot Filter")
//   3. Wait for modal (confirmed title: "Import/Export Profile Data")
//   4. Click "All Equipment" tab (confirmed: clicking it triggers clipboard.writeText)
//   5. Wait for clipboard capture
//   6. Close modal (Escape)
// ---------------------------------------------------------------------------

async function capturePhase(page: Page, phaseName: string): Promise<string> {
  // Reset buffer before capture
  await resetClipboardCapture(page);

  // Open Export/Import modal
  // Confirmed button label: "Export/Import" — plain text button, top-right of planner
  const exportBtn = page
    .locator(
      'button:has-text("Export/Import"), [role="button"]:has-text("Export/Import")',
    )
    .first();
  await exportBtn.click({ timeout: 5000 });

  // Wait for modal — confirmed modal title text: "Import/Export Profile Data"
  await page.waitForSelector('text=Import/Export Profile Data', { timeout: 5000 });

  // Click "All Equipment" tab — confirmed: clicking the tab itself triggers clipboard.writeText
  // This is Row 1 of the modal tab buttons; it copies ALL equipment + idols + blessings
  await page.locator('text=All Equipment').first().click({ timeout: 5000 });

  // Wait for clipboard to be populated by the tab click
  const json = await getClipboardCapture(page, 5000);
  if (!json) {
    throw new Error(`Clipboard capture timed out after 5000ms`);
  }

  // Close modal
  // Strategy 1: Escape key (most reliable for React modals)
  await page.keyboard.press('Escape');
  await page
    .waitForSelector('text=Import/Export Profile Data', { state: 'hidden', timeout: 3000 })
    .catch(() => {
      // Modal may have already closed or selector didn't match — continue
    });

  return json;
}

// ---------------------------------------------------------------------------
// Export JSON parsing and enrichment
//
// Parses the raw clipboard JSON, enriches uniqueID → uniqueName via equipment.json,
// and logs warnings for unknown unique IDs.
// ---------------------------------------------------------------------------

function enrichExport(
  rawJson: string,
  buildSlug: string,
  phaseName: string,
  uniqueMap: Map<number, string>,
  warnings: Warnings,
): PhaseData {
  const raw = JSON.parse(rawJson) as RawExportJson;

  const processedItems: Record<string, ProcessedItem> = {};
  for (const [slot, item] of Object.entries(raw.items ?? {})) {
    const uniqueID = item.uniqueID ?? 0;
    let uniqueName: string | null = null;

    if (uniqueID > 0) {
      uniqueName = uniqueMap.get(uniqueID) ?? null;
      if (!uniqueName) {
        warnings.unknownUniqueIDs.push({ uniqueID, buildSlug, phase: phaseName, slot });
      }
    }

    processedItems[slot] = {
      slot,
      uniqueID,
      uniqueName,
      affixes: item.affixes ?? [],
      implicits: item.implicits ?? [],
    };
  }

  // Idol array preserves null entries (null = empty idol slot in the planner grid)
  const processedIdols: (ProcessedIdol | null)[] = (raw.idols ?? []).map(
    (idol, idx) => {
      if (!idol) return null;
      return {
        slot: idol.slot ?? idx,
        itemType: idol.itemType ?? 0,
        subType: idol.subType ?? 0,
        affixes: idol.affixes ?? [],
      };
    },
  );

  return {
    items: processedItems,
    idols: processedIdols,
    rawExport: rawJson, // preserved as safety net for reprocessing
  };
}

// ---------------------------------------------------------------------------
// Per-build processing
// ---------------------------------------------------------------------------

async function processBuild(
  page: Page,
  buildSlug: string,
  url: string,
  uniqueMap: Map<number, string>,
  warnings: Warnings,
  verbose: boolean,
): Promise<BuildResult> {
  console.log(`  → Navigating to planner...`);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });

  // Detect available phases from the Equipment panel dropdown
  const availablePhases = await detectPhases(page);
  console.log(`  → Phases found: ${availablePhases.join(', ')}`);

  const phases: Record<string, PhaseData> = {};
  let phaseIndex = 0;

  for (const phaseName of availablePhases) {
    if (phaseIndex > 0) {
      await sleep(DELAY_BETWEEN_PHASES_MS);
    }

    try {
      // Select the phase — skip for the very first phase (already selected on page load)
      // and skip entirely if only one phase exists
      if (availablePhases.length > 1 && phaseIndex > 0) {
        await selectPhase(page, phaseName);
      }

      const rawJson = await capturePhase(page, phaseName);

      if (verbose) {
        console.log(`    [${phaseName}] Raw JSON (first 200 chars): ${rawJson.slice(0, 200)}...`);
      }

      const phaseData = enrichExport(rawJson, buildSlug, phaseName, uniqueMap, warnings);
      const itemCount = Object.keys(phaseData.items).length;
      const idolCount = phaseData.idols.filter(Boolean).length;
      console.log(`  → [${phaseName}] Exported: ${itemCount} items, ${idolCount} idols`);

      phases[phaseName] = phaseData;
    } catch (err) {
      console.error(`  ✗ [${phaseName}] Failed: ${err}`);
      warnings.buildsFailed.push({
        buildSlug,
        url,
        phase: phaseName,
        reason: String(err),
      });
      // Screenshot on phase failure for debugging
      await mkdir(INSPECT_DIR, { recursive: true });
      await page
        .screenshot({ path: path.join(INSPECT_DIR, `error-${buildSlug}-${phaseName}.png`) })
        .catch(() => {});
    }

    phaseIndex++;
  }

  console.log(`  ✓ Done (${Object.keys(phases).length} phases)`);

  return {
    sourceUrl: url,
    scrapedAt: new Date().toISOString(),
    phasesAvailable: availablePhases,
    phases,
  };
}

// ---------------------------------------------------------------------------
// Inspect mode
//
// Saves full rendered HTML and a full-page screenshot, then exits.
// Run this first against a real planner URL to confirm selectors before
// implementing phase detection and export trigger logic.
//
// Usage: npx tsx scripts/pipeline/extract-planner-exports.ts --inspect <slug>
// ---------------------------------------------------------------------------

async function runInspectMode(page: Page, buildSlug: string, url: string): Promise<void> {
  await mkdir(INSPECT_DIR, { recursive: true });

  console.log(`[inspect] Build: ${buildSlug}`);
  console.log(`[inspect] URL:   ${url}`);
  console.log(`[inspect] Navigating and waiting for full render...`);

  await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(2000); // extra buffer for React hydration

  const htmlPath = path.join(INSPECT_DIR, `${buildSlug}.html`);
  const pngPath = path.join(INSPECT_DIR, `${buildSlug}.png`);

  const html = await page.content();
  await writeFile(htmlPath, html, 'utf-8');
  await page.screenshot({ path: pngPath, fullPage: true });

  console.log(`[inspect] Saved HTML:       ${htmlPath}`);
  console.log(`[inspect] Saved screenshot: ${pngPath}`);
  console.log(`\n[inspect] Open the HTML file to confirm selectors for:`);
  console.log(`  - Phase dropdown trigger (below "EQUIPMENT" heading)`);
  console.log(`  - Export/Import button (top-right, left of "Loot Filter")`);
  console.log(`  - Modal title ("Import/Export Profile Data")`);
  console.log(`  - "All Equipment" tab inside the modal`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  // Parse CLI arguments
  const args = process.argv.slice(2);
  const inspectIdx = args.indexOf('--inspect');
  const onlyIdx = args.indexOf('--only');
  const verbose = args.includes('--verbose');
  const isInspectMode = inspectIdx !== -1;
  const inspectSlug = isInspectMode ? args[inspectIdx + 1] : null;
  const onlySlug = onlyIdx !== -1 ? args[onlyIdx + 1] : null;

  if (isInspectMode && !inspectSlug) {
    console.error('Usage: --inspect <build-slug>');
    process.exit(1);
  }

  console.log(
    '=== extract-planner-exports.ts — Last Epoch Filter Pipeline Script 2 ===\n',
  );

  // Load planner URL config
  let plannerUrls: PlannerUrls = {};
  try {
    plannerUrls = JSON.parse(
      await readFile(PLANNER_URLS_PATH, 'utf-8'),
    ) as PlannerUrls;
    console.log(`Loaded ${Object.keys(plannerUrls).length} build URLs from planner-urls.json`);
  } catch {
    console.error(`Could not read planner URLs from: ${PLANNER_URLS_PATH}`);
    console.error(
      'Create data/maxroll/planner-urls.json with build slug → planner URL mappings.',
    );
    console.error('Format: { "build_slug": "https://maxroll.gg/last-epoch/planner/HASH" }');
    process.exit(1);
  }

  // Apply --only filter
  if (onlySlug) {
    if (!plannerUrls[onlySlug]) {
      console.error(`Build slug not found in planner-urls.json: ${onlySlug}`);
      console.error(`Available slugs: ${Object.keys(plannerUrls).join(', ')}`);
      process.exit(1);
    }
    plannerUrls = { [onlySlug]: plannerUrls[onlySlug] };
  }

  // Apply --inspect filter
  if (isInspectMode && inspectSlug) {
    const isUrl = inspectSlug.startsWith('http');
    if (!isUrl) {
      if (!plannerUrls[inspectSlug]) {
        console.error(`Build slug not found in planner-urls.json: ${inspectSlug}`);
        console.error(`Available slugs: ${Object.keys(plannerUrls).join(', ')}`);
        process.exit(1);
      }
      plannerUrls = { [inspectSlug]: plannerUrls[inspectSlug] };
    }
  }

  const buildSlugs = Object.keys(plannerUrls);

  if (buildSlugs.length === 0) {
    console.log('No builds to process.');
    console.log('Populate data/maxroll/planner-urls.json with planner page URLs first.');
    console.log('Planner URLs have the format: https://maxroll.gg/last-epoch/planner/HASH');
    process.exit(0);
  }

  // Load equipment.json for unique name enrichment
  let uniqueMap = new Map<number, string>();
  try {
    const equipJson = JSON.parse(
      await readFile(EQUIPMENT_PATH, 'utf-8'),
    ) as EquipmentJson;
    uniqueMap = buildUniqueMap(equipJson);
    console.log(`Loaded ${uniqueMap.size} unique item names from equipment.json`);
  } catch {
    console.warn('Could not load equipment.json — uniqueNames will be null for all items');
  }

  // Initialize Playwright Chromium
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 },
  });

  const page = await context.newPage();

  // CRITICAL: Inject clipboard intercept BEFORE any navigation.
  // addInitScript runs on every page load — must be called before page.goto().
  await injectClipboardIntercept(page);

  // ── Inspect mode ──────────────────────────────────────────────────────────
  if (isInspectMode && inspectSlug) {
    const isUrl = inspectSlug.startsWith('http');
    const inspectUrl = isUrl ? inspectSlug : plannerUrls[inspectSlug];
    const inspectBuildSlug = isUrl
      ? (new URL(inspectSlug).pathname.split('/').pop() ?? 'inspect')
      : inspectSlug;
    try {
      await runInspectMode(page, inspectBuildSlug, inspectUrl);
    } finally {
      await browser.close();
    }
    return;
  }

  // ── Normal / --only mode ──────────────────────────────────────────────────
  const warnings: Warnings = {
    buildsFailed: [],
    unknownUniqueIDs: [],
    phasesNotFound: [],
  };

  const builds: Record<string, BuildResult> = {};
  let totalPhasesCaptured = 0;
  let buildIndex = 0;

  for (const [buildSlug, url] of Object.entries(plannerUrls)) {
    buildIndex++;
    console.log(`\n[${buildIndex}/${buildSlugs.length}] ${buildSlug}`);

    try {
      const result = await processBuild(
        page,
        buildSlug,
        url,
        uniqueMap,
        warnings,
        verbose,
      );
      builds[buildSlug] = result;
      totalPhasesCaptured += Object.keys(result.phases).length;
    } catch (err) {
      console.error(`[FAIL] ${buildSlug}: ${err}`);
      warnings.buildsFailed.push({
        buildSlug,
        url,
        phase: 'unknown',
        reason: String(err),
      });
      // Screenshot on build-level failure
      await mkdir(INSPECT_DIR, { recursive: true });
      await page
        .screenshot({ path: path.join(INSPECT_DIR, `error-${buildSlug}.png`) })
        .catch(() => {});
    }

    // Rate limiting: 5-second delay between builds
    if (buildIndex < buildSlugs.length) {
      await sleep(DELAY_BETWEEN_BUILDS_MS);
    }
  }

  await browser.close();

  // Build output JSON
  const buildsProcessed = Object.keys(builds);
  const failedSlugs = [...new Set(warnings.buildsFailed.map((b) => b.buildSlug))];
  const phaseFailures = warnings.buildsFailed.filter((b) => b.phase !== 'unknown').length;

  const output = {
    _meta: {
      generatedAt: new Date().toISOString(),
      buildsProcessed,
      buildsFailed: failedSlugs,
      totalPhasesCaptured,
    },
    builds,
  };

  // Write output files
  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(EXPORTS_OUT, JSON.stringify(output, null, 2), 'utf-8');
  await writeFile(WARNINGS_OUT, JSON.stringify(warnings, null, 2), 'utf-8');

  // Summary output
  console.log('\n' + '─'.repeat(49));
  console.log(
    `Summary: ${buildsProcessed.length}/${buildSlugs.length} builds succeeded | ` +
      `${phaseFailures} phase failures | ${totalPhasesCaptured} total phases captured`,
  );
  console.log(`Output: ${EXPORTS_OUT}`);
  console.log(`Warnings: ${WARNINGS_OUT}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
