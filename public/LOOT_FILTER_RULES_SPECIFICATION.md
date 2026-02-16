# Last Epoch Loot Filter Rules & Specifications
# Version: 1.3 (Season 3: Beneath Ancient Skies)
# Last Updated: January 2026
# 
# This document contains complete technical specifications for creating
# Last Epoch loot filters. Designed to be machine-readable for automated
# filter generation while remaining human-readable for reference.

## FILE FORMAT

### XML Structure
- Format: UTF-8 encoded XML
- Root element: <ItemFilter>
- Schema namespace: xmlns:i="http://www.w3.org/2001/XMLSchema-instance"
- Current loot filter version: 5
- File extension: .xml

### Header Fields (Required)
- <n>: Filter name (string)
- <filterIcon>: Icon ID (integer 0-N)
- <filterIconColor>: Color ID (integer 0-N)  
- <description>: Filter description (string)
- <lastModifiedInVersion>: Game version (e.g., "1.0.8.4")
- <lootFilterVersion>: Filter schema version (currently 5)
- <rules>: Container for all Rule elements

---

## FILTER RULES

### Maximum Rules
- Maximum 75 rules per filter
- Rules are processed top-to-bottom
- First matching rule applies (subsequent rules ignored for that item)

### Rule Priority System
**CRITICAL**: Rules higher in the list take priority over rules below them. The rules in the filter must be in reverse order. First rule in the xml file will show up last in game

**Priority Execution**:
1. Rule at position 0 (top) = highest priority
2. Rule at position 1 = second priority
3. ... 
4. Rule at position 74 (bottom) = lowest priority

**Common Pattern**:
```
Top Priority (Position 0-5):
- Show LEGENDARY/SET/UNIQUE/SET/EXALTED (catch-all for valuable items)

Middle Priority (Position 6-70):
- Recolor/Show items with specific affixes
- Show class-specific items
- Show items by level range
- Show items by base type

Bottom Priority (Position 71-74):
- Hide all NORMAL items
- Hide all MAGIC items  
- Hide all RARE items
- HIDE ALL (catch-all)
```

### Rule Structure
```xml
<Rule>
  <type>SHOW|HIDE</type>
  <conditions>
    <!-- One or more Condition elements -->
  </conditions>
  <color>INTEGER</color>
  <isEnabled>BOOLEAN</isEnabled>
  <emphasized>BOOLEAN</emphasized>
  <nameOverride>STRING</nameOverride>
  <SoundId>INTEGER</SoundId>
  <BeamId>INTEGER</BeamId>
  <Order>INTEGER</Order>
  <!-- Deprecated fields maintained for compatibility -->
  <levelDependent_deprecated>false</levelDependent_deprecated>
  <minLvl_deprecated>0</minLvl_deprecated>
  <maxLvl_deprecated>0</maxLvl_deprecated>
</Rule>
```

### Rule Types

**SHOW**
- Makes items visible
- Items display with their normal appearance (unless recolored)
- Takes priority over HIDE rules above it

**HIDE**
- Makes items invisible
- Items still drop but nameplate doesn't show
- Cannot hide items if SHOW rule is higher priority
---

## CONDITIONS

### Condition Limit
- **One of each condition type per rule maximum**
- All conditions in a rule must be satisfied (AND logic)
- Cannot use multiple conditions of the same type

### Available Condition Types

#### 1. AFFIX CONDITION
```xml
<Condition i:type="AffixCondition">
  <affixes>
    <int>0</int>      <!-- Affix ID from game database -->
    <int>671</int>    <!-- Multiple affix IDs supported -->
  </affixes>
  <comparsion>ANY|MORE|LESS|EQUAL</comparsion>
  <comparsionValue>INTEGER</comparsionValue>
  <minOnTheSameItem>INTEGER</minOnTheSameItem>
  <combinedComparsion>ANY|MORE|LESS|EQUAL</combinedComparsion>
  <combinedComparsionValue>INTEGER</combinedComparsionValue>
  <advanced>BOOLEAN</advanced>
</Condition>
```

**Fields**:
- `affixes`: List of affix IDs (use numeric IDs from itemDB)
- `comparsion`: How to match individual affix tiers
  - ANY: Match if affix exists
  - MORE: Tier must be > comparsionValue
  - LESS: Tier must be < comparsionValue
  - EQUAL: Tier must = comparsionValue
- `comparsionValue`: Tier threshold for individual affixes
- `minOnTheSameItem`: Minimum number of listed affixes required on one item
- `combinedComparsion`: How to match total tier sum
- `combinedComparsionValue`: Total tier threshold
- `advanced`: Enable advanced tier filtering

