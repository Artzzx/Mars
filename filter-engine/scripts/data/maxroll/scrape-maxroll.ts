/**
 * scrape-maxroll.ts — Script 2 of 3: Maxroll Build Guide Scraper
 *
 * Extracts affix priorities, unique item recommendations, and idol affix data
 * from Maxroll Last Epoch build guide pages using a headless Playwright browser.
 *
 * Usage:
 *   npx tsx scripts/pipeline/scrape-maxroll.ts                       # Scrape all builds
 *   npx tsx scripts/pipeline/scrape-maxroll.ts --inspect <slug>      # Save rendered HTML, then exit
 *   npx tsx scripts/pipeline/scrape-maxroll.ts --only <slug>         # Scrape one build
 *
 * --- DOM Structure Findings (confirmed from inspect runs) ---
 *
 * GUIDE PAGE (https://maxroll.gg/last-epoch/build-guides/<slug>-guide):
 *
 * 1. Linked affixes with IDs (in prose, tooltip components):
 *    <span class="le-affix" data-le-id="507">
 *      <span class="le-gametip"><span>Throwing Damage and Reduced Mana Cost</span></span>
 *    </span>
 *    → IDs are directly available, NO fuzzy matching needed for these
 *
 * 2. General stat priority bullets (Offensive / Defensive sections):
 *    <ul class="list-disc ..."><li>
 *      <mark class="has-inline-color has-le-prefixes-suffixes-color">Fire Throwing Damage</mark>
 *    </li></ul>
 *    → Text only, requires fuzzy matching against affixes.json
 *    → Stored under "GENERAL_OFFENSE" or "GENERAL_DEFENSE" slot keys
 *
 * 3. Unique item recommendations:
 *    <span class="le-item" data-le-type="23" data-le-sub="6" data-le-unique="243">
 *      <span class="le-color-unique">Dragonsong</span>
 *    </span>
 *    → data-le-unique = unique item ID, le-color-unique = display name
 *    → Priority inferred from surrounding prose context
 *
 * 4. Idol items:
 *    <span class="le-color-idol">Heretical Huge Shadow Idol</span>
 *    → Idol name parsed to extract size/type prefix
 *
 * 5. Section structure:
 *    - Gear section: id="idols-blessings-header" / class containing "_TitleV2_"
 *    - Offensive/Defensive columns: class="md:flex-1"
 *    - Build tabs: multiple variants (Marksman, Falconer) — first active tab extracted
 *
 * PLANNER PAGE (https://maxroll.gg/last-epoch/planner/<profile-id>#2):
 *   - Equipment: .lep-slot-{slot} img[alt] → item name, .lep-ItemFrame class → rarity
 *   - Idols: .lep-PaperdollIdols .lep-slot → position/size, img[alt] → name
 *   - Blessings: .lep-PaperdollBlessings img[alt]
 */

import { chromium, type Page } from 'playwright';
import * as fs from 'fs/promises';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AffixEntry {
  affixId: number | null;
  name: string;
  rank: number;
  resolvedExact: boolean;
  resolvedFuzzy?: boolean;
  rawText?: string;
}

interface UniqueEntry {
  uniqueId: number | null;
  uniqueName: string;
  priorityTier: 'core' | 'recommended' | 'alternative' | 'unknown';
  legendaryPotentialRequired: boolean;
  slot?: string;
}

interface BuildResult {
  affixPriorities: Record<string, AffixEntry[]>;
  uniquePriorities: UniqueEntry[];
  sourceUrl: string;
  plannerProfileId?: string;
  scrapedAt: string;
}

interface WarningEntry {
  rawText: string;
  buildSlug: string;
  slot?: string;
  rank?: number;
}

interface AmbiguousMatch {
  rawText: string;
  candidates: Array<{ affixId: number; name: string }>;
  buildSlug: string;
  slot?: string;
}

interface FailedBuild {
  buildSlug: string;
  url: string;
  reason: string;
}

interface UnmappedSlot {
  rawText: string;
  buildSlug: string;
}

