/**
 * Filter Analyzer CLI Tool v2
 *
 * Enhanced for structured filter naming: build_Ascendancy_patch_Strictness
 *
 * Analyzes Last Epoch filter XML files and generates:
 * - Build-specific templates
 * - Class/Ascendancy modules
 * - Strictness level definitions
 * - Valued affix lists per build
 *
 * Usage:
 *   npx tsx tools/filter-analyzer.ts analyze <filter.xml>
 *   npx tsx tools/filter-analyzer.ts batch <folder>
 *   npx tsx tools/filter-analyzer.ts build-report <folder>
 *   npx tsx tools/filter-analyzer.ts generate-all <folder>
 */

import * as fs from 'fs';
import * as path from 'path';
import { XMLParser } from 'fast-xml-parser';

// ============================================================================
// Types
// ============================================================================

interface Condition {
  type: string;
  [key: string]: unknown;
}

interface Rule {
  type: 'SHOW' | 'HIDE' | 'HIGHLIGHT';
  conditions: Condition[];
  color: number;
  isEnabled: boolean;
  emphasized: boolean;
  nameOverride: string;
  soundId: number;
  beamId: number;
  order: number;
}

interface ParsedFilter {
  name: string;
  filterIcon: number;
  filterIconColor: number;
  description: string;
  lastModifiedInVersion: string;
  lootFilterVersion: number;
  rules: Rule[];
  // Parsed from filename
  metadata: FilterMetadata;
}

interface FilterMetadata {
  build: string;        // e.g., "VoidKnight", "Necromancer"
  ascendancy: string;   // e.g., "Sentinel", "Acolyte"
  patch: string;        // e.g., "1.3", "1.2"
  strictness: string;   // e.g., "Relaxed", "Strict", "UberStrict"
  raw: string;          // Original filename
}

interface BuildGroup {
  build: string;
  ascendancy: string;
  baseClass: string;
  filters: ParsedFilter[];
  strictnessLevels: string[];
  commonRules: Rule[];           // Rules present in ALL strictness levels
  strictnessModifiers: StrictnessModifier[];
  valuedAffixes: number[];       // Affix IDs that appear frequently
  valuedEquipment: string[];     // Equipment types that matter
}

interface StrictnessModifier {
  fromLevel: string;
  toLevel: string;
  addedRules: Rule[];
  removedRules: Rule[];
  modifiedRules: { before: Rule; after: Rule }[];
}

interface BuildTemplate {
  id: string;
  name: string;
  build: string;
  ascendancy: string;
  baseClass: string;
  description: string;
  baseRules: Rule[];
  strictnessConfig: StrictnessConfig;
  valuedAffixes: number[];
}

interface StrictnessConfig {
  levels: string[];
  modifiers: Record<string, {
    hideNormalAfterLevel: number;
    hideMagicAfterLevel: number;
    hideRareAfterLevel: number;
    showOnlyWithAffixes: boolean;
    minAffixCount: number;
  }>;
}

// ============================================================================
// Ascendancy to Base Class Mapping
// ============================================================================

const ASCENDANCY_MAP: Record<string, string> = {
  // Sentinel
  'VoidKnight': 'Sentinel',
  'ForgeMaster': 'Sentinel',
  'Paladin': 'Sentinel',
  'Sentinel': 'Sentinel',
  // Mage
  'Sorcerer': 'Mage',
  'Spellblade': 'Mage',
  'Runemaster': 'Mage',
  'Mage': 'Mage',
  // Primalist
  'Beastmaster': 'Primalist',
  'Shaman': 'Primalist',
  'Druid': 'Primalist',
  'Primalist': 'Primalist',
  // Rogue
  'Bladedancer': 'Rogue',
  'Marksman': 'Rogue',
  'Falconer': 'Rogue',
  'Rogue': 'Rogue',
  // Acolyte
  'Necromancer': 'Acolyte',
  'Lich': 'Acolyte',
  'Warlock': 'Acolyte',
  'Acolyte': 'Acolyte',
};

const STRICTNESS_ORDER = ['Relaxed', 'Normal', 'SemiStrict', 'Strict', 'VeryStrict', 'UberStrict'];

// ============================================================================
// Filename Parser
// ============================================================================