**Examples**:
- Show items with ANY of these affixes: minOnTheSameItem=1
- Show items with at least 2 of these affixes: minOnTheSameItem=2
- Show items where individual affix tier >= 5: comparsion=MORE, comparsionValue=5
- Show items where total affix tiers > 20: combinedComparsion=MORE, combinedComparsionValue=20

#### 2. RARITY CONDITION
```xml
<Condition i:type="RarityCondition">
  <rarity>NORMAL MAGIC RARE EXALTED UNIQUE SET</rarity>
  <minLegendaryPotential i:nil="true" />
  <maxLegendaryPotential i:nil="true" />
  <minWeaversWill i:nil="true" />
  <maxWeaversWill i:nil="true" />
  <!-- Deprecated fields -->
  <advanced_DEPRECATED>false</advanced_DEPRECATED>
  <requiredLegendaryPotential_DEPRECATED>0</requiredLegendaryPotential_DEPRECATED>
  <requiredWeaversWill_DEPRECATED>0</requiredWeaversWill_DEPRECATED>
</Condition>
```

**Rarity Values** (space-separated):
- NORMAL: White items
- MAGIC: Blue items
- RARE: Yellow items  
- EXALTED: Purple items (Tier 6+ affixes)
- UNIQUE: Orange items
- SET: Green items

**Special Properties**:
- `minLegendaryPotential`: Minimum LP (0-4)
- `maxLegendaryPotential`: Maximum LP (0-4)
- `minWeaversWill`: Minimum Weaver's Will
- `maxWeaversWill`: Maximum Weaver's Will

**Examples**:
- All valuable items: "UNIQUE SET EXALTED"
- Common drops only: "NORMAL MAGIC RARE"
- High LP uniques: rarity="UNIQUE", minLegendaryPotential=2

#### 3. SUBTYPE CONDITION (Item Type/Base Type)
```xml
<Condition i:type="SubTypeCondition">
  <type>HELMET BODY_ARMOR GLOVES BELT BOOTS WEAPON OFFHAND JEWELRY IDOL RELIC</type>
  <subTypes>
    <string>ONE_HANDED_SWORD</string>
    <string>TWO_HANDED_AXE</string>
    <string>AMULET</string>
  </subTypes>
</Condition>
```

**Item Type Categories**:
- HELMET
- BODY_ARMOR (Chest)
- GLOVES
- BELT
- BOOTS
- WEAPON (all weapons)
- OFFHAND (Shields, Quivers, Catalysts)
- JEWELRY (Rings, Amulets)
- IDOL (all idol sizes)
- RELIC

**Item Subtypes**:

**Weapons (1H)**:
- ONE_HANDED_SWORD
- ONE_HANDED_AXE
- ONE_HANDED_MACE
- DAGGER
- SCEPTRE
- WAND

**Weapons (2H)**:
- TWO_HANDED_SWORD
- TWO_HANDED_AXE
- TWO_HANDED_MACE
- TWO_HANDED_SPEAR (Polearms)
- TWO_HANDED_STAFF
- BOW
- CROSSBOW

**Off-Hand**:
- SHIELD
- QUIVER
- CATALYST (Off-Hand Catalyst)

**Jewelry**:
- RING
- AMULET
- RELIC

**Idols**:
- SMALL_IDOL_1x1
- MINOR_IDOL_1x1
- HUMBLE_IDOL_2x1
- STOUT_IDOL_1x2
- GRAND_IDOL_3x1
- LARGE_IDOL_1x3
- ORNATE_IDOL_4x1
- HUGE_IDOL_1x4
- ADORNED_IDOL_2x2

#### 4. CLASS REQUIREMENT CONDITION
```xml
<Condition i:type="ClassCondition">
  <classes>
    <ClassRequirement>SENTINEL MAGE ACOLYTE PRIMALIST ROGUE</ClassRequirement>
  </classes>
</Condition>
```

**Class Values** (space-separated):
- SENTINEL
- MAGE  
- ACOLYTE
- PRIMALIST
- ROGUE

**Examples**:
- Sentinel-only items: "SENTINEL"
- Mage or Acolyte items: "MAGE ACOLYTE"

#### 5. LEVEL CONDITION
```xml
<Condition i:type="LevelCondition">
  <type>BELOW_LEVEL|ABOVE_LEVEL|MAX_LEVEL_BELOW_CHARACTER|HIGHEST_USABLE_LEVEL</type>
  <value>INTEGER</value>
</Condition>
```

**Level Types**:
- `BELOW_LEVEL`: Items with required level < value
- `ABOVE_LEVEL`: Items with required level > value
- `MAX_LEVEL_BELOW_CHARACTER`: Items within X levels below character (dynamic)
- `HIGHEST_USABLE_LEVEL`: Items at or below character level (dynamic)

