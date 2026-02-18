import { describe, it, expect } from 'vitest';
import { parseFilterXml, validateFilterXml, detectFilterVersion } from './parser';
import { generateFilterXml } from './generator';
import type { ItemFilter } from '../filters/types';

const SAMPLE_V5_FILTER = `<?xml version="1.0" encoding="utf-8"?>
<ItemFilter xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
<name>Test Filter</name>
<filterIcon>2</filterIcon>
<filterIconColor>11</filterIconColor>
<description>A test filter</description>
<lastModifiedInVersion>1.3.0</lastModifiedInVersion>
<lootFilterVersion>5</lootFilterVersion>
<rules>
<Rule>
<type>SHOW</type>
<conditions>
<Condition i:type="RarityCondition">
<rarity>EXALTED UNIQUE</rarity>
<minLegendaryPotential i:nil="true" />
<maxLegendaryPotential i:nil="true" />
<minWeaversWill i:nil="true" />
<maxWeaversWill i:nil="true" />
</Condition>
</conditions>
<color>7</color>
<isEnabled>true</isEnabled>
<emphasized>true</emphasized>
<nameOverride></nameOverride>
<SoundId>3</SoundId>
<BeamId>2</BeamId>
<Order>0</Order>
</Rule>
<Rule>
<type>HIDE</type>
<conditions>
<Condition i:type="SubTypeCondition">
<type>
<EquipmentType>HELMET</EquipmentType>
<EquipmentType>BOOTS</EquipmentType>
</type>
<subTypes />
</Condition>
<Condition i:type="RarityCondition">
<rarity>NORMAL</rarity>
<minLegendaryPotential i:nil="true" />
<maxLegendaryPotential i:nil="true" />
<minWeaversWill i:nil="true" />
<maxWeaversWill i:nil="true" />
</Condition>
</conditions>
<color>0</color>
<isEnabled>true</isEnabled>
<emphasized>false</emphasized>
<nameOverride></nameOverride>
<SoundId>0</SoundId>
<BeamId>0</BeamId>
<Order>1</Order>
</Rule>
<Rule>
<type>SHOW</type>
<conditions>
<Condition i:type="AffixCondition">
<affixes>
<int>25</int>
<int>52</int>
</affixes>
<comparsion>ANY</comparsion>
<comparsionValue>1</comparsionValue>
<minOnTheSameItem>1</minOnTheSameItem>
<combinedComparsion>ANY</combinedComparsion>
<combinedComparsionValue>1</combinedComparsionValue>
<advanced>false</advanced>
</Condition>
</conditions>
<color>2</color>
<isEnabled>true</isEnabled>
<emphasized>false</emphasized>
<nameOverride>Good Affixes</nameOverride>
<SoundId>1</SoundId>
<BeamId>0</BeamId>
<Order>2</Order>
</Rule>
</rules>
</ItemFilter>`;

const SAMPLE_V2_FILTER = `<?xml version="1.0" encoding="utf-8"?>
<ItemFilter xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
<name>Legacy Filter</name>
<filterIcon>1</filterIcon>
<filterIconColor>0</filterIconColor>
<description>Legacy v2 filter</description>
<lastModifiedInVersion>1.2.0</lastModifiedInVersion>
<lootFilterVersion>2</lootFilterVersion>
<rules>
<Rule>
<type>SHOW</type>
<conditions>
<Condition i:type="RarityCondition">
<rarity>RARE EXALTED</rarity>
<advanced>true</advanced>
<requiredLegendaryPotential>3</requiredLegendaryPotential>
<requiredWeaversWill>0</requiredWeaversWill>
</Condition>
</conditions>
<color>5</color>
<isEnabled>true</isEnabled>
<emphasized>false</emphasized>
<nameOverride></nameOverride>
<levelDependent>true</levelDependent>
<minLvl>50</minLvl>
<maxLvl>80</maxLvl>
</Rule>
</rules>
</ItemFilter>`;

