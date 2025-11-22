import type {
  ItemFilter,
  Rule,
  Condition,
  RarityCondition,
  SubTypeCondition,
  AffixCondition,
  ClassCondition,
} from '../filters/types';

// Escape XML special characters
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Generate XML for a RarityCondition
function generateRarityCondition(condition: RarityCondition): string {
  return `<Condition i:type="RarityCondition">
<rarity>${condition.rarity.join(' ')}</rarity>
<advanced>${condition.advanced}</advanced>
<requiredLegendaryPotential>${condition.requiredLegendaryPotential}</requiredLegendaryPotential>
<requiredWeaversWill>${condition.requiredWeaversWill}</requiredWeaversWill>
</Condition>`;
}

// Generate XML for a SubTypeCondition
function generateSubTypeCondition(condition: SubTypeCondition): string {
  const equipmentTypesXml = condition.equipmentTypes
    .map((type) => `<EquipmentType>${type}</EquipmentType>`)
    .join('\n');

  return `<Condition i:type="SubTypeCondition">
<type>
${equipmentTypesXml}
</type>
<subTypes/>
</Condition>`;
}

// Generate XML for an AffixCondition
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

// Generate XML for a ClassCondition
function generateClassCondition(condition: ClassCondition): string {
  return `<Condition i:type="ClassCondition">
<req>${condition.classes.join(' ')}</req>
</Condition>`;
}

// Generate XML for a Condition
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
    default:
      console.warn('Unknown condition type:', condition);
      return '';
  }
}

// Generate XML for a Rule
function generateRule(rule: Rule): string {
  const conditionsXml = rule.conditions.map(generateCondition).join('\n');

  return `<Rule>
<type>${rule.type}</type>
<conditions>
${conditionsXml}
</conditions>
<color>${rule.color}</color>
<isEnabled>${rule.isEnabled}</isEnabled>
<levelDependent>${rule.levelDependent}</levelDependent>
<minLvl>${rule.minLvl}</minLvl>
<maxLvl>${rule.maxLvl}</maxLvl>
<emphasized>${rule.emphasized}</emphasized>
<nameOverride>${escapeXml(rule.nameOverride)}</nameOverride>
</Rule>`;
}

// Generate complete filter XML
export function generateFilterXml(filter: ItemFilter): string {
  const rulesXml = filter.rules.map(generateRule).join('\n');

  return `<?xml version="1.0" encoding="utf-8"?>
<ItemFilter xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
<name>${escapeXml(filter.name)}</name>
<filterIcon>${filter.filterIcon}</filterIcon>
<filterIconColor>${filter.filterIconColor}</filterIconColor>
<description>${escapeXml(filter.description)}</description>
<lastModifiedInVersion>${filter.lastModifiedInVersion}</lastModifiedInVersion>
<lootFilterVersion>${filter.lootFilterVersion}</lootFilterVersion>
<rules>
${rulesXml}
</rules>
</ItemFilter>`;
}

// Format XML with proper indentation
export function formatXml(xml: string, indent: string = '  '): string {
  let formatted = '';
  let pad = 0;
  const lines = xml.split(/>\s*</);

  lines.forEach((line, index) => {
    let padding = '';

    // Determine if this is a closing tag
    const isClosing = line.match(/^\/\w/);
    // Determine if this is a self-closing tag
    const isSelfClosing = line.match(/\/\s*$/);
    // Determine if this is an opening tag
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

// Download filter as file
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