function parseFilename(filename: string): FilterMetadata {
  // Expected format: build_Ascendancy_patch_Strictness.xml
  // Examples:
  //   VoidKnight_Sentinel_1.3_Strict.xml
  //   Necromancer_Acolyte_1.3_UberStrict.xml

  const basename = path.basename(filename, '.xml');
  const parts = basename.split('_');

  if (parts.length >= 4) {
    const build = parts[0];
    const ascendancy = parts[1];
    const patch = parts[2];
    const strictness = parts.slice(3).join('_'); // Handle multi-word strictness

    return {
      build,
      ascendancy,
      patch,
      strictness: normalizeStrictness(strictness),
      raw: basename,
    };
  }

  // Fallback for non-standard names
  return {
    build: basename,
    ascendancy: 'Unknown',
    patch: '1.3',
    strictness: 'Normal',
    raw: basename,
  };
}

function normalizeStrictness(strictness: string): string {
  const lower = strictness.toLowerCase().replace(/[^a-z]/g, '');

  if (lower.includes('uber')) return 'UberStrict';
  if (lower.includes('very')) return 'VeryStrict';
  if (lower.includes('semi')) return 'SemiStrict';
  if (lower.includes('strict')) return 'Strict';
  if (lower.includes('relax')) return 'Relaxed';

  return 'Normal';
}

// ============================================================================
// XML Parser
// ============================================================================

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseAttributeValue: true,
  trimValues: true,
});

function parseFilterXml(xmlContent: string, filename: string): ParsedFilter {
  const parsed = xmlParser.parse(xmlContent);
  const filterData = parsed.ItemFilter;

  if (!filterData) {
    throw new Error('Invalid filter XML: missing ItemFilter root element');
  }

  const rules: Rule[] = [];
  const rawRules = filterData.rules?.Rule || [];
  const rulesArray = Array.isArray(rawRules) ? rawRules : [rawRules];

  for (const rule of rulesArray) {
    const conditions: Condition[] = [];
    const rawConditions = rule.conditions?.Condition || [];
    const conditionsArray = Array.isArray(rawConditions) ? rawConditions : rawConditions ? [rawConditions] : [];

    for (const cond of conditionsArray) {
      const condType = cond['@_i:type'] || cond['@_type'] || 'Unknown';
      conditions.push({
        type: condType,
        ...parseConditionFields(cond, condType),
      });
    }

    rules.push({
      type: rule.type || 'SHOW',
      conditions,
      color: rule.color || 0,
      isEnabled: rule.isEnabled !== false,
      emphasized: rule.emphasized === true,
      nameOverride: rule.nameOverride || '',
      soundId: rule.SoundId || 0,
      beamId: rule.BeamId || 0,
      order: rule.Order || 0,
    });
  }

  return {
    name: filterData.name || 'Unnamed Filter',
    filterIcon: filterData.filterIcon || 1,
    filterIconColor: filterData.filterIconColor || 0,
    description: filterData.description || '',
    lastModifiedInVersion: filterData.lastModifiedInVersion || '1.3.0',
    lootFilterVersion: filterData.lootFilterVersion || 5,
    rules,
    metadata: parseFilename(filename),
  };
}

function parseConditionFields(cond: any, type: string): Record<string, unknown> {
  switch (type) {
    case 'RarityCondition':
      return {
        rarity: extractArray(cond.rarity?.Rarity),
        minLegendaryPotential: cond.minLegendaryPotential,
        maxLegendaryPotential: cond.maxLegendaryPotential,
        minWeaversWill: cond.minWeaversWill,
        maxWeaversWill: cond.maxWeaversWill,
      };
    case 'SubTypeCondition':
      return {
        equipmentTypes: extractArray(cond.type?.EquipmentType),
        subTypes: extractArray(cond.subTypes?.int),
      };
    case 'AffixCondition':
      return {
        affixes: extractArray(cond.affixes?.int),
        comparison: cond.comparsion || cond.comparison || 'ANY',
        comparisonValue: cond.comparsionValue || cond.comparisonValue || 1,
        minOnTheSameItem: cond.minOnTheSameItem || 1,
      };
    case 'ClassCondition':
      return {
        classes: extractArray(cond.reqClass?.CharacterClass),
      };
    case 'CharacterLevelCondition':
      return {
        minimumLvl: cond.minimumLvl || 0,
        maximumLvl: cond.maximumLvl || 100,
      };
    default:
      return {};
  }
}