interface Warnings {
  unmatchedAffixNames: WarningEntry[];
  ambiguousMatches: AmbiguousMatch[];
  buildsFailed: FailedBuild[];
  unmappedSlotNames: UnmappedSlot[];
}

interface AffixMapping {
  id: number;
  name: string;
  normalised?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DELAY_BETWEEN_PAGES_MS = 3000;

// Slot name → filter constant (from task spec, extended)
const SLOT_NAME_TO_FILTER_CONSTANT: Record<string, string> = {
  helmet: 'HELMET',
  head: 'HELMET',
  'body armor': 'BODY_ARMOR',
  chest: 'BODY_ARMOR',
  gloves: 'GLOVES',
  hands: 'GLOVES',
  belt: 'BELT',
  waist: 'BELT',
  boots: 'BOOTS',
  feet: 'BOOTS',
  amulet: 'AMULET',
  neck: 'AMULET',
  ring: 'RING',
  finger: 'RING',
  relic: 'RELIC',
  shield: 'SHIELD',
  'off-hand': 'OFFHAND',
  offhand: 'OFFHAND',
  catalyst: 'CATALYST',
  quiver: 'QUIVER',
  bow: 'BOW',
  weapon: 'WEAPON',
  'one-handed sword': 'ONE_HANDED_SWORD',
  wand: 'WAND',
  'one-handed axe': 'ONE_HANDED_AXE',
  'one-handed mace': 'ONE_HANDED_MACES',
  dagger: 'ONE_HANDED_DAGGER',
  sceptre: 'ONE_HANDED_SCEPTRE',
  'two-handed sword': 'TWO_HANDED_SWORD',
  'two-handed axe': 'TWO_HANDED_AXE',
  'two-handed mace': 'TWO_HANDED_MACE',
  staff: 'TWO_HANDED_STAFF',
  spear: 'TWO_HANDED_SPEAR',
  crossbow: 'CROSSBOW',
  // Idols
  'small idol': 'IDOL_1x1',
  'minor idol': 'IDOL_1x1_MINOR',
  'humble idol': 'IDOL_2x1',
  'stout idol': 'IDOL_1x2',
  'weaver idol': 'IDOL_1x2', // LEPlanner calls them "weaver idols" by size
  'grand idol': 'IDOL_3x1',
  'large idol': 'IDOL_1x3',
  'ornate idol': 'IDOL_4x1',
  'huge idol': 'IDOL_1x4',
  'adorned idol': 'IDOL_2x2',
  // General stat categories (virtual slot keys when no per-slot data exists)
  offensive: 'GENERAL_OFFENSE',
  defensive: 'GENERAL_DEFENSE',
};

// Priority-tier keywords found in prose context around unique item mentions
const CORE_KEYWORDS = ['must have', 'required', 'mandatory', 'core item', 'bis ', 'best in slot', 'first priority', 'need'];
const RECOMMENDED_KEYWORDS = ['recommended', 'strong option', 'great choice', 'pick up', 'upgrade', 'aim for', 'good option'];
const ALTERNATIVE_KEYWORDS = ['alternative', 'budget', 'can be replaced', 'option if', 'also works', 'swappable'];
const LP_KEYWORDS = ['legendary potential', ' lp', 'with lp', 'requires lp', 'craft legendary'];

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Normalise a string for matching: lowercase, collapse spaces, strip most punctuation */
function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/[''`]/g, '') // apostrophes
    .replace(/[^a-z0-9\s%+\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Resolve an affix display name to an ID using the loaded affix map.
 * Strategy: exact → normalised-exact → partial/substring.
 */
function resolveAffix(
  rawText: string,
  affixMap: AffixMapping[],
): {
  affixId: number | null;
  resolvedExact: boolean;
  resolvedFuzzy: boolean;
  candidates?: AffixMapping[];
} {
  const normRaw = normalise(rawText);

  // 1. Exact (case-insensitive)
  const exact = affixMap.find((a) => a.name.toLowerCase() === rawText.toLowerCase());
  if (exact) return { affixId: exact.id, resolvedExact: true, resolvedFuzzy: false };

  // 2. Normalised exact
  const normExact = affixMap.find((a) => a.normalised === normRaw);
  if (normExact) return { affixId: normExact.id, resolvedExact: false, resolvedFuzzy: true };

  // 3. Partial: raw is a substring of mapping name, or vice versa
  const partials = affixMap.filter(
    (a) => a.normalised!.includes(normRaw) || normRaw.includes(a.normalised!),
  );
  if (partials.length === 1) {
    return { affixId: partials[0].id, resolvedExact: false, resolvedFuzzy: true };
  }
  if (partials.length > 1) {
    return { affixId: null, resolvedExact: false, resolvedFuzzy: false, candidates: partials };
  }

  return { affixId: null, resolvedExact: false, resolvedFuzzy: false };
}

/** Infer unique item priority tier from surrounding prose */
function inferPriorityTier(context: string): 'core' | 'recommended' | 'alternative' | 'unknown' {
  const lc = context.toLowerCase();
  if (CORE_KEYWORDS.some((kw) => lc.includes(kw))) return 'core';
  if (RECOMMENDED_KEYWORDS.some((kw) => lc.includes(kw))) return 'recommended';
  if (ALTERNATIVE_KEYWORDS.some((kw) => lc.includes(kw))) return 'alternative';
  return 'unknown';
}

/** Detect if LP is mentioned near a unique item */
function detectLP(context: string): boolean {
  const lc = context.toLowerCase();
  return LP_KEYWORDS.some((kw) => lc.includes(kw));
}

/** Map idol name (from alt text) to a slot constant */
function idolNameToSlot(name: string): string | null {
  const lc = name.toLowerCase();
  const sizeMap: [string, string][] = [
    ['huge', 'IDOL_1x4'],
    ['adorned', 'IDOL_2x2'],
    ['ornate', 'IDOL_4x1'],
    ['large', 'IDOL_1x3'],
    ['grand', 'IDOL_3x1'],
    ['stout', 'IDOL_1x2'],
    ['humble', 'IDOL_2x1'],
    ['small', 'IDOL_1x1'],
    ['minor', 'IDOL_1x1_MINOR'],
    ['weaver', 'IDOL_1x2'], // "Weaver Idol" shown in LEPlanner
  ];
  for (const [keyword, slot] of sizeMap) {
    if (lc.includes(keyword)) return slot;
  }
  return null;
}

/** Strip HTML tags and decode entities from a string */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------------------------------------------------------------------------
// Affix map loader
// ---------------------------------------------------------------------------

async function loadAffixMap(mappingPath: string): Promise<AffixMapping[]> {
  const raw = await fs.readFile(mappingPath, 'utf-8');
  const parsed: Array<{ id: number; name: string }> = JSON.parse(raw);
  return parsed.map((a) => ({
    id: a.id,
    name: a.name,
    normalised: normalise(a.name),
  }));
}

// ---------------------------------------------------------------------------
// Guide page extraction (Playwright page object)
// ---------------------------------------------------------------------------

/**
 * Extract affixes mentioned via the le-affix component (have data-le-id).
 * These are the "linked" affixes in prose — IDs are directly available.
 */
async function extractLinkedAffixes(page: Page): Promise<
  Array<{ affixId: number; name: string; context: string }>
> {
  return page.evaluate(() => {
    const results: Array<{ affixId: number; name: string; context: string }> = [];
    const seen = new Set<string>();

    document.querySelectorAll('span.le-affix[data-le-id]').forEach((el) => {
      const id = parseInt(el.getAttribute('data-le-id') ?? '0', 10);
      if (!id) return;

      const nameEl = el.querySelector('span.le-gametip > span');
      const name = nameEl?.textContent?.trim() ?? '';

      // Get 300 chars of surrounding context from parent paragraph/li
      const contextEl =
        el.closest('li') ?? el.closest('p') ?? el.closest('div');
      const context = contextEl?.textContent?.slice(0, 300) ?? '';

      const key = `${id}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push({ affixId: id, name, context });
      }
    });

    return results;
  });
}