**Examples**:
- Hide low level items: type=BELOW_LEVEL, value=20
- Show endgame items only: type=ABOVE_LEVEL, value=75
- Keep recent upgrades: type=MAX_LEVEL_BELOW_CHARACTER, value=10

---

## VISUAL CUSTOMIZATION

### Color Values
```
0  = Default item color (by rarity)
1  = Gray
2  = Bright Yellow
3  = Yellow
4  = Light Orange
5  = Orange
6  = Light Red
7  = Red
8  = Light Pink
9  = Pink
10 = Dark Purple
11 = Light Purple
12 = Blue
13 = Light Blue
14 = Light Turquoise
15 = Turquoise
16 = Green
17 = Dark Green
```

### Emphasis Options
- `emphasized=true`: Item name appears in ALL CAPS
- `emphasized=false`: Normal case
- Can combine with color changes

### Name Override
- `nameOverride`: Custom display name matching rule
- Replaces original rule name to better describe rule usage
- Leave empty to use original name

### Sound & Beam
- `SoundId`: Play sound when item drops (0 = default)
- `BeamId`: Show visual beam on item (0 = Default)  
- Sound/Beam IDs are game-specific

### Sound ID
```
0 = Default
2 = Shing
3 = Shaker
4 = Zap
5 = Drum
6 = Begin
7 = Fight
8 = Discovery
9 = Inspiration
10 = Anvil
```

### Beam ID
```
0 = Default
2 = Rare
3 = Shaker
4 = Set
5 = Legendary
6 = Key
7 = Exalted
8 = Golden
9 = Obsidian
```
---

## FILTER DESIGN PATTERNS

### Pattern 1: Defensive (Safest for beginners)
```
Priority Order:
1. SHOW all LEGENDARY/SET/UNIQUE/SET/EXALTED (top priority - never hide these)
2. RECOLOR items with desired affixes
3. RECOLOR items by specific base types  
4. HIDE unwanted item types
5. (Optional) HIDE low rarity items (NORMAL MAGIC)
```

**Advantage**: Won't accidentally hide valuable items  
**Disadvantage**: More clutter on screen

### Pattern 2: Aggressive (Advanced users)
```
Priority Order:
1. SHOW all LEGENDARY/SET/UNIQUE/SET/EXALTED (safety net)
2. SHOW items with desired affixes
3. SHOW items with specific base types
4. HIDE ALL other items (bottom of list)
```

**Advantage**: Very clean, only see what you want  
**Disadvantage**: Can miss items if filter is too strict

### Pattern 3: Color-Coded Tiers (Recommended)
```
Priority Order:
1. SHOW LEGENDARY/SET/UNIQUE/SET/EXALTED
2. SHOW with color code (WHITE) items with 4+ desired affixes, tier 6+
3. SHOW with color code (PINK) items with 4 desired affixes
4. SHOW with color code (RED) items with 3 desired affixes  
5. SHOW with color code (ORANGE) items with 2 desired affixes
6. SHOW with color code (YELLOW) items with 1 desired affix
7. HIDE unwanted base types
8. HIDE low level items
9. HIDE NORMAL MAGIC items
```

**Advantage**: Visual tiers for easy item value assessment  
**Disadvantage**: Requires filter maintenance as you progress

---

## SPECIAL AFFIX TYPES

### Season 3 Specific Affixes
- Champion Affixes (700-799 range)
- Experimental Affixes (specific IDs)
- Personal Affixes (specific IDs)
- Weaver's Will Affixes (enhanced versions)

**Weaver Idols**:
- Double Weaver Idol: Has 2 Weaver's Will affixes
- Highly valuable for most builds

---

## BEST PRACTICES

### Rule Organization
1. **Always start with safety net**: SHOW LEGENDARY/SET/UNIQUE/SET/EXALTED at top
2. **Group similar rules**: All affix rules together, all hide rules together
3. **Use descriptive names**: Set nameOverride for complex rules
4. **Document your filter**: Use description field

### Affix Selection
1. **Start broad**: Include many relevant affixes early
2. **Refine over time**: Remove common affixes as you progress
3. **Use tier thresholds**: Filter by affix tier in endgame
4. **Consider multi-affix**: minOnTheSameItem=2+ for valuable combinations

### Level Progression
1. **Early game (1-25)**: Show most items, focus on hiding wrong base types
2. **Mid game (25-60)**: Add affix filters, hide NORMAL items
3. **Late game (60-90)**: Hide MAGIC items, require tier 5+ affixes
4. **Endgame (90+)**: Only show tier 6+, specific bases, high LP uniques

### Testing Your Filter
1. **Disable filter temporarily**: Press X in-game to see all items
2. **Check rule numbers**: Game shows which rule matched each item
3. **Test in different content**: Filters may need adjustment for different activities
4. **Keep backups**: Export filter before major changes

---

## COMMON MISTAKES TO AVOID