describe('parseFilterXml', () => {
  it('parses v5 filter metadata correctly', () => {
    const filter = parseFilterXml(SAMPLE_V5_FILTER);
    expect(filter.name).toBe('Test Filter');
    expect(filter.filterIcon).toBe(2);
    expect(filter.filterIconColor).toBe(11);
    expect(filter.description).toBe('A test filter');
    expect(filter.lastModifiedInVersion).toBe('1.3.0');
    expect(filter.lootFilterVersion).toBe(5);
  });

  it('parses v5 rules correctly', () => {
    const filter = parseFilterXml(SAMPLE_V5_FILTER);
    expect(filter.rules).toHaveLength(3);

    const rule1 = filter.rules[0];
    expect(rule1.type).toBe('SHOW');
    expect(rule1.color).toBe(7);
    expect(rule1.isEnabled).toBe(true);
    expect(rule1.emphasized).toBe(true);
    expect(rule1.soundId).toBe(3);
    expect(rule1.beamId).toBe(2);
    expect(rule1.order).toBe(0);
  });

  it('parses RarityCondition correctly', () => {
    const filter = parseFilterXml(SAMPLE_V5_FILTER);
    const cond = filter.rules[0].conditions[0];
    expect(cond.type).toBe('RarityCondition');
    if (cond.type === 'RarityCondition') {
      expect(cond.rarity).toEqual(['EXALTED', 'UNIQUE']);
      expect(cond.minLegendaryPotential).toBeNull();
      expect(cond.maxLegendaryPotential).toBeNull();
    }
  });

  it('parses SubTypeCondition correctly', () => {
    const filter = parseFilterXml(SAMPLE_V5_FILTER);
    const rule2 = filter.rules[1];
    const subTypeCond = rule2.conditions.find((c) => c.type === 'SubTypeCondition');
    expect(subTypeCond).toBeDefined();
    if (subTypeCond?.type === 'SubTypeCondition') {
      expect(subTypeCond.equipmentTypes).toEqual(['HELMET', 'BOOTS']);
    }
  });

  it('parses AffixCondition correctly', () => {
    const filter = parseFilterXml(SAMPLE_V5_FILTER);
    const rule3 = filter.rules[2];
    const affixCond = rule3.conditions[0];
    expect(affixCond.type).toBe('AffixCondition');
    if (affixCond.type === 'AffixCondition') {
      expect(affixCond.affixes).toEqual([25, 52]);
      expect(affixCond.comparison).toBe('ANY');
      expect(affixCond.comparisonValue).toBe(1);
    }
    expect(rule3.nameOverride).toBe('Good Affixes');
  });

  it('parses v2 legacy filter with level dependency', () => {
    const filter = parseFilterXml(SAMPLE_V2_FILTER);
    expect(filter.name).toBe('Legacy Filter');
    expect(filter.lootFilterVersion).toBe(2);
    expect(filter.rules).toHaveLength(1);

    const rule = filter.rules[0];
    expect(rule.levelDependent).toBe(true);
    expect(rule.minLvl).toBe(50);
    expect(rule.maxLvl).toBe(80);
  });

  it('parses v2 RarityCondition with legacy fields', () => {
    const filter = parseFilterXml(SAMPLE_V2_FILTER);
    const cond = filter.rules[0].conditions[0];
    if (cond.type === 'RarityCondition') {
      expect(cond.rarity).toEqual(['RARE', 'EXALTED']);
      expect(cond.advanced).toBe(true);
      expect(cond.requiredLegendaryPotential).toBe(3);
    }
  });

  it('throws on invalid XML', () => {
    expect(() => parseFilterXml('<not-a-filter>bad</not-a-filter>')).toThrow();
  });

  it('assigns unique IDs to each rule', () => {
    const filter = parseFilterXml(SAMPLE_V5_FILTER);
    const ids = filter.rules.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('validateFilterXml', () => {
  it('validates correct v5 XML', () => {
    const result = validateFilterXml(SAMPLE_V5_FILTER);
    expect(result.valid).toBe(true);
    expect(result.isLegacy).toBe(false);
  });

  it('validates correct v2 XML as legacy', () => {
    const result = validateFilterXml(SAMPLE_V2_FILTER);
    expect(result.valid).toBe(true);
    expect(result.isLegacy).toBe(true);
  });

  it('returns error for invalid XML', () => {
    const result = validateFilterXml('<bad>data</bad>');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('detectFilterVersion', () => {
  it('detects v5 filter', () => {
    const info = detectFilterVersion(SAMPLE_V5_FILTER);
    expect(info).not.toBeNull();
    expect(info!.version).toBe(5);
    expect(info!.isLegacy).toBe(false);
  });

  it('detects v2 legacy filter', () => {
    const info = detectFilterVersion(SAMPLE_V2_FILTER);
    expect(info).not.toBeNull();
    expect(info!.version).toBe(2);
    expect(info!.isLegacy).toBe(true);
  });
});

describe('XML round-trip (parse → generate → parse)', () => {
  it('preserves filter metadata through round-trip', () => {
    const original = parseFilterXml(SAMPLE_V5_FILTER);
    const xml = generateFilterXml(original);
    const roundTripped = parseFilterXml(xml);

    expect(roundTripped.name).toBe(original.name);
    expect(roundTripped.filterIcon).toBe(original.filterIcon);
    expect(roundTripped.filterIconColor).toBe(original.filterIconColor);
    expect(roundTripped.description).toBe(original.description);
    expect(roundTripped.lootFilterVersion).toBe(5);
  });

  it('preserves rule count through round-trip', () => {
    const original = parseFilterXml(SAMPLE_V5_FILTER);
    const xml = generateFilterXml(original);
    const roundTripped = parseFilterXml(xml);

    expect(roundTripped.rules).toHaveLength(original.rules.length);
  });

  it('preserves rule types and properties through round-trip', () => {
    const original = parseFilterXml(SAMPLE_V5_FILTER);
    const xml = generateFilterXml(original);
    const roundTripped = parseFilterXml(xml);

    for (let i = 0; i < original.rules.length; i++) {
      expect(roundTripped.rules[i].type).toBe(original.rules[i].type);
      expect(roundTripped.rules[i].color).toBe(original.rules[i].color);
      expect(roundTripped.rules[i].isEnabled).toBe(original.rules[i].isEnabled);
      expect(roundTripped.rules[i].emphasized).toBe(original.rules[i].emphasized);
      expect(roundTripped.rules[i].nameOverride).toBe(original.rules[i].nameOverride);
      expect(roundTripped.rules[i].soundId).toBe(original.rules[i].soundId);
      expect(roundTripped.rules[i].beamId).toBe(original.rules[i].beamId);
    }
  });

  it('preserves condition types through round-trip', () => {
    const original = parseFilterXml(SAMPLE_V5_FILTER);
    const xml = generateFilterXml(original);
    const roundTripped = parseFilterXml(xml);

    for (let i = 0; i < original.rules.length; i++) {
      expect(roundTripped.rules[i].conditions.length).toBe(original.rules[i].conditions.length);
      for (let j = 0; j < original.rules[i].conditions.length; j++) {
        expect(roundTripped.rules[i].conditions[j].type).toBe(original.rules[i].conditions[j].type);
      }
    }
  });

  it('preserves affix IDs through round-trip', () => {
    const original = parseFilterXml(SAMPLE_V5_FILTER);
    const xml = generateFilterXml(original);
    const roundTripped = parseFilterXml(xml);

    const origAffix = original.rules[2].conditions[0];
    const rtAffix = roundTripped.rules[2].conditions[0];
    if (origAffix.type === 'AffixCondition' && rtAffix.type === 'AffixCondition') {
      expect(rtAffix.affixes).toEqual(origAffix.affixes);
    }
  });

  it('generates valid XML that can be parsed', () => {
    const filter: ItemFilter = {
      name: 'Generated Filter',
      filterIcon: 3,
      filterIconColor: 5,
      description: 'Test description with <special> chars & more',
      lastModifiedInVersion: '1.3.0',
      lootFilterVersion: 5,
      rules: [
        {
          id: 'test-1',
          type: 'SHOW',
          conditions: [
            {
              type: 'RarityCondition',
              rarity: ['UNIQUE', 'LEGENDARY'],
              minLegendaryPotential: 3,
              maxLegendaryPotential: null,
              minWeaversWill: null,
              maxWeaversWill: null,
            },
          ],
          color: 9,
          isEnabled: true,
          emphasized: true,
          nameOverride: 'GG Item',
          soundId: 5,
          beamId: 3,
          order: 0,
        },
      ],
    };

    const xml = generateFilterXml(filter);
    const parsed = parseFilterXml(xml);

    expect(parsed.name).toBe('Generated Filter');
    expect(parsed.description).toBe('Test description with <special> chars & more');
    expect(parsed.rules).toHaveLength(1);
    expect(parsed.rules[0].type).toBe('SHOW');
    expect(parsed.rules[0].nameOverride).toBe('GG Item');
  });
});