/**
 * Extract bullet-list affix priorities from the Build Scaling / Gear sections.
 * These are colored <mark> elements — no IDs, require fuzzy resolution later.
 *
 * Returns arrays under keys: "GENERAL_OFFENSE" and "GENERAL_DEFENSE"
 */
async function extractBulletAffixes(
  page: Page,
): Promise<Record<'GENERAL_OFFENSE' | 'GENERAL_DEFENSE', string[]>> {
  return page.evaluate(() => {
    const result: Record<'GENERAL_OFFENSE' | 'GENERAL_DEFENSE', string[]> = {
      GENERAL_OFFENSE: [],
      GENERAL_DEFENSE: [],
    };

    // Find all two-column wrapper divs that follow an "Offensive/Defensive Stats" heading
    const allP = Array.from(document.querySelectorAll('p'));

    let currentCategory: 'GENERAL_OFFENSE' | 'GENERAL_DEFENSE' | null = null;

    // Walk sibling elements to find offensive/defensive lists
    for (const p of allP) {
      const text = p.textContent?.toLowerCase() ?? '';
      if (text.includes('offensive stat')) {
        currentCategory = 'GENERAL_OFFENSE';
      } else if (text.includes('defensive stat')) {
        currentCategory = 'GENERAL_DEFENSE';
      } else {
        currentCategory = null;
      }

      if (!currentCategory) continue;

      // The list immediately follows (sibling or next sibling element)
      let sibling = p.nextElementSibling;
      // Sometimes the list is inside a parent div — walk up then check children
      if (!sibling || sibling.tagName !== 'UL') {
        const parent = p.parentElement;
        const children = parent ? Array.from(parent.children) : [];
        const pIdx = children.indexOf(p);
        sibling = pIdx >= 0 ? children[pIdx + 1] ?? null : null;
      }

      if (sibling && sibling.tagName === 'UL') {
        const items = sibling.querySelectorAll('li');
        items.forEach((li) => {
          // Use li.textContent directly — it concatenates all nested text nodes cleanly.
          // This correctly handles nested color marks like:
          //   <mark>Flat </mark><mark class="fire">Fire</mark><mark> Throwing Damage</mark>
          // → "Flat Fire Throwing Damage"
          const text = (li.textContent ?? '').replace(/\s+/g, ' ').trim();
          if (text && currentCategory) {
            result[currentCategory].push(text);
          }
        });
      }
    }

    return result;
  });
}

