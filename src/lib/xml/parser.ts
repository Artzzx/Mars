import { XMLParser } from 'fast-xml-parser';
import type {
  ItemFilter,
  Rule,
  Condition,
  RarityCondition,
  SubTypeCondition,
  AffixCondition,
  ClassCondition,
  RuleType,
  Rarity,
  EquipmentType,
  CharacterClass,
  ComparisonType,
} from '../filters/types';

// Parser configuration for Last Epoch XML format
const parserOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseAttributeValue: true,
  trimValues: true,
  isArray: (name: string) => {
    // These elements should always be arrays
    return ['Rule', 'Condition', 'EquipmentType', 'int'].includes(name);
  },
};

// Helper to ensure array
function ensureArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

// Parse rarity string to array
function parseRarityString(rarityStr: string): Rarity[] {
  if (!rarityStr) return [];
  return rarityStr.split(' ').filter(Boolean) as Rarity[];
}

// Parse class string to array
function parseClassString(classStr: string): CharacterClass[] {
  if (!classStr) return [];
  return classStr.split(' ').filter(Boolean) as CharacterClass[];
}

// Parse a condition from XML
function parseCondition(conditionXml: Record<string, unknown>): Condition | null {
  const conditionType = conditionXml['@_i:type'] as string;

  switch (conditionType) {
    case 'RarityCondition':
      return {
        type: 'RarityCondition',
        rarity: parseRarityString(conditionXml.rarity as string),
        advanced: conditionXml.advanced === true || conditionXml.advanced === 'true',
        requiredLegendaryPotential: Number(conditionXml.requiredLegendaryPotential) || 0,
        requiredWeaversWill: Number(conditionXml.requiredWeaversWill) || 0,
      } as RarityCondition;

    case 'SubTypeCondition': {
      const typeData = conditionXml.type as Record<string, unknown>;
      const equipmentTypes = typeData?.EquipmentType
        ? ensureArray(typeData.EquipmentType as EquipmentType | EquipmentType[])
        : [];
      return {
        type: 'SubTypeCondition',
        equipmentTypes,
        subTypes: ensureArray((conditionXml.subTypes as string) || []),
      } as SubTypeCondition;
    }

    case 'AffixCondition': {
      const affixesData = conditionXml.affixes as Record<string, unknown>;
      const affixes = affixesData?.int
        ? ensureArray(affixesData.int as number | number[]).map(Number)
        : [];
      return {
        type: 'AffixCondition',
        affixes,
        comparison: (conditionXml.comparsion as ComparisonType) || 'ANY',
        comparisonValue: Number(conditionXml.comparsionValue) || 0,
        minOnTheSameItem: Number(conditionXml.minOnTheSameItem) || 1,
        combinedComparison: (conditionXml.combinedComparsion as ComparisonType) || 'ANY',
        combinedComparisonValue: Number(conditionXml.combinedComparsionValue) || 1,
        advanced: conditionXml.advanced === true || conditionXml.advanced === 'true',
      } as AffixCondition;
    }

    case 'ClassCondition':
      return {
        type: 'ClassCondition',
        classes: parseClassString(conditionXml.req as string),
      } as ClassCondition;

    default:
      console.warn(`Unknown condition type: ${conditionType}`);
      return null;
  }
}

// Parse a rule from XML
function parseRule(ruleXml: Record<string, unknown>): Rule {
  const conditionsXml = ruleXml.conditions as Record<string, unknown>;
  const conditionList = conditionsXml?.Condition
    ? ensureArray(conditionsXml.Condition as Record<string, unknown> | Record<string, unknown>[])
    : [];

  const conditions = conditionList
    .map(parseCondition)
    .filter((c): c is Condition => c !== null);

  return {
    id: crypto.randomUUID(),
    type: (ruleXml.type as RuleType) || 'SHOW',
    conditions,
    color: Number(ruleXml.color) || 0,
    isEnabled: ruleXml.isEnabled !== false && ruleXml.isEnabled !== 'false',
    levelDependent: ruleXml.levelDependent === true || ruleXml.levelDependent === 'true',
    minLvl: Number(ruleXml.minLvl) || 0,
    maxLvl: Number(ruleXml.maxLvl) || 0,
    emphasized: ruleXml.emphasized === true || ruleXml.emphasized === 'true',
    nameOverride: (ruleXml.nameOverride as string) || '',
  };
}

// Main parser function
export function parseFilterXml(xmlString: string): ItemFilter {
  const parser = new XMLParser(parserOptions);
  const parsed = parser.parse(xmlString);

  const filterData = parsed.ItemFilter;
  if (!filterData) {
    throw new Error('Invalid filter XML: missing ItemFilter root element');
  }

  const rulesXml = filterData.rules as Record<string, unknown>;
  const ruleList = rulesXml?.Rule
    ? ensureArray(rulesXml.Rule as Record<string, unknown> | Record<string, unknown>[])
    : [];

  return {
    name: (filterData.name as string) || 'Unnamed Filter',
    filterIcon: Number(filterData.filterIcon) || 1,
    filterIconColor: Number(filterData.filterIconColor) || 0,
    description: (filterData.description as string) || '',
    lastModifiedInVersion: (filterData.lastModifiedInVersion as string) || '1.0.0',
    lootFilterVersion: Number(filterData.lootFilterVersion) || 2,
    rules: ruleList.map(parseRule),
  };
}

// Validate XML string
export function validateFilterXml(xmlString: string): { valid: boolean; error?: string } {
  try {
    parseFilterXml(xmlString);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown parsing error',
    };
  }
}
