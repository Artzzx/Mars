/**
 * Template Compilation Engine
 *
 * The main engine that compiles templates, builds, and strictness
 * configurations into complete filter rule sets.
 */

import type { CharacterClass, Condition } from '../../filters/types';
import type { Rule, ItemFilter } from '../../filters/types';
import type { CompiledRule, BuildProfile, StrictnessConfig } from './types';
import {
  generateClassHideRules,
  generateUniqueRules,
  generateExaltedRules,
  generateRareRules,
  generateLevelingRules,
  generateSetRules,
  generateIdolRules,
  generateLegendaryRules,
} from './rule-builder';
import { getStrictnessConfig, getDefaultStrictness } from '../schemas/strictness';
import { getBuildById } from '../schemas/builds';
import { FILTER_VERSION, GAME_VERSION } from '../../filters/types';

// ============================================================================
// Engine Configuration
// ============================================================================

export interface CompileOptions {
  strictnessId: string;
  buildId?: string;
  selectedClasses: CharacterClass[];
  options?: {
    includeUniques?: boolean;
    includeIdols?: boolean;
    includeSets?: boolean;
    includeLegendary?: boolean;
    includeExalted?: boolean;
    includeRares?: boolean;
    includeLeveling?: boolean;
  };
}

// ============================================================================
// Main Compilation Function
// ============================================================================

/**
 * Compile a complete filter from configuration
 */
export function compileFilter(options: CompileOptions): ItemFilter {
  const strictness = getStrictnessConfig(options.strictnessId) || getDefaultStrictness();
  const build = options.buildId ? getBuildById(options.buildId) : undefined;
  const selectedClasses = options.selectedClasses.length > 0
    ? options.selectedClasses
    : build
      ? [build.class]
      : [];

  const includeOptions = {
    includeUniques: true,
    includeIdols: true,
    includeSets: true,
    includeLegendary: true,
    includeExalted: true,
    includeRares: true,
    includeLeveling: true,
    ...options.options,
  };

  // Generate all rules
  const compiledRules = generateAllRules(strictness, build, selectedClasses, includeOptions);

  // Sort by order
  compiledRules.sort((a, b) => a.order - b.order);

  // Convert to ItemFilter format
  const filterName = generateFilterName(strictness, build, selectedClasses);
  const filterDescription = generateFilterDescription(strictness, build, selectedClasses);

  return {
    name: filterName,
    filterIcon: build ? getClassIcon(build.class) : 1,
    filterIconColor: getStrictnessColor(strictness),
    description: filterDescription,
    lastModifiedInVersion: GAME_VERSION.CURRENT,
    lootFilterVersion: FILTER_VERSION.CURRENT,
    rules: compiledRules.map(convertToFilterRule),
  };
}

/**
 * Generate all rules based on configuration
 *
 * NOTE: Rule ordering is handled by the priority system in rule-builder.ts
 * Lower priority number = higher in filter = processed first
 */
function generateAllRules(
  strictness: StrictnessConfig,
  build: BuildProfile | undefined,
  selectedClasses: CharacterClass[],
  options: Required<NonNullable<CompileOptions['options']>>
): CompiledRule[] {
  const allRules: CompiledRule[] = [];

  // Section 1: Legendary items (highest priority)
  if (options.includeLegendary) {
    allRules.push(...generateLegendaryRules());
  }

  // Section 2: High LP Uniques
  if (options.includeUniques) {
    allRules.push(...generateUniqueRules(strictness));
  }

  // Section 3: Exalted items with build-specific affixes
  if (options.includeExalted) {
    allRules.push(...generateExaltedRules(strictness, build));
  }

  // Section 4: Idols with build affixes
  if (options.includeIdols) {
    allRules.push(...generateIdolRules(build));
  }

  // Section 5: Rares with good affixes (for leveling/SSF)
  if (options.includeRares) {
    allRules.push(...generateRareRules(strictness, build));
  }

  // Section 6: Set items
  if (options.includeSets) {
    allRules.push(...generateSetRules(strictness));
  }

  // Section 7: Leveling rules (normal/magic)
  if (options.includeLeveling) {
    allRules.push(...generateLevelingRules(strictness));
  }

  // Section 8: Class hide rules (lowest priority)
  if (selectedClasses.length > 0 && selectedClasses.length < 5) {
    allRules.push(...generateClassHideRules(selectedClasses));
  }

  return allRules;
}

/**
 * Convert CompiledRule to ItemFilter Rule format
 */