/**
 * Extract unique item recommendations from the guide page.
 * Returns items with their IDs and surrounding prose context for priority inference.
 */
async function extractUniqueItems(
  page: Page,
): Promise<Array<{ uniqueId: number; uniqueName: string; context: string }>> {
  return page.evaluate(() => {
    const results: Array<{ uniqueId: number; uniqueName: string; context: string }> = [];
    const seen = new Set<number>();

    // Match any le-item span with data-le-unique (uniques have this attribute regardless of type)
    document.querySelectorAll('span.le-item[data-le-unique]').forEach((el) => {
      const uid = parseInt(el.getAttribute('data-le-unique') ?? '0', 10);
      if (!uid || seen.has(uid)) return;
      seen.add(uid);

      // Unique items use le-color-unique class for the display name
      const nameEl = el.querySelector('span.le-color-unique');
      const name = nameEl?.textContent?.trim() ?? '';
      if (!name) return;

      // Grab up to 400 chars of surrounding context for priority inference
      const contextEl =
        el.closest('li') ??
        el.closest('h2') ??
        el.closest('p') ??
        el.closest('[class*="Accordion__item"]') ??
        el.closest('div');
      const context = (contextEl?.textContent ?? '').slice(0, 400);

      results.push({ uniqueId: uid, uniqueName: name, context });
    });

    return results;
  });
}

