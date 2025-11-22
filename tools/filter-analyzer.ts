/**
 * Filter Analyzer CLI Tool
 *
 * Analyzes Last Epoch filter XML files and generates:
 * - Templates for the web app
 * - Module definitions
 * - Strictness variations
 *
 * Usage:
 *   npx tsx tools/filter-analyzer.ts analyze <filter.xml>
 *   npx tsx tools/filter-analyzer.ts generate-templates <folder>
 *   npx tsx tools/filter-analyzer.ts generate-modules <filter.xml>
 */

import * as fs from 'fs';
import * as path from 'path';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';

// ============================================================================
// Types (mirrors src/lib/filters/types.ts)
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
}

interface RuleCategory {
  name: string;
  description: string;
  rules: Rule[];
  confidence: number; // 0-1 how confident we are about this categorization
}

interface AnalysisResult {
  filterName: string;
  totalRules: number;
  rulesByType: { SHOW: number; HIDE: number; HIGHLIGHT: number };
  categories: RuleCategory[];
  suggestedStrictness: string;
  suggestedPurpose: string;
  classSpecific: string | null;
  levelRanges: { min: number; max: number }[];
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

function parseFilterXml(xmlContent: string): ParsedFilter {
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
// Rule Categorization Engine
// ============================================================================

function categorizeRules(rules: Rule[]): RuleCategory[] {
  const categories: RuleCategory[] = [];

  // Detect Leveling Rules (rules with CharacterLevelCondition < 75)
  const levelingRules = rules.filter((rule) => {
    const levelCond = rule.conditions.find((c) => c.type === 'CharacterLevelCondition') as any;
    return levelCond && levelCond.maximumLvl && levelCond.maximumLvl < 75;
  });
  if (levelingRules.length > 0) {
    categories.push({
      name: 'Leveling',
      description: 'Rules active during character leveling (level 1-75)',
      rules: levelingRules,
      confidence: 0.9,
    });
  }

  // Detect Endgame Rules (rules with CharacterLevelCondition >= 75 or no level condition + strict hiding)
  const endgameRules = rules.filter((rule) => {
    const levelCond = rule.conditions.find((c) => c.type === 'CharacterLevelCondition') as any;
    if (levelCond && levelCond.minimumLvl >= 60) return true;
    // Catch-all HIDE rules are typically endgame
    if (rule.type === 'HIDE' && rule.conditions.length === 0) return true;
    return false;
  });
  if (endgameRules.length > 0) {
    categories.push({
      name: 'Endgame',
      description: 'Rules for endgame content (level 75+)',
      rules: endgameRules,
      confidence: 0.85,
    });
  }

  // Detect Rarity Highlights (HIGHLIGHT rules with RarityCondition)
  const rarityHighlights = rules.filter((rule) => {
    return rule.type === 'HIGHLIGHT' && rule.conditions.some((c) => c.type === 'RarityCondition');
  });
  if (rarityHighlights.length > 0) {
    categories.push({
      name: 'Rarity Highlights',
      description: 'Rules that highlight items by rarity (Unique, Exalted, etc.)',
      rules: rarityHighlights,
      confidence: 0.95,
    });
  }

  // Detect Class-Specific Rules
  const classRules = rules.filter((rule) => {
    return rule.conditions.some((c) => c.type === 'ClassCondition');
  });
  if (classRules.length > 0) {
    categories.push({
      name: 'Class-Specific',
      description: 'Rules that filter by character class',
      rules: classRules,
      confidence: 0.95,
    });
  }

  // Detect Affix-Based Rules (trade/crafting value)
  const affixRules = rules.filter((rule) => {
    const affixCond = rule.conditions.find((c) => c.type === 'AffixCondition') as any;
    return affixCond && affixCond.affixes && affixCond.affixes.length > 5;
  });
  if (affixRules.length > 0) {
    categories.push({
      name: 'Affix Hunting',
      description: 'Rules that filter by specific affixes (for trading or crafting)',
      rules: affixRules,
      confidence: 0.8,
    });
  }

  // Detect Equipment Type Rules
  const equipmentRules = rules.filter((rule) => {
    const subTypeCond = rule.conditions.find((c) => c.type === 'SubTypeCondition') as any;
    return subTypeCond && subTypeCond.equipmentTypes && subTypeCond.equipmentTypes.length > 0;
  });
  if (equipmentRules.length > 0) {
    categories.push({
      name: 'Equipment Filters',
      description: 'Rules that filter specific equipment types',
      rules: equipmentRules,
      confidence: 0.85,
    });
  }

  // Uncategorized rules
  const categorizedIds = new Set(categories.flatMap((c) => c.rules.map((r) => JSON.stringify(r))));
  const uncategorized = rules.filter((r) => !categorizedIds.has(JSON.stringify(r)));
  if (uncategorized.length > 0) {
    categories.push({
      name: 'Other',
      description: 'Rules that do not fit into other categories',
      rules: uncategorized,
      confidence: 0.5,
    });
  }

  return categories;
}

function detectFilterPurpose(filter: ParsedFilter): string {
  const name = filter.name.toLowerCase();
  const desc = filter.description.toLowerCase();

  if (name.includes('leveling') || desc.includes('leveling')) return 'Leveling';
  if (name.includes('strict') || desc.includes('strict')) return 'Endgame Strict';
  if (name.includes('ssf') || desc.includes('self-found')) return 'SSF';
  if (name.includes('trade') || desc.includes('trade') || desc.includes('merchant')) return 'Trade';
  if (name.includes('casual') || desc.includes('casual')) return 'Casual';

  // Analyze rule composition
  const hideCount = filter.rules.filter((r) => r.type === 'HIDE').length;
  const showCount = filter.rules.filter((r) => r.type === 'SHOW').length;
  const ratio = hideCount / (showCount + 1);

  if (ratio > 2) return 'Strict';
  if (ratio < 0.5) return 'Relaxed';
  return 'Balanced';
}

function detectStrictness(filter: ParsedFilter): string {
  const hideRules = filter.rules.filter((r) => r.type === 'HIDE').length;
  const totalRules = filter.rules.length;
  const hideRatio = hideRules / totalRules;

  // Check for catch-all HIDE
  const hasCatchAllHide = filter.rules.some((r) => r.type === 'HIDE' && r.conditions.length === 0);

  if (hideRatio > 0.6 || hasCatchAllHide) return 'Strict';
  if (hideRatio > 0.4) return 'Semi-Strict';
  if (hideRatio > 0.2) return 'Regular';
  return 'Relaxed';
}

function detectClassSpecific(filter: ParsedFilter): string | null {
  const classes = ['Sentinel', 'Mage', 'Primalist', 'Rogue', 'Acolyte'];
  const name = filter.name.toLowerCase();
  const desc = filter.description.toLowerCase();

  for (const cls of classes) {
    if (name.includes(cls.toLowerCase()) || desc.includes(cls.toLowerCase())) {
      return cls;
    }
  }
  return null;
}

function detectLevelRanges(rules: Rule[]): { min: number; max: number }[] {
  const ranges: { min: number; max: number }[] = [];

  for (const rule of rules) {
    const levelCond = rule.conditions.find((c) => c.type === 'CharacterLevelCondition') as any;
    if (levelCond) {
      ranges.push({
        min: levelCond.minimumLvl || 0,
        max: levelCond.maximumLvl || 100,
      });
    }
  }

  return ranges;
}

// ============================================================================
// Analysis Function
// ============================================================================

function analyzeFilter(filter: ParsedFilter): AnalysisResult {
  const rulesByType = {
    SHOW: filter.rules.filter((r) => r.type === 'SHOW').length,
    HIDE: filter.rules.filter((r) => r.type === 'HIDE').length,
    HIGHLIGHT: filter.rules.filter((r) => r.type === 'HIGHLIGHT').length,
  };

  return {
    filterName: filter.name,
    totalRules: filter.rules.length,
    rulesByType,
    categories: categorizeRules(filter.rules),
    suggestedStrictness: detectStrictness(filter),
    suggestedPurpose: detectFilterPurpose(filter),
    classSpecific: detectClassSpecific(filter),
    levelRanges: detectLevelRanges(filter.rules),
  };
}

// ============================================================================
// Template Generator
// ============================================================================

function generateTemplateCode(filter: ParsedFilter, analysis: AnalysisResult): string {
  const templateId = filter.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const rules = filter.rules.slice(0, 10).map((rule) => ({
    ...rule,
    id: 'crypto.randomUUID()',
  }));

  return `// Auto-generated template from: ${filter.name}
// Purpose: ${analysis.suggestedPurpose}
// Strictness: ${analysis.suggestedStrictness}
// Generated: ${new Date().toISOString()}

import type { ItemFilter } from '../../lib/filters/types';
import { FILTER_VERSION, GAME_VERSION } from '../../lib/filters/types';

export const ${templateId.replace(/-/g, '_')}Filter: ItemFilter = {
  name: '${filter.name.replace(/'/g, "\\'")}',
  filterIcon: ${filter.filterIcon},
  filterIconColor: ${filter.filterIconColor},
  description: '${filter.description.replace(/'/g, "\\'").replace(/\n/g, ' ')}',
  lastModifiedInVersion: GAME_VERSION.CURRENT,
  lootFilterVersion: FILTER_VERSION.CURRENT,
  rules: [
${rules.map((r) => `    {
      id: crypto.randomUUID(),
      type: '${r.type}',
      conditions: ${JSON.stringify(r.conditions, null, 6).split('\n').join('\n      ')},
      color: ${r.color},
      isEnabled: ${r.isEnabled},
      emphasized: ${r.emphasized},
      nameOverride: '${r.nameOverride}',
      soundId: ${r.soundId},
      beamId: ${r.beamId},
      order: ${r.order},
    }`).join(',\n')}
  ],
};
`;
}

function generateModuleCode(category: RuleCategory): string {
  const moduleId = category.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return `// Module: ${category.name}
// ${category.description}
// Confidence: ${(category.confidence * 100).toFixed(0)}%
// Rules: ${category.rules.length}

export const ${moduleId.replace(/-/g, '_')}Module = {
  id: '${moduleId}',
  name: '${category.name}',
  category: 'Auto-Generated',
  description: '${category.description}',
  rules: [
${category.rules.slice(0, 5).map((r) => `    {
      type: '${r.type}',
      conditions: ${JSON.stringify(r.conditions, null, 6).split('\n').join('\n      ')},
      color: ${r.color},
      isEnabled: ${r.isEnabled},
      emphasized: ${r.emphasized},
      nameOverride: '${r.nameOverride}',
      soundId: ${r.soundId},
      beamId: ${r.beamId},
      order: ${r.order},
    }`).join(',\n')}
  ],
};
`;
}

// ============================================================================
// CLI Commands
// ============================================================================

function printAnalysis(analysis: AnalysisResult): void {
  console.log('\n' + '='.repeat(60));
  console.log(`FILTER ANALYSIS: ${analysis.filterName}`);
  console.log('='.repeat(60));

  console.log(`\n📊 Statistics:`);
  console.log(`   Total Rules: ${analysis.totalRules}`);
  console.log(`   SHOW: ${analysis.rulesByType.SHOW} | HIDE: ${analysis.rulesByType.HIDE} | HIGHLIGHT: ${analysis.rulesByType.HIGHLIGHT}`);

  console.log(`\n🎯 Detected Purpose: ${analysis.suggestedPurpose}`);
  console.log(`📈 Suggested Strictness: ${analysis.suggestedStrictness}`);
  if (analysis.classSpecific) {
    console.log(`⚔️  Class-Specific: ${analysis.classSpecific}`);
  }

  console.log(`\n📁 Rule Categories:`);
  for (const cat of analysis.categories) {
    console.log(`   • ${cat.name} (${cat.rules.length} rules, ${(cat.confidence * 100).toFixed(0)}% confidence)`);
    console.log(`     ${cat.description}`);
  }

  if (analysis.levelRanges.length > 0) {
    const uniqueRanges = [...new Set(analysis.levelRanges.map((r) => `${r.min}-${r.max}`))];
    console.log(`\n📊 Level Ranges Used: ${uniqueRanges.join(', ')}`);
  }

  console.log('\n' + '='.repeat(60));
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log(`
Filter Analyzer CLI Tool

Usage:
  npx tsx tools/filter-analyzer.ts analyze <filter.xml>     Analyze a filter file
  npx tsx tools/filter-analyzer.ts batch <folder>           Analyze all filters in folder
  npx tsx tools/filter-analyzer.ts generate <filter.xml>    Generate template code

Examples:
  npx tsx tools/filter-analyzer.ts analyze "v.1.3/TSM Merchant's Lootfilter  v3.2 - Strict.xml"
  npx tsx tools/filter-analyzer.ts batch v.1.3
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
      const filter = parseFilterXml(xmlContent);
      const analysis = analyzeFilter(filter);
      printAnalysis(analysis);
      break;
    }

    case 'batch': {
      const folderPath = args[1] || 'v.1.3';
      const files = fs.readdirSync(folderPath).filter((f) => f.endsWith('.xml'));

      console.log(`\nAnalyzing ${files.length} filters in ${folderPath}...\n`);

      for (const file of files) {
        try {
          const xmlContent = fs.readFileSync(path.join(folderPath, file), 'utf-8');
          const filter = parseFilterXml(xmlContent);
          const analysis = analyzeFilter(filter);

          console.log(`📄 ${file}`);
          console.log(`   Purpose: ${analysis.suggestedPurpose} | Strictness: ${analysis.suggestedStrictness} | Rules: ${analysis.totalRules}`);
          if (analysis.classSpecific) {
            console.log(`   Class: ${analysis.classSpecific}`);
          }
        } catch (err) {
          console.error(`   ❌ Error: ${err}`);
        }
      }
      break;
    }

    case 'generate': {
      const filePath = args[1];
      if (!filePath) {
        console.error('Error: Please provide a filter file path');
        process.exit(1);
      }

      const xmlContent = fs.readFileSync(filePath, 'utf-8');
      const filter = parseFilterXml(xmlContent);
      const analysis = analyzeFilter(filter);

      console.log('\n// ============ TEMPLATE CODE ============\n');
      console.log(generateTemplateCode(filter, analysis));

      console.log('\n// ============ MODULE CODE ============\n');
      for (const cat of analysis.categories.filter((c) => c.confidence > 0.7)) {
        console.log(generateModuleCode(cat));
      }
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

main().catch(console.error);