function extractArray(value: unknown): unknown[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

// ============================================================================
// Build Grouping & Analysis
// ============================================================================

function groupFiltersByBuild(filters: ParsedFilter[]): Map<string, BuildGroup> {
  const groups = new Map<string, BuildGroup>();

  for (const filter of filters) {
    const key = `${filter.metadata.build}_${filter.metadata.ascendancy}`;

    if (!groups.has(key)) {
      groups.set(key, {
        build: filter.metadata.build,
        ascendancy: filter.metadata.ascendancy,
        baseClass: ASCENDANCY_MAP[filter.metadata.ascendancy] || ASCENDANCY_MAP[filter.metadata.build] || 'Unknown',
        filters: [],
        strictnessLevels: [],
        commonRules: [],
        strictnessModifiers: [],
        valuedAffixes: [],
        valuedEquipment: [],
      });
    }

    const group = groups.get(key)!;
    group.filters.push(filter);

    if (!group.strictnessLevels.includes(filter.metadata.strictness)) {
      group.strictnessLevels.push(filter.metadata.strictness);
    }
  }

  // Sort strictness levels and analyze each group
  for (const group of groups.values()) {
    group.strictnessLevels.sort((a, b) =>
      STRICTNESS_ORDER.indexOf(a) - STRICTNESS_ORDER.indexOf(b)
    );

    analyzeGroup(group);
  }

  return groups;
}

function analyzeGroup(group: BuildGroup): void {
  if (group.filters.length === 0) return;

  // Find common rules (present in all strictness levels)
  const firstFilter = group.filters[0];
  group.commonRules = firstFilter.rules.filter((rule) => {
    return group.filters.every((f) =>
      f.rules.some((r) => rulesMatch(r, rule))
    );
  });

  // Extract valued affixes from all filters
  const affixCounts = new Map<number, number>();
  for (const filter of group.filters) {
    for (const rule of filter.rules) {
      for (const cond of rule.conditions) {
        if (cond.type === 'AffixCondition') {
          const affixes = cond.affixes as number[];
          if (affixes) {
            for (const affix of affixes) {
              affixCounts.set(affix, (affixCounts.get(affix) || 0) + 1);
            }
          }
        }
      }
    }
  }

  // Keep affixes that appear in multiple filters
  group.valuedAffixes = [...affixCounts.entries()]
    .filter(([_, count]) => count >= Math.ceil(group.filters.length / 2))
    .sort((a, b) => b[1] - a[1])
    .map(([affix]) => affix);

  // Extract valued equipment types
  const equipCounts = new Map<string, number>();
  for (const filter of group.filters) {
    for (const rule of filter.rules) {
      if (rule.type === 'SHOW' || rule.type === 'HIGHLIGHT') {
        for (const cond of rule.conditions) {
          if (cond.type === 'SubTypeCondition') {
            const types = cond.equipmentTypes as string[];
            if (types) {
              for (const t of types) {
                equipCounts.set(t, (equipCounts.get(t) || 0) + 1);
              }
            }
          }
        }
      }
    }
  }

  group.valuedEquipment = [...equipCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([equip]) => equip);

  // Calculate strictness modifiers
  for (let i = 0; i < group.filters.length - 1; i++) {
    const fromFilter = group.filters[i];
    const toFilter = group.filters[i + 1];

    group.strictnessModifiers.push(calculateModifiers(fromFilter, toFilter));
  }
}

function rulesMatch(a: Rule, b: Rule): boolean {
  if (a.type !== b.type) return false;
  if (a.conditions.length !== b.conditions.length) return false;

  // Simple comparison - could be enhanced
  return JSON.stringify(a.conditions) === JSON.stringify(b.conditions);
}

function calculateModifiers(from: ParsedFilter, to: ParsedFilter): StrictnessModifier {
  const fromRules = new Set(from.rules.map((r) => JSON.stringify(r)));
  const toRules = new Set(to.rules.map((r) => JSON.stringify(r)));

  const added = to.rules.filter((r) => !fromRules.has(JSON.stringify(r)));
  const removed = from.rules.filter((r) => !toRules.has(JSON.stringify(r)));

  return {
    fromLevel: from.metadata.strictness,
    toLevel: to.metadata.strictness,
    addedRules: added,
    removedRules: removed,
    modifiedRules: [], // Would need smarter matching
  };
}

// ============================================================================
// Report Generation
// ============================================================================

function generateBuildReport(group: BuildGroup): string {
  const lines: string[] = [];

  lines.push('═'.repeat(70));
  lines.push(`BUILD: ${group.build} (${group.ascendancy} / ${group.baseClass})`);
  lines.push('═'.repeat(70));

  lines.push(`\n📊 Filters Analyzed: ${group.filters.length}`);
  lines.push(`📈 Strictness Levels: ${group.strictnessLevels.join(' → ')}`);

  // Rule statistics per strictness
  lines.push(`\n📋 Rules by Strictness:`);
  for (const filter of group.filters) {
    const show = filter.rules.filter((r) => r.type === 'SHOW').length;
    const hide = filter.rules.filter((r) => r.type === 'HIDE').length;
    const highlight = filter.rules.filter((r) => r.type === 'HIGHLIGHT').length;
    lines.push(`   ${filter.metadata.strictness.padEnd(12)} | Total: ${filter.rules.length.toString().padStart(3)} | SHOW: ${show.toString().padStart(2)} | HIDE: ${hide.toString().padStart(2)} | HIGHLIGHT: ${highlight.toString().padStart(2)}`);
  }

  // Common rules (core of the build)
  lines.push(`\n🎯 Core Rules (present in all strictness levels): ${group.commonRules.length}`);

  // Valued affixes
  lines.push(`\n⭐ Valued Affixes (${group.valuedAffixes.length} unique):`);
  lines.push(`   IDs: ${group.valuedAffixes.slice(0, 20).join(', ')}${group.valuedAffixes.length > 20 ? '...' : ''}`);

  // Valued equipment
  lines.push(`\n🛡️ Valued Equipment Types:`);
  lines.push(`   ${group.valuedEquipment.join(', ')}`);

  // Strictness progression
  if (group.strictnessModifiers.length > 0) {
    lines.push(`\n📊 Strictness Progression:`);
    for (const mod of group.strictnessModifiers) {
      lines.push(`   ${mod.fromLevel} → ${mod.toLevel}:`);
      lines.push(`      +${mod.addedRules.length} rules added (more hiding)`);
      lines.push(`      -${mod.removedRules.length} rules removed`);
    }
  }

  lines.push('');
  return lines.join('\n');
}

// ============================================================================
// Code Generation
// ============================================================================

function generateTemplateFile(group: BuildGroup): string {
  const templateId = `${group.build.toLowerCase()}_${group.ascendancy.toLowerCase()}`;
  const relaxedFilter = group.filters.find((f) => f.metadata.strictness === 'Relaxed') || group.filters[0];

  // Use common rules as the base, plus key HIGHLIGHT rules
  const baseRules = [
    ...group.commonRules,
    ...relaxedFilter.rules.filter((r) => r.type === 'HIGHLIGHT' && !group.commonRules.some((cr) => rulesMatch(cr, r))),
  ].slice(0, 15); // Limit to 15 rules for template

  return `/**
 * Auto-generated Build Template
 * Build: ${group.build}
 * Ascendancy: ${group.ascendancy}
 * Base Class: ${group.baseClass}
 * Generated: ${new Date().toISOString()}
 *
 * Strictness levels available: ${group.strictnessLevels.join(', ')}
 * Core rules: ${group.commonRules.length}
 * Valued affixes: ${group.valuedAffixes.length}
 */

import type { ItemFilter } from '../../lib/filters/types';
import { FILTER_VERSION, GAME_VERSION } from '../../lib/filters/types';

export const ${templateId}Filter: ItemFilter = {
  name: '${group.build} (${group.ascendancy})',
  filterIcon: 1,
  filterIconColor: 0,
  description: 'Optimized filter for ${group.build} ${group.ascendancy}. Auto-generated from meta filters.',
  lastModifiedInVersion: GAME_VERSION.CURRENT,
  lootFilterVersion: FILTER_VERSION.CURRENT,
  rules: [
${baseRules.map((r, i) => `    {
      id: crypto.randomUUID(),
      type: '${r.type}',
      conditions: ${JSON.stringify(r.conditions, null, 8).split('\n').join('\n      ')},
      color: ${r.color},
      isEnabled: true,
      emphasized: ${r.emphasized},
      nameOverride: '${r.nameOverride || ''}',
      soundId: ${r.soundId},
      beamId: ${r.beamId},
      order: ${i},
    }`).join(',\n')}
  ],
};

// Valued affixes for this build
export const ${templateId}Affixes = [${group.valuedAffixes.join(', ')}];

// Valued equipment types
export const ${templateId}Equipment = [${group.valuedEquipment.map((e) => `'${e}'`).join(', ')}];
`;
}

function generateModuleFile(group: BuildGroup): string {
  const moduleId = `${group.build.toLowerCase()}-${group.ascendancy.toLowerCase()}`;

  // Create a module that adds the class-specific hide rules
  const classHideRule = group.filters[0].rules.find((r) =>
    r.type === 'HIDE' && r.conditions.some((c) => c.type === 'ClassCondition')
  );

  // Get HIGHLIGHT rules that are unique to this build
  const highlightRules = group.filters[0].rules
    .filter((r) => r.type === 'HIGHLIGHT')
    .slice(0, 5);

  return `/**
 * Auto-generated Module: ${group.build} ${group.ascendancy}
 * Base Class: ${group.baseClass}
 *
 * This module adds ${group.build}-specific filter rules.
 */

import type { Rule } from '../../lib/filters/types';

export const ${moduleId.replace(/-/g, '_')}Module = {
  id: '${moduleId}',
  name: '${group.build} (${group.ascendancy})',
  category: 'Build',
  description: 'Optimized rules for ${group.build} ${group.ascendancy} build. Hides items for other classes and highlights valuable ${group.baseClass} gear.',
  rules: [
${classHideRule ? `    // Hide items not usable by ${group.baseClass}
    {
      type: 'HIDE',
      conditions: ${JSON.stringify(classHideRule.conditions, null, 8).split('\n').join('\n      ')},
      color: 0,
      isEnabled: true,
      emphasized: false,
      nameOverride: '[${group.build}] Other Class Items',
      soundId: 0,
      beamId: 0,
      order: 0,
    },` : ''}
${highlightRules.map((r, i) => `    {
      type: '${r.type}',
      conditions: ${JSON.stringify(r.conditions, null, 8).split('\n').join('\n      ')},
      color: ${r.color},
      isEnabled: true,
      emphasized: ${r.emphasized},
      nameOverride: '${r.nameOverride || `[${group.build}]`}',
      soundId: ${r.soundId},
      beamId: ${r.beamId},
      order: ${i + 1},
    }`).join(',\n')}
  ] as Omit<Rule, 'id'>[],
};
`;
}

function generateStrictnessConfig(groups: Map<string, BuildGroup>): string {
  const configs: string[] = [];

  for (const group of groups.values()) {
    if (group.strictnessModifiers.length === 0) continue;

    configs.push(`  // ${group.build} ${group.ascendancy}`);
    configs.push(`  '${group.build.toLowerCase()}_${group.ascendancy.toLowerCase()}': {`);
    configs.push(`    levels: [${group.strictnessLevels.map((l) => `'${l}'`).join(', ')}],`);
    configs.push(`    baseRuleCount: ${group.commonRules.length},`);
    configs.push(`    progression: [`);

    for (const mod of group.strictnessModifiers) {
      configs.push(`      { from: '${mod.fromLevel}', to: '${mod.toLevel}', addedHides: ${mod.addedRules.filter((r) => r.type === 'HIDE').length}, removedShows: ${mod.removedRules.filter((r) => r.type === 'SHOW').length} },`);
    }

    configs.push(`    ],`);
    configs.push(`  },`);
  }

  return `/**
 * Auto-generated Strictness Configuration
 *
 * This file contains strictness progression data for all analyzed builds.
 * Use this to implement dynamic strictness adjustment in the UI.
 */

export const STRICTNESS_CONFIG = {
${configs.join('\n')}
};

export const STRICTNESS_LEVELS = ['Relaxed', 'Normal', 'SemiStrict', 'Strict', 'VeryStrict', 'UberStrict'];
`;
}

// ============================================================================
// CLI Commands
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║           LAST EPOCH FILTER ANALYZER v2                              ║
║           Optimized for: build_Ascendancy_patch_Strictness           ║
╚══════════════════════════════════════════════════════════════════════╝

Usage:
  npx tsx tools/filter-analyzer.ts analyze <filter.xml>      Analyze single filter
  npx tsx tools/filter-analyzer.ts batch <folder>            Quick scan all filters
  npx tsx tools/filter-analyzer.ts build-report <folder>     Detailed build reports
  npx tsx tools/filter-analyzer.ts generate-all <folder>     Generate templates & modules

Expected filename format: build_Ascendancy_patch_Strictness.xml
Examples:
  VoidKnight_Sentinel_1.3_Strict.xml
  Necromancer_Acolyte_1.3_UberStrict.xml
    `);
    return;
  }

  switch (command) {
    case 'analyze': {
      const filePath = args[1];
      if (!filePath) {
        console.error('Error: Please provide a filter file path');
        process.exit(1);
      }

      const xmlContent = fs.readFileSync(filePath, 'utf-8');
      const filter = parseFilterXml(xmlContent, filePath);

      console.log(`\n📄 File: ${path.basename(filePath)}`);
      console.log(`   Build: ${filter.metadata.build}`);
      console.log(`   Ascendancy: ${filter.metadata.ascendancy}`);
      console.log(`   Patch: ${filter.metadata.patch}`);
      console.log(`   Strictness: ${filter.metadata.strictness}`);
      console.log(`   Rules: ${filter.rules.length}`);
      break;
    }

    case 'batch': {
      const folderPath = args[1] || '.';
      const files = fs.readdirSync(folderPath).filter((f) => f.endsWith('.xml'));

      console.log(`\n📂 Scanning ${files.length} filters in ${folderPath}...\n`);

      const filters: ParsedFilter[] = [];
      for (const file of files) {
        try {
          const xmlContent = fs.readFileSync(path.join(folderPath, file), 'utf-8');
          const filter = parseFilterXml(xmlContent, file);
          filters.push(filter);

          console.log(`✅ ${filter.metadata.build.padEnd(15)} | ${filter.metadata.ascendancy.padEnd(10)} | ${filter.metadata.strictness.padEnd(12)} | ${filter.rules.length} rules`);
        } catch (err) {
          console.error(`❌ ${file}: ${err}`);
        }
      }

      // Group summary
      const groups = groupFiltersByBuild(filters);
      console.log(`\n📊 Found ${groups.size} unique builds across ${filters.length} filters`);
      break;
    }

    case 'build-report': {
      const folderPath = args[1] || '.';
      const files = fs.readdirSync(folderPath).filter((f) => f.endsWith('.xml'));

      const filters: ParsedFilter[] = [];
      for (const file of files) {
        try {
          const xmlContent = fs.readFileSync(path.join(folderPath, file), 'utf-8');
          filters.push(parseFilterXml(xmlContent, file));
        } catch (err) {
          // Skip invalid files
        }
      }

      const groups = groupFiltersByBuild(filters);

      for (const group of groups.values()) {
        console.log(generateBuildReport(group));
      }
      break;
    }

    case 'generate-all': {
      const folderPath = args[1] || '.';
      const outputDir = args[2] || 'generated';
      const files = fs.readdirSync(folderPath).filter((f) => f.endsWith('.xml'));

      const filters: ParsedFilter[] = [];
      for (const file of files) {
        try {
          const xmlContent = fs.readFileSync(path.join(folderPath, file), 'utf-8');
          filters.push(parseFilterXml(xmlContent, file));
        } catch (err) {
          // Skip invalid files
        }
      }

      const groups = groupFiltersByBuild(filters);

      // Create output directory
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Generate files for each build
      for (const group of groups.values()) {
        const templateId = `${group.build.toLowerCase()}_${group.ascendancy.toLowerCase()}`;

        // Template file
        fs.writeFileSync(
          path.join(outputDir, `template_${templateId}.ts`),
          generateTemplateFile(group)
        );

        // Module file
        fs.writeFileSync(
          path.join(outputDir, `module_${templateId}.ts`),
          generateModuleFile(group)
        );

        console.log(`✅ Generated: ${templateId}`);
      }

      // Generate strictness config
      fs.writeFileSync(
        path.join(outputDir, 'strictness-config.ts'),
        generateStrictnessConfig(groups)
      );

      console.log(`\n📁 Output written to: ${outputDir}/`);
      console.log(`   - ${groups.size} template files`);
      console.log(`   - ${groups.size} module files`);
      console.log(`   - 1 strictness-config.ts`);
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

main().catch(console.error);