/**
 * Extract the LEPlanner profile ID embedded in the guide page.
 * Used to construct the planner URL for fetching actual equipped items.
 */
async function extractPlannerProfileId(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const embed = document.querySelector('[data-le-profile][data-le-type="paperdoll"]');
    return embed?.getAttribute('data-le-profile') ?? null;
  });
}

// ---------------------------------------------------------------------------
// Planner page extraction
// ---------------------------------------------------------------------------

/** Equipment slot class suffix → filter constant */
const PLANNER_SLOT_MAP: Record<string, string> = {
  head: 'HELMET',
  neck: 'AMULET',
  weapon: 'WEAPON',
  body: 'BODY_ARMOR',
  offhand: 'OFFHAND',
  finger1: 'RING_1',
  finger2: 'RING_2',
  waist: 'BELT',
  hands: 'GLOVES',
  feet: 'BOOTS',
  relic: 'RELIC',
};

interface EquippedItem {
  slot: string;
  itemName: string;
  rarity: 'legendary' | 'exalted' | 'unique' | 'rare' | 'normal' | 'idol' | 'unknown';
}

interface PlannerData {
  equipment: EquippedItem[];
  idols: Array<{ itemName: string; slot: string | null; width: number; height: number }>;
  blessings: string[];
}

async function extractPlannerData(page: Page): Promise<PlannerData> {
  return page.evaluate((slotMap: Record<string, string>) => {
    // Equipment
    const equipment: Array<{
      slot: string;
      itemName: string;
      rarity: string;
    }> = [];

    // Each slot has class like "lep-slot-head", "lep-slot-body", etc.
    Object.entries(slotMap).forEach(([slotSuffix, filterConst]) => {
      const slotEl = document.querySelector(`.lep-slot-${slotSuffix}`);
      if (!slotEl) return;

      const img = slotEl.querySelector('img.lep-image');
      const itemName = img?.getAttribute('alt') ?? '';
      if (!itemName) return;

      const frame = slotEl.querySelector('.lep-ItemFrame');
      let rarity = 'unknown';
      if (frame) {
        if (frame.classList.contains('lep-item-legendary')) rarity = 'legendary';
        else if (frame.classList.contains('lep-item-exalted')) rarity = 'exalted';
        else if (frame.classList.contains('lep-item-unique')) rarity = 'unique';
        else if (frame.classList.contains('lep-item-idol')) rarity = 'idol';
        else if (frame.classList.contains('lep-item-rare')) rarity = 'rare';
      }

      equipment.push({ slot: filterConst, itemName, rarity });
    });

    // Idols
    const idols: Array<{
      itemName: string;
      slot: string | null;
      width: number;
      height: number;
    }> = [];

    document
      .querySelectorAll('.lep-PaperdollIdols .lep-slot .lep-item')
      .forEach((idolEl) => {
        const img = idolEl.querySelector('img.lep-image');
        const itemName = img?.getAttribute('alt') ?? '';
        if (!itemName) return;

        // Size from class: lep-iw-N lep-ih-N
        const classes = idolEl.className;
        const wMatch = classes.match(/lep-iw-(\d)/);
        const hMatch = classes.match(/lep-ih-(\d)/);
        const w = wMatch ? parseInt(wMatch[1], 10) : 1;
        const h = hMatch ? parseInt(hMatch[1], 10) : 1;

        idols.push({ itemName, slot: null, width: w, height: h });
      });

    // Blessings
    const blessings: string[] = [];
    document.querySelectorAll('.lep-PaperdollBlessings img').forEach((img) => {
      const name = img.getAttribute('alt') ?? '';
      if (name) blessings.push(name);
    });

    return { equipment, idols, blessings };
  }, PLANNER_SLOT_MAP);
}

// ---------------------------------------------------------------------------
// Core scrape function
// ---------------------------------------------------------------------------