function convertToFilterRule(compiled: CompiledRule): Rule {
  return {
    id: crypto.randomUUID(),
    type: compiled.type,
    conditions: compiled.conditions as unknown as Condition[],
    color: compiled.color,
    isEnabled: compiled.isEnabled,
    emphasized: compiled.emphasized,
    nameOverride: compiled.name,
    soundId: compiled.soundId,
    beamId: compiled.beamId,
    order: compiled.order,
  };
}

// ============================================================================
// Name Generation
// ============================================================================

function generateFilterName(
  strictness: StrictnessConfig,
  build?: BuildProfile,
  classes?: CharacterClass[]
): string {
  const parts: string[] = [];

  if (build) {
    parts.push(build.displayName);
  } else if (classes && classes.length > 0 && classes.length < 5) {
    parts.push(classes.join('/'));
  }

  parts.push(strictness.name);
  parts.push('Filter');

  return parts.join(' ');
}

function generateFilterDescription(
  strictness: StrictnessConfig,
  build?: BuildProfile,
  classes?: CharacterClass[]
): string {
  const parts: string[] = [];

  parts.push(strictness.description);

  if (build) {
    parts.push(`\n\nOptimized for ${build.displayName} (${build.ascendancy}).`);
    parts.push(`Primary stats: ${build.primaryStats.join(', ')}.`);
    parts.push(`Damage types: ${build.damageTypes.join(', ')}.`);
  } else if (classes && classes.length > 0) {
    parts.push(`\n\nClass filter: ${classes.join(', ')}.`);
  }

  parts.push(`\n\nGenerated by Last Epoch Filter Tool.`);

  return parts.join(' ');
}

function getClassIcon(className: CharacterClass): number {
  const icons: Record<CharacterClass, number> = {
    Sentinel: 1,
    Mage: 2,
    Primalist: 3,
    Rogue: 4,
    Acolyte: 5,
  };
  return icons[className] || 1;
}

function getStrictnessColor(strictness: StrictnessConfig): number {
  const colors: Record<string, number> = {
    regular: 12, // Green
    strict: 8, // Yellow
    'very-strict': 5, // Orange
    'uber-strict': 6, // Red
    'giga-strict': 14, // Purple
  };
  return colors[strictness.id] || 0;
}

// ============================================================================
// Quick Generation Functions
// ============================================================================

/**
 * Generate a filter for a specific build
 */
export function generateBuildFilter(buildId: string, strictnessId = 'regular'): ItemFilter {
  const build = getBuildById(buildId);
  if (!build) {
    throw new Error(`Build not found: ${buildId}`);
  }

  return compileFilter({
    strictnessId,
    buildId,
    selectedClasses: [build.class],
  });
}

/**
 * Generate a class-only filter (no specific build)
 */
export function generateClassFilter(
  classes: CharacterClass[],
  strictnessId = 'regular'
): ItemFilter {
  return compileFilter({
    strictnessId,
    selectedClasses: classes,
  });
}

/**
 * Generate a generic filter without class restrictions
 */
export function generateGenericFilter(strictnessId = 'regular'): ItemFilter {
  return compileFilter({
    strictnessId,
    selectedClasses: [],
  });
}

// ============================================================================
// Rule Counting & Stats
// ============================================================================

export interface FilterStats {
  totalRules: number;
  showRules: number;
  hideRules: number;
  highlightRules: number;
  uniqueRules: number;
  exaltedRules: number;
  rareRules: number;
  idolRules: number;
  classRules: number;
}

export function getFilterStats(filter: ItemFilter): FilterStats {
  const rules = filter.rules;

  return {
    totalRules: rules.length,
    showRules: rules.filter((r) => r.type === 'SHOW').length,
    hideRules: rules.filter((r) => r.type === 'HIDE').length,
    highlightRules: rules.filter((r) => r.type === 'HIGHLIGHT').length,
    uniqueRules: rules.filter((r) =>
      r.conditions.some((c) => c.type === 'RarityCondition' && (c as { rarity?: string[] }).rarity?.includes('UNIQUE'))
    ).length,
    exaltedRules: rules.filter((r) =>
      r.conditions.some((c) => c.type === 'RarityCondition' && (c as { rarity?: string[] }).rarity?.includes('EXALTED'))
    ).length,
    rareRules: rules.filter((r) =>
      r.conditions.some((c) => c.type === 'RarityCondition' && (c as { rarity?: string[] }).rarity?.includes('RARE'))
    ).length,
    idolRules: rules.filter((r) =>
      r.conditions.some((c) => {
        const subType = c as { equipmentTypes?: string[] };
        return c.type === 'SubTypeCondition' && subType.equipmentTypes?.some((t) => t.includes('IDOL'));
      })
    ).length,
    classRules: rules.filter((r) => r.conditions.some((c) => c.type === 'ClassCondition')).length,
  };
}