### 1. Wrong Rule Order
❌ HIDE ALL at top → Hides everything including uniques
✅ HIDE ALL at bottom → Only hides items not caught by other rules

### 2. Contradictory Conditions
❌ HIDE UNIQUE + SHOW items with specific affix (if affix is on unique, hidden)
✅ SHOW UNIQUE at top, then HIDE other rules below

### 3. Too Strict Too Fast
❌ HIDE ALL NORMAL MAGIC RARE at level 10
✅ Gradually hide rarities as you progress

### 4. Forgetting LP/Weaver Items
❌ Hiding UNIQUE without LP exception
✅ Show UNIQUE with minLegendaryPotential=1

### 5. Not Using Affix Tiers
❌ Showing all items with health affix
✅ Showing items with health affix tier 5+

---

## FILTER MAINTENANCE SCHEDULE

### When to Update Filter

**Every 10 Levels**:
- Increase minimum affix tier requirements
- Hide lower rarity items
- Add level-based conditions

**When Inventory Fills Too Fast**:
- Increase minOnTheSameItem value
- Hide more rarity tiers
- Increase tier requirements

**When You Can't Afford Shatter Runes**:
- Hide lower value items
- Only show items you'll use immediately

**When Build Changes**:
- Update affix list
- Change base type filters
- Adjust class requirements

---

## EXAMPLE FILTER TEMPLATES

### Template 1: Fresh Character (Level 1-25)
```xml
Rule 1: SHOW UNIQUE SET EXALTED (top priority)
Rule 2: HIDE wrong weapon types for your build
Rule 3: HIDE wrong armor types (if applicable)
Rule 4: SHOW with color code items with 1+ desired affixes
```

### Template 2: Leveling (Level 25-75)  
```xml
Rule 1: SHOW UNIQUE SET EXALTED
Rule 2: SHOW with color code (4+ affixes, tier 5+) - WHITE
Rule 3: SHOW with color code (3+ affixes) - RED
Rule 4: SHOW with color code (2+ affixes) - ORANGE  
Rule 5: SHOW with color code (1+ affix) - YELLOW
Rule 6: HIDE wrong base types
Rule 7: HIDE items below character level -10
Rule 8: HIDE NORMAL items
```

### Template 3: Endgame (Level 75+)
```xml
Rule 1: SHOW UNIQUE with LP 2+
Rule 2: SHOW SET items
Rule 3: SHOW EXALTED with tier 7 affixes
Rule 4: SHOW with color code EXALTED with 3+ desired affixes, tier 6+
Rule 5: SHOW specific base types for legendary crafting
Rule 6: HIDE all other items
```

---

## TECHNICAL NOTES

### Encoding
- Files must be UTF-8 encoded
- Special characters in descriptions need XML encoding:
  - & → &amp;
  - < → &lt;
  - > → &gt;
  - " → &quot;
  - ' → &apos;

### Backwards Compatibility
- Deprecated fields maintained for older game versions
- New fields may have i:nil="true" for null values
- Always set lootFilterVersion=5 for current patch

### File Location
**Windows**:
```
C:\Users\{Username}\AppData\LocalLow\Eleventh Hour Games\Last Epoch\Filters
```

**Import Methods**:
1. Copy XML file to Filters folder
2. Paste clipboard contents in-game (Shift+F → + → Paste)

---

## VALIDATION CHECKLIST

Before using a filter, verify:
- [ ] XML is valid (well-formed tags)
- [ ] lootFilterVersion is set to 5
- [ ] LEGENDARY/SET/UNIQUE/SET/EXALTED SHOW rule at top (if using HIDE rules)
- [ ] No duplicate condition types in same rule
- [ ] Rule order makes logical sense
- [ ] Affix IDs are valid (0-946 range currently)
- [ ] Item subtype names match exactly (case-sensitive)
- [ ] Color/Sound/Beam IDs are within valid range

---

## VERSION HISTORY

**v5 (Patch 1.3 - Season 3)**:
- Added Weaver's Will support
- Added Champion/Experimental/Personal affixes
- Added minWeaversWill/maxWeaversWill to RarityCondition

**v4 (Patch 1.2)**:
- Added Legendary Potential filtering
- Enhanced affix tier filtering

**v3 (Patch 1.1)**:
- Initial public release
- Basic condition types

---

## AUTOMATION NOTES

When generating filters programmatically:
1. Always include XML declaration: <?xml version="1.0" encoding="utf-8"?>
2. Include namespace: xmlns:i="http://www.w3.org/2001/XMLSchema-instance"
3. Set proper Order values (0-74)
4. Initialize deprecated fields to defaults
5. Use i:nil="true" for null optional fields
6. Validate affix IDs against current database
7. Test generated filter in-game before distribution

---

END OF SPECIFICATION