async function scrapeBuild(
  page: Page,
  buildSlug: string,
  guideUrl: string,
  affixMap: AffixMapping[],
  warnings: Warnings,
): Promise<BuildResult> {
  const affixPriorities: Record<string, AffixEntry[]> = {};
  const uniquePriorities: UniqueEntry[] = [];

  // ---- Step 1: Load guide page ----
  console.log(`  [${buildSlug}] Loading guide page: ${guideUrl}`);
  await page.goto(guideUrl, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2000);

  // ---- Step 2: Extract linked affixes (have data-le-id) ----
  const linkedAffixes = await extractLinkedAffixes(page);
  console.log(`  [${buildSlug}] Found ${linkedAffixes.length} linked affixes with IDs`);

  // Store linked affixes under a special key; they have direct IDs
  if (linkedAffixes.length > 0) {
    affixPriorities['LINKED_AFFIXES'] = linkedAffixes.map((a, idx) => ({
      affixId: a.affixId,
      name: a.name,
      rank: idx + 1,
      resolvedExact: true,
    }));
  }

  // ---- Step 3: Extract bullet-list general stat priorities ----
  const bulletAffixes = await extractBulletAffixes(page);
  const categoryKeys = ['GENERAL_OFFENSE', 'GENERAL_DEFENSE'] as const;

  for (const catKey of categoryKeys) {
    const items = bulletAffixes[catKey];
    if (!items.length) continue;

    const resolved: AffixEntry[] = [];
    for (let i = 0; i < items.length; i++) {
      const rawText = items[i];
      const match = resolveAffix(rawText, affixMap);

      if (match.affixId !== null) {
        resolved.push({
          affixId: match.affixId,
          name: rawText,
          rank: i + 1,
          resolvedExact: match.resolvedExact,
          resolvedFuzzy: match.resolvedFuzzy,
          rawText,
        });
      } else if (match.candidates && match.candidates.length > 1) {
        // Ambiguous: log warning, store without ID
        warnings.ambiguousMatches.push({
          rawText,
          candidates: match.candidates.map((c) => ({ affixId: c.id, name: c.name })),
          buildSlug,
          slot: catKey,
        });
        resolved.push({
          affixId: null,
          name: rawText,
          rank: i + 1,
          resolvedExact: false,
          resolvedFuzzy: false,
          rawText,
        });
      } else {
        // No match at all
        warnings.unmatchedAffixNames.push({
          rawText,
          buildSlug,
          slot: catKey,
          rank: i + 1,
        });
        resolved.push({
          affixId: null,
          name: rawText,
          rank: i + 1,
          resolvedExact: false,
          rawText,
        });
      }
    }

    if (resolved.length > 0) {
      affixPriorities[catKey] = resolved;
    }
    console.log(
      `  [${buildSlug}] ${catKey}: ${resolved.length} affixes (${resolved.filter((r) => r.affixId !== null).length} resolved)`,
    );
  }

  // ---- Step 4: Extract unique item recommendations ----
  const rawUniques = await extractUniqueItems(page);
  console.log(`  [${buildSlug}] Found ${rawUniques.length} unique item mentions`);

  for (const u of rawUniques) {
    const tier = inferPriorityTier(u.context);
    const lp = detectLP(u.context);
    uniquePriorities.push({
      uniqueId: u.uniqueId,
      uniqueName: u.uniqueName,
      priorityTier: tier,
      legendaryPotentialRequired: lp,
    });
  }

  // ---- Step 5: Find planner profile ID embedded in guide ----
  const plannerProfileId = await extractPlannerProfileId(page);
  console.log(`  [${buildSlug}] Planner profile ID: ${plannerProfileId ?? 'not found'}`);

  // ---- Step 6: Load planner page if profile ID found ----
  if (plannerProfileId) {
    const plannerUrl = `https://maxroll.gg/last-epoch/planner/${plannerProfileId}#2`;
    console.log(`  [${buildSlug}] Loading planner page: ${plannerUrl}`);

    try {
      await sleep(DELAY_BETWEEN_PAGES_MS);
      await page.goto(plannerUrl, { waitUntil: 'load', timeout: 60000 });
      await page.waitForTimeout(3000); // LEPlanner needs extra hydration time

      const plannerData = await extractPlannerData(page);
      console.log(
        `  [${buildSlug}] Planner: ${plannerData.equipment.length} items, ` +
          `${plannerData.idols.length} idols, ${plannerData.blessings.length} blessings`,
      );

      // Store equipped items under a meta key for downstream use
      if (plannerData.equipment.length > 0) {
        affixPriorities['_PLANNER_EQUIPMENT'] = plannerData.equipment.map((item, idx) => ({
          affixId: null,
          name: `${item.itemName} [${item.rarity}]`,
          rank: idx + 1,
          resolvedExact: false,
          rawText: `slot:${item.slot}`,
        }));
      }

      // Store idols with slot resolution
      if (plannerData.idols.length > 0) {
        const idolEntries: AffixEntry[] = [];
        for (let i = 0; i < plannerData.idols.length; i++) {
          const idol = plannerData.idols[i];
          const slot = idolNameToSlot(idol.itemName) ?? `IDOL_${idol.width}x${idol.height}`;
          idolEntries.push({
            affixId: null,
            name: idol.itemName,
            rank: i + 1,
            resolvedExact: false,
            rawText: `slot:${slot}`,
          });
        }
        affixPriorities['_PLANNER_IDOLS'] = idolEntries;
      }

      // Store blessings
      if (plannerData.blessings.length > 0) {
        affixPriorities['_PLANNER_BLESSINGS'] = plannerData.blessings.map((name, idx) => ({
          affixId: null,
          name,
          rank: idx + 1,
          resolvedExact: false,
        }));
      }
    } catch (plannerErr) {
      console.warn(`  [${buildSlug}] Planner extraction failed: ${plannerErr}`);
      warnings.buildsFailed.push({
        buildSlug: `${buildSlug}:planner`,
        url: `https://maxroll.gg/last-epoch/planner/${plannerProfileId}`,
        reason: String(plannerErr),
      });
    }
  }

  return {
    affixPriorities,
    uniquePriorities,
    sourceUrl: guideUrl,
    plannerProfileId: plannerProfileId ?? undefined,
    scrapedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

async function main() {
  const argv = process.argv.slice(2);

  // Parse CLI args
  let inspectSlug: string | null = null;
  let onlySlug: string | null = null;

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--inspect' && argv[i + 1]) {
      inspectSlug = argv[i + 1];
      i++;
    } else if (argv[i] === '--only' && argv[i + 1]) {
      onlySlug = argv[i + 1];
      i++;
    }
  }

  // Resolve paths (script runs from project root)
  const projectRoot = process.cwd();
  const buildUrlsPath = path.join(projectRoot, 'scripts/data/maxroll/planner-urls.json');
  const affixMappingPath = path.join(projectRoot, 'data/mappings/MasterAffixesList.json');
  const inspectDir = path.join(projectRoot, 'data/maxroll/inspect');
  const outputDir = path.join(projectRoot, 'data/pipeline');

  // Ensure directories exist
  await fs.mkdir(inspectDir, { recursive: true });
  await fs.mkdir(outputDir, { recursive: true });

  // Load build URL config
  const buildUrlsRaw = await fs.readFile(buildUrlsPath, 'utf-8');
  const buildUrls: Record<string, string> = JSON.parse(buildUrlsRaw);

  // Load affix map
  let affixMap: AffixMapping[] = [];
  try {
    affixMap = await loadAffixMap(affixMappingPath);
    console.log(`Loaded ${affixMap.length} affixes from mapping file`);
  } catch (err) {
    console.warn(`Warning: could not load affix mapping (${err}). Affix resolution will be skipped.`);
  }

  // Launch browser
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // Set realistic user agent
  await page.setExtraHTTPHeaders({
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  // ---- INSPECT MODE ----
  if (inspectSlug) {
    const url = buildUrls[inspectSlug];
    if (!url) {
      console.error(`Unknown build slug: ${inspectSlug}`);
      console.error(`Available slugs: ${Object.keys(buildUrls).join(', ')}`);
      await browser.close();
      process.exit(1);
    }

    console.log(`[INSPECT] Navigating to: ${url}`);
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(2000);

    const html = await page.content();
    const outPath = path.join(inspectDir, `${inspectSlug}.html`);
    await fs.writeFile(outPath, html, 'utf-8');
    console.log(`[INSPECT] Saved rendered HTML to: ${outPath}`);
    console.log(`[INSPECT] File size: ${(html.length / 1024).toFixed(1)} KB`);

    await browser.close();
    process.exit(0);
  }

  // ---- SCRAPE MODE ----
  const warnings: Warnings = {
    unmatchedAffixNames: [],
    ambiguousMatches: [],
    buildsFailed: [],
    unmappedSlotNames: [],
  };

  const builds: Record<string, BuildResult> = {};
  const slugsToScrape = onlySlug
    ? { [onlySlug]: buildUrls[onlySlug] }
    : buildUrls;

  if (onlySlug && !buildUrls[onlySlug]) {
    console.error(`Unknown build slug: ${onlySlug}`);
    await browser.close();
    process.exit(1);
  }

  const slugList = Object.keys(slugsToScrape);
  console.log(`\nScraping ${slugList.length} build(s): ${slugList.join(', ')}\n`);

  for (let i = 0; i < slugList.length; i++) {
    const buildSlug = slugList[i];
    const url = slugsToScrape[buildSlug];

    if (!url) {
      console.warn(`[SKIP] ${buildSlug}: No URL in build-urls.json`);
      warnings.buildsFailed.push({ buildSlug, url: '', reason: 'Missing URL in build-urls.json' });
      continue;
    }

    console.log(`\n[${i + 1}/${slugList.length}] Scraping: ${buildSlug}`);

    try {
      const result = await scrapeBuild(page, buildSlug, url, affixMap, warnings);
      builds[buildSlug] = result;

      const affixTotal = Object.values(result.affixPriorities).reduce(
        (sum, arr) => sum + arr.length,
        0,
      );
      console.log(
        `  [${buildSlug}] Done — ${affixTotal} affix entries, ${result.uniquePriorities.length} unique items`,
      );
    } catch (err) {
      console.error(`  [FAIL] ${buildSlug}: ${err}`);
      warnings.buildsFailed.push({ buildSlug, url, reason: String(err) });
    }

    // Rate limit between builds (not after the last one)
    if (i < slugList.length - 1) {
      console.log(`  Waiting ${DELAY_BETWEEN_PAGES_MS / 1000}s before next build...`);
      await sleep(DELAY_BETWEEN_PAGES_MS);
    }
  }

  await browser.close();

  // ---- Write outputs ----
  const meta = {
    generatedAt: new Date().toISOString(),
    buildsScraped: Object.keys(builds),
    buildsFailed: warnings.buildsFailed.map((f) => f.buildSlug),
    sourceUrl: 'https://maxroll.gg/last-epoch',
  };

  const priorities = { _meta: meta, builds };
  const prioritiesPath = path.join(outputDir, 'maxroll-priorities.json');
  await fs.writeFile(prioritiesPath, JSON.stringify(priorities, null, 2), 'utf-8');
  console.log(`\nWrote: ${prioritiesPath}`);

  const warningsPath = path.join(outputDir, 'maxroll-warnings.json');
  await fs.writeFile(warningsPath, JSON.stringify(warnings, null, 2), 'utf-8');
  console.log(`Wrote: ${warningsPath}`);

  // ---- Summary ----
  console.log('\n═══════════════════════════════════════');
  console.log('SCRAPE COMPLETE');
  console.log(`  Builds scraped:   ${Object.keys(builds).length}`);
  console.log(`  Builds failed:    ${warnings.buildsFailed.length}`);
  console.log(`  Unmatched affixes: ${warnings.unmatchedAffixNames.length}`);
  console.log(`  Ambiguous matches: ${warnings.ambiguousMatches.length}`);
  console.log('═══════════════════════════════════════\n');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
