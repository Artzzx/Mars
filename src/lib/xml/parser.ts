import { XMLParser } from 'fast-xml-parser';
import type {
  ItemFilter,
  Rule,
  Condition,
  RarityCondition,
  SubTypeCondition,
  AffixCondition,
  ClassCondition,
  CharacterLevelCondition,
  UniqueModifiersCondition,
  RuleType,
  Rarity,
  EquipmentType,
  CharacterClass,
  ComparisonType,
} from '../filters/types';
import { FILTER_VERSION } from '../filters/types';

// Parser configuration for Last Epoch XML format
const parserOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseAttributeValue: true,
  trimValues: true,
  isArray: (name: string) => {
    return ['Rule', 'Condition', 'EquipmentType', 'int', 'Uniques'].includes(name);
  },
};

function ensureArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function parseRarityString(rarityStr: string): Rarity[] {
  if (!rarityStr) return [];
  return rarityStr.split(' ').filter(Boolean) as Rarity[];
}

function parseClassString(classStr: string): CharacterClass[] {
  if (!classStr) return [];
  return classStr.split(' ').filter(Boolean) as CharacterClass[];
}

function isNil(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'object' && value !== null) {
    return (value as Record<string, unknown>)['@_i:nil'] === 'true' ||
           (value as Record<string, unknown>)['@_i:nil'] === true;
  }
  return false;
}

function parseNullableNumber(value: unknown): number | null {
  if (isNil(value)) return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
}

function parseCondition(conditionXml: Record<string, unknown>, filterVersion: number): Condition | null {
  const conditionType = conditionXml['@_i:type'] as string;
  const isV5 = filterVersion >= FILTER_VERSION.CURRENT;

  switch (conditionType) {
    case 'RarityCondition': {
      if (isV5) {
        return {
          type: 'RarityCondition',
          rarity: parseRarityString(conditionXml.rarity as string),
          minLegendaryPotential: parseNullableNumber(conditionXml.minLegendaryPotential),
          maxLegendaryPotential: parseNullableNumber(conditionXml.maxLegendaryPotential),
          minWeaversWill: parseNullableNumber(conditionXml.minWeaversWill),
          maxWeaversWill: parseNullableNumber(conditionXml.maxWeaversWill),
        } as RarityCondition;
      } else {
        return {
          type: 'RarityCondition',
          rarity: parseRarityString(conditionXml.rarity as string),
          advanced: conditionXml.advanced === true || conditionXml.advanced === 'true',
          requiredLegendaryPotential: Number(conditionXml.requiredLegendaryPotential) || 0,
          requiredWeaversWill: Number(conditionXml.requiredWeaversWill) || 0,
          minLegendaryPotential: Number(conditionXml.requiredLegendaryPotential) || null,
          maxLegendaryPotential: null,
          minWeaversWill: Number(conditionXml.requiredWeaversWill) || null,
          maxWeaversWill: null,
        } as RarityCondition;
      }
    }

    case 'SubTypeCondition': {
      const typeData = conditionXml.type as Record<string, unknown>;
      const equipmentTypes = typeData?.EquipmentType
        ? ensureArray(typeData.EquipmentType as EquipmentType | EquipmentType[])
        : [];
      const subTypesData = conditionXml.subTypes as Record<string, unknown>;
      let subTypes: number[] = [];
      if (subTypesData?.int) {
        subTypes = ensureArray(subTypesData.int as number | number[]).map(Number);
      }
      return {
        type: 'SubTypeCondition',
        equipmentTypes,
        subTypes,
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

    case 'CharacterLevelCondition':
      return {
        type: 'CharacterLevelCondition',
        minimumLvl: Number(conditionXml.minimumLvl) || 0,
        maximumLvl: Number(conditionXml.maximumLvl) || 100,
      } as CharacterLevelCondition;

    case 'UniqueModifiersCondition': {
      const uniquesData = ensureArray(conditionXml.Uniques as Record<string, unknown>[]);
      const uniques = uniquesData.map((u) => {
        const rollsData = u.Rolls as Record<string, unknown>;
        const rolls = rollsData?.int
          ? ensureArray(rollsData.int as number | number[]).map(Number)
          : [];
        return {
          uniqueId: Number(u.UniqueId) || 0,
          rolls,
        };
      });
      return {
        type: 'UniqueModifiersCondition',
        uniques,
      } as UniqueModifiersCondition;
    }

    default:
      console.warn(`Unknown condition type: ${conditionType}`);
      return null;
  }
}

function parseRule(ruleXml: Record<string, unknown>, filterVersion: number): Rule {
  const conditionsXml = ruleXml.conditions as Record<string, unknown>;
  const conditionList = conditionsXml?.Condition
    ? ensureArray(conditionsXml.Condition as Record<string, unknown> | Record<string, unknown>[])
    : [];

  const conditions = conditionList
    .map((c) => parseCondition(c, filterVersion))
    .filter((c): c is Condition => c !== null);

  const isV5 = filterVersion >= FILTER_VERSION.CURRENT;

  return {
    id: crypto.randomUUID(),
    type: (ruleXml.type as RuleType) || 'SHOW',
    conditions,
    color: Number(ruleXml.color) || 0,
    isEnabled: ruleXml.isEnabled !== false && ruleXml.isEnabled !== 'false',
    emphasized: ruleXml.emphasized === true || ruleXml.emphasized === 'true',
    nameOverride: (ruleXml.nameOverride as string) || '',
    soundId: isV5 ? (Number(ruleXml.SoundId) || 0) : 0,
    beamId: isV5 ? (Number(ruleXml.BeamId) || 0) : 0,
    order: isV5 ? (Number(ruleXml.Order) || 0) : 0,
    levelDependent: !isV5 ? (ruleXml.levelDependent === true || ruleXml.levelDependent === 'true') : undefined,
    minLvl: !isV5 ? (Number(ruleXml.minLvl) || 0) : undefined,
    maxLvl: !isV5 ? (Number(ruleXml.maxLvl) || 0) : undefined,
  };
}

export function parseFilterXml(xmlString: string): ItemFilter {
  const parser = new XMLParser(parserOptions);
  const parsed = parser.parse(xmlString);

  const filterData = parsed.ItemFilter;
  if (!filterData) {
    throw new Error('Invalid filter XML: missing ItemFilter root element');
  }

  const filterVersion = Number(filterData.lootFilterVersion) || 2;

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
    lootFilterVersion: filterVersion,
    rules: ruleList.map((r) => parseRule(r, filterVersion)),
  };
}

export function validateFilterXml(xmlString: string): { valid: boolean; error?: string; isLegacy?: boolean } {
  try {
    const filter = parseFilterXml(xmlString);
    return {
      valid: true,
      isLegacy: filter.lootFilterVersion < FILTER_VERSION.CURRENT,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown parsing error',
    };
  }
}

export function detectFilterVersion(xmlString: string): { version: number; gameVersion: string; isLegacy: boolean } | null {
  try {
    const filter = parseFilterXml(xmlString);
    return {
      version: filter.lootFilterVersion,
      gameVersion: filter.lastModifiedInVersion,
      isLegacy: filter.lootFilterVersion < FILTER_VERSION.CURRENT,
    };
  } catch {
    return null;
  }
}
