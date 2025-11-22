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
} from '../filters/types';
import { FILTER_VERSION } from '../filters/types';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateNullableValue(value: number | null, tagName: string): string {
  if (value === null) {
    return `<${tagName} i:nil="true" />`;
  }
  return `<${tagName}>${value}</${tagName}>`;
}

function generateRarityCondition(condition: RarityCondition): string {
  // Always output v5 format
  return `<Condition i:type="RarityCondition">
<rarity>${condition.rarity.join(' ')}</rarity>
${generateNullableValue(condition.minLegendaryPotential, 'minLegendaryPotential')}
${generateNullableValue(condition.maxLegendaryPotential, 'maxLegendaryPotential')}
${generateNullableValue(condition.minWeaversWill, 'minWeaversWill')}
${generateNullableValue(condition.maxWeaversWill, 'maxWeaversWill')}
</Condition>`;
}

function generateSubTypeCondition(condition: SubTypeCondition): string {
  const equipmentTypesXml = condition.equipmentTypes
    .map((type) => `<EquipmentType>${type}</EquipmentType>`)
    .join('\n');

  const subTypesXml = condition.subTypes.length > 0
    ? condition.subTypes.map((st) => `<int>${st}</int>`).join('\n')
    : '';

  return `<Condition i:type="SubTypeCondition">
<type>
${equipmentTypesXml}
</type>
<subTypes>${subTypesXml ? '\n' + subTypesXml + '\n' : ''}</subTypes>
</Condition>`;
}

function generateAffixCondition(condition: AffixCondition): string {
  const affixesXml = condition.affixes.map((affix) => `<int>${affix}</int>`).join('\n');

  return `<Condition i:type="AffixCondition">
<affixes>
${affixesXml}
</affixes>
<comparsion>${condition.comparison}</comparsion>
<comparsionValue>${condition.comparisonValue}</comparsionValue>
<minOnTheSameItem>${condition.minOnTheSameItem}</minOnTheSameItem>
<combinedComparsion>${condition.combinedComparison}</combinedComparsion>
<combinedComparsionValue>${condition.combinedComparisonValue}</combinedComparsionValue>
<advanced>${condition.advanced}</advanced>
</Condition>`;
}

function generateClassCondition(condition: ClassCondition): string {
  return `<Condition i:type="ClassCondition">
<req>${condition.classes.join(' ')}</req>
</Condition>`;
}

function generateCharacterLevelCondition(condition: CharacterLevelCondition): string {
  return `<Condition i:type="CharacterLevelCondition">
<minimumLvl>${condition.minimumLvl}</minimumLvl>
<maximumLvl>${condition.maximumLvl}</maximumLvl>
</Condition>`;
}

function generateUniqueModifiersCondition(condition: UniqueModifiersCondition): string {
  const uniquesXml = condition.uniques.map((u) => {
    const rollsXml = u.rolls.length > 0
      ? u.rolls.map((r) => `<int>${r}</int>`).join('\n')
      : '';
    return `<Uniques>
<UniqueId>${u.uniqueId}</UniqueId>
<Rolls>${rollsXml ? '\n' + rollsXml + '\n' : ''}</Rolls>
</Uniques>`;
  }).join('\n');

  return `<Condition i:type="UniqueModifiersCondition">
${uniquesXml}
</Condition>`;
}

function generateCondition(condition: Condition): string {
  switch (condition.type) {
    case 'RarityCondition':
      return generateRarityCondition(condition);
    case 'SubTypeCondition':
      return generateSubTypeCondition(condition);
    case 'AffixCondition':
      return generateAffixCondition(condition);
    case 'ClassCondition':
      return generateClassCondition(condition);
    case 'CharacterLevelCondition':
      return generateCharacterLevelCondition(condition);
    case 'UniqueModifiersCondition':
      return generateUniqueModifiersCondition(condition);
    default:
      console.warn('Unknown condition type:', condition);
      return '';
  }
}

function generateRule(rule: Rule, index: number): string {
  const conditionsXml = rule.conditions.map(generateCondition).join('\n');

  // Always output v5 format
  return `<Rule>
<type>${rule.type}</type>
<conditions>
${conditionsXml}
</conditions>
<color>${rule.color}</color>
<isEnabled>${rule.isEnabled}</isEnabled>
<emphasized>${rule.emphasized}</emphasized>
<nameOverride>${escapeXml(rule.nameOverride)}</nameOverride>
<SoundId>${rule.soundId}</SoundId>
<BeamId>${rule.beamId}</BeamId>
<Order>${rule.order || index}</Order>
</Rule>`;
}

export function generateFilterXml(filter: ItemFilter): string {
  const rulesXml = filter.rules.map((rule, index) => generateRule(rule, index)).join('\n');

  // Always output as v5 format
  return `<?xml version="1.0" encoding="utf-8"?>
<ItemFilter xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
<name>${escapeXml(filter.name)}</name>
<filterIcon>${filter.filterIcon}</filterIcon>
<filterIconColor>${filter.filterIconColor}</filterIconColor>
<description>${escapeXml(filter.description)}</description>
<lastModifiedInVersion>1.3.0</lastModifiedInVersion>
<lootFilterVersion>${FILTER_VERSION.CURRENT}</lootFilterVersion>
<rules>
${rulesXml}
</rules>
</ItemFilter>`;
}

export function formatXml(xml: string, indent: string = '  '): string {
  let formatted = '';
  let pad = 0;
  const lines = xml.split(/>\s*</);

  lines.forEach((line, index) => {
    let padding = '';
    const isClosing = line.match(/^\/\w/);
    const isSelfClosing = line.match(/\/\s*$/);
    const isOpening = !isClosing && !isSelfClosing && line.match(/^<?\w[^>]*[^/]$/);

    if (isClosing) {
      pad--;
    }

    padding = indent.repeat(Math.max(0, pad));

    if (index === 0) {
      formatted += line;
    } else if (index === lines.length - 1) {
      formatted += '>\n' + padding + '<' + line;
    } else {
      formatted += '>\n' + padding + '<' + line;
    }

    if (isOpening && !isClosing) {
      pad++;
    }
  });

  return formatted;
}

export function downloadFilter(filter: ItemFilter, filename?: string): void {
  const xml = generateFilterXml(filter);
  const blob = new Blob([xml], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `${filter.name.replace(/[^a-z0-9]/gi, '_')}.xml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
