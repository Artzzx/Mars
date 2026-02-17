# Last Epoch Loot Filter Rules & Specifications
# Version: 1.3.5 (Comprehensive Edition)
# Last Updated: February 2026
#
# Complete technical specification combining original documentation
# with verified structures from actual working filters.

## FILE FORMAT

### XML Structure
- Format: UTF-8 encoded XML
- Root element: `<ItemFilter>`
- Schema namespace: `xmlns:i="http://www.w3.org/2001/XMLSchema-instance"`
- Current loot filter version: 5
- Current game version: 1.3.5
- File extension: .xml

### Header Template
```xml
<ItemFilter xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
  <n>Filter Name</n>
  <filterIcon>0</filterIcon>
  <filterIconColor>0</filterIconColor>  
  <description>Description text or empty</description>
  <lastModifiedInVersion>1.3.5</lastModifiedInVersion>
  <lootFilterVersion>5</lootFilterVersion>
  <rules>
    <!-- Rule elements here -->
  </rules>
</ItemFilter>
```

---

## FILTER RULES

### Maximum Rules
- Maximum 75 rules per filter
- Rules are processed top-to-bottom by Order value
- First matching rule applies (subsequent rules ignored for that item)

### Rule Priority System
**CRITICAL**: Rules are evaluated in Order from LOWEST to HIGHEST number.

**Priority Execution**:
- Order=0 → HIGHEST priority (evaluated FIRST)
- Order=1 → Second priority
- Order=74 → LOWEST priority (evaluated LAST)

**Common Pattern**:
```
Order 0-5:   Show LEGENDARY/SET/UNIQUE/EXALTED (safety net)
Order 6-70:  Recolor/Show items with specific affixes/types
Order 71-74: Hide low value items (NORMAL, MAGIC, catch-all)
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
  <nameOverride>STRING or empty</nameOverride>
  <SoundId>INTEGER</SoundId>
  <BeamId>INTEGER</BeamId>
  <Order>INTEGER</Order>
</Rule>
```

---

## CONDITION TYPES

### General Rules
- Multiple conditions in one rule = ALL must match (AND logic)
- **One of each condition type per rule maximum**
  - **EXCEPTION**: AffixCondition can appear multiple times in a single rule
- Use `i:nil="true"` for optional null fields
- Empty tags: `<nameOverride />` or `<subTypes />`

---

### 1. AffixCondition

**MOST IMPORTANT** condition for endgame filtering. Filters by specific affix IDs and tiers.

**UNIQUE PROPERTY**: AffixCondition is the ONLY condition type that can appear multiple times in a single rule. All other condition types are limited to one per rule.

```xml
<Condition i:type="AffixCondition">
  <affixes>
    <int>50</int>
    <int>671</int>
  </affixes>
  <comparsion>COMPARISON_TYPE</comparsion>
  <comparsionValue>INTEGER</comparsionValue>
  <minOnTheSameItem>INTEGER</minOnTheSameItem>
  <combinedComparsion>COMPARISON_TYPE</combinedComparsion>
  <combinedComparsionValue>INTEGER</combinedComparsionValue>
  <advanced>BOOLEAN</advanced>
</Condition>
```

**Fields (All Required):**

**affixes** (Required)
- List of affix IDs (numeric, 0-946 range)
- Get IDs from itemDB database
- Multiple affixes = OR logic (match ANY of these)
- Example: `<affixes><int>50</int><int>120</int></affixes>`

**comparsion** (Required)
Individual affix tier comparison type:
- `ANY`: Match if affix exists (ignore tier)
- `EQUAL`: Tier must equal comparsionValue
- `LESS`: Tier must be < comparsionValue
- `LESS_OR_EQUAL`: Tier must be ≤ comparsionValue
- `MORE`: Tier must be > comparsionValue
- `MORE_OR_EQUAL`: Tier must be ≥ comparsionValue

**comparsionValue** (Required)
- Integer: Tier threshold for individual affixes
- Tiers range: 1-7 (tier 1 = lowest, tier 7 = Exalted/highest)
- Set to 1 when using ANY comparison

**minOnTheSameItem** (Required)
- Integer: Minimum number of listed affixes required on one item
- Example: 1 = at least one affix must match
- Example: 2 = at least two affixes must match
- Example: 3 = at least three affixes must match

**combinedComparsion** (Required)
Total tier sum comparison type:
- `ANY`: Ignore total tier sum
- `EQUAL`: Sum must equal combinedComparsionValue
- `LESS`: Sum must be < combinedComparsionValue
- `LESS_OR_EQUAL`: Sum must be ≤ combinedComparsionValue
- `MORE`: Sum must be > combinedComparsionValue
- `MORE_OR_EQUAL`: Sum must be ≥ combinedComparsionValue

**combinedComparsionValue** (Required)
- Integer: Total tier threshold across all matching affixes
- Maximum possible: 28 (7 tiers × 4 affixes)
- Example: 20 = sum of all matching affix tiers must meet comparison
- Set to 1 when using ANY comparison

**advanced** (Required)
- Boolean: `true` or `false`
- `false`: Simple mode - only checks if affixes exist (ignores tier comparisons)
- `true`: Advanced mode - enables tier-based filtering (shows comparison options in UI)
- Use `false` for basic affix detection
- Use `true` when you need tier filtering (comparsion/combinedComparsion)

**Tier Limits:**
- Maximum tier per individual affix: **7** (tier 7 = Exalted)
- Maximum total combined tiers: **28** (7 tiers × 4 affixes max)

**Examples:**

```xml
<!-- Simple mode: Show items with these affixes (ignore tier) -->
<Condition i:type="AffixCondition">
  <affixes>
    <int>50</int>
  </affixes>
  <comparsion>MORE_OR_EQUAL</comparsion>
  <comparsionValue>1</comparsionValue>
  <minOnTheSameItem>1</minOnTheSameItem>
  <combinedComparsion>MORE_OR_EQUAL</combinedComparsion>
  <combinedComparsionValue>1</combinedComparsionValue>
  <advanced>false</advanced>
</Condition>

<!-- Advanced mode: Show items with ANY of these affixes (ignore tier) -->
<Condition i:type="AffixCondition">
  <affixes>
    <int>45</int>
    <int>120</int>
    <int>671</int>
  </affixes>
  <comparsion>ANY</comparsion>
  <comparsionValue>1</comparsionValue>
  <minOnTheSameItem>1</minOnTheSameItem>
  <combinedComparsion>ANY</combinedComparsion>
  <combinedComparsionValue>1</combinedComparsionValue>
  <advanced>true</advanced>
</Condition>

<!-- Advanced mode: Show items with tier >= 6 on these affixes -->
<Condition i:type="AffixCondition">
  <affixes>
    <int>45</int>
    <int>120</int>
  </affixes>
  <comparsion>MORE_OR_EQUAL</comparsion>
  <comparsionValue>6</comparsionValue>
  <minOnTheSameItem>1</minOnTheSameItem>
  <combinedComparsion>ANY</combinedComparsion>
  <combinedComparsionValue>1</combinedComparsionValue>
  <advanced>true</advanced>
</Condition>

<!-- Advanced mode: Show items with tier exactly 7 (Exalted tier) -->
<Condition i:type="AffixCondition">
  <affixes>
    <int>50</int>
  </affixes>
  <comparsion>EQUAL</comparsion>
  <comparsionValue>7</comparsionValue>
  <minOnTheSameItem>1</minOnTheSameItem>
  <combinedComparsion>ANY</combinedComparsion>
  <combinedComparsionValue>1</combinedComparsionValue>
  <advanced>true</advanced>
</Condition>

<!-- Advanced mode: Show items with 2+ affixes AND total tiers >= 20 -->
<Condition i:type="AffixCondition">
  <affixes>
    <int>45</int>
    <int>120</int>
    <int>671</int>
  </affixes>
  <comparsion>ANY</comparsion>
  <comparsionValue>1</comparsionValue>
  <minOnTheSameItem>2</minOnTheSameItem>
  <combinedComparsion>MORE_OR_EQUAL</combinedComparsion>
  <combinedComparsionValue>20</combinedComparsionValue>
  <advanced>true</advanced>
</Condition>

<!-- Multiple AffixConditions in one rule (ONLY AffixCondition allows this) -->
<conditions>
  <Condition i:type="AffixCondition">
    <affixes>
      <int>45</int>
    </affixes>
    <comparsion>MORE_OR_EQUAL</comparsion>
    <comparsionValue>6</comparsionValue>
    <minOnTheSameItem>1</minOnTheSameItem>
    <combinedComparsion>ANY</combinedComparsion>
    <combinedComparsionValue>1</combinedComparsionValue>
    <advanced>true</advanced>
  </Condition>
  <Condition i:type="AffixCondition">
    <affixes>
      <int>120</int>
    </affixes>
    <comparsion>MORE_OR_EQUAL</comparsion>
    <comparsionValue>5</comparsionValue>
    <minOnTheSameItem>1</minOnTheSameItem>
    <combinedComparsion>ANY</combinedComparsion>
    <combinedComparsionValue>1</combinedComparsionValue>
    <advanced>true</advanced>
  </Condition>
  <!-- Item must have BOTH: affix 45 at tier 6+ AND affix 120 at tier 5+ -->
</conditions>
```

**Comparison Operators Summary:**
```
ANY            = Ignore value, just check existence
EQUAL          = Value must be exactly equal
LESS           = Value must be strictly less than (<)
LESS_OR_EQUAL  = Value must be less than or equal (≤)
MORE           = Value must be strictly greater than (>)
MORE_OR_EQUAL  = Value must be greater than or equal (≥)
```

---

### 2. RarityCondition

Filters by rarity tier, Legendary Potential, and Weaver's Will.

```xml
<Condition i:type="RarityCondition">
  <rarity>RARITY_VALUE</rarity>
  <minLegendaryPotential i:nil="true" />
  <maxLegendaryPotential i:nil="true" />
  <minWeaversWill i:nil="true" />
  <maxWeaversWill i:nil="true" />
</Condition>
```

**Fields:**

**rarity** (Optional)
- Values: `NORMAL`, `MAGIC`, `RARE`, `EXALTED`, `UNIQUE`, `SET`, `LEGENDARY`
- Can be empty (`<rarity />`) when using LP/WW filters only

**minLegendaryPotential / maxLegendaryPotential**
- Integer: 0-4
- Use `i:nil="true"` for no limit
- Only applies to UNIQUE items

**minWeaversWill / maxWeaversWill**
- Integer: 0-28
- Use `i:nil="true"` for no limit
- Season 3 mechanic

**Examples:**
```xml
<!-- All UNIQUE items -->
<Condition i:type="RarityCondition">
  <rarity>UNIQUE</rarity>
  <minLegendaryPotential i:nil="true" />
  <maxLegendaryPotential i:nil="true" />
  <minWeaversWill i:nil="true" />
  <maxWeaversWill i:nil="true" />
</Condition>

<!-- UNIQUE with 2+ LP -->
<Condition i:type="RarityCondition">
  <rarity>UNIQUE</rarity>
  <minLegendaryPotential>2</minLegendaryPotential>
  <maxLegendaryPotential>4</maxLegendaryPotential>
  <minWeaversWill i:nil="true" />
  <maxWeaversWill i:nil="true" />
</Condition>

<!-- Any rarity with high Weaver's Will -->
<Condition i:type="RarityCondition">
  <rarity />
  <minLegendaryPotential i:nil="true" />
  <maxLegendaryPotential i:nil="true" />
  <minWeaversWill>20</minWeaversWill>
  <maxWeaversWill>28</maxWeaversWill>
</Condition>
```

---

### 3. AffixCountCondition

Filters by number of prefixes/suffixes and sealed status.

```xml
<Condition i:type="AffixCountCondition">
  <minPrefixes i:nil="true" />
  <maxPrefixes i:nil="true" />
  <minSuffixes i:nil="true" />
  <maxSuffixes i:nil="true" />
  <sealedType>SEALED_TYPE</sealedType>
</Condition>
```

**Fields:**

**minPrefixes / maxPrefixes** (Optional)
- Integer: 0-4
- Use `i:nil="true"` for no limit

**minSuffixes / maxSuffixes** (Optional)  
- Integer: 0-4
- Use `i:nil="true"` for no limit

**sealedType** (Required)
- Values: `Any`, `NotSealed`, `Sealed`, `SealedPrefix`, `SealedSuffix`

**Examples:**
```xml
<!-- Items with 4 prefixes -->
<Condition i:type="AffixCountCondition">
  <minPrefixes>4</minPrefixes>
  <maxPrefixes>4</maxPrefixes>
  <minSuffixes i:nil="true" />
  <maxSuffixes i:nil="true" />
  <sealedType>Any</sealedType>
</Condition>

<!-- Sealed items only -->
<Condition i:type="AffixCountCondition">
  <minPrefixes i:nil="true" />
  <maxPrefixes i:nil="true" />
  <minSuffixes i:nil="true" />
  <maxSuffixes i:nil="true" />
  <sealedType>Sealed</sealedType>
</Condition>
```

---

### 4. SubTypeCondition

Filters by equipment type and specific item bases.

```xml
<Condition i:type="SubTypeCondition">
  <type>
    <EquipmentType>EQUIPMENT_TYPE</EquipmentType>
  </type>
  <subTypes />
</Condition>
```

**EquipmentType Values:**

**One-Handed Weapons:**
- `ONE_HANDED_AXE`
- `ONE_HANDED_MACES`
- `ONE_HANDED_SCEPTRE`
- `ONE_HANDED_SWORD`
- `WAND`
- `ONE_HANDED_DAGGER`

**Two-Handed Weapons:**
- `TWO_HANDED_AXE`
- `TWO_HANDED_MACE`
- `TWO_HANDED_SWORD`
- `TWO_HANDED_STAFF`
- `TWO_HANDED_SPEAR`
- `BOW`

**Off-Hand:**
- `CATALYST`
- `SHIELD`
- `QUIVER`

**Armor:**
- `HELMET`
- `BODY_ARMOR`
- `BELT`
- `BOOTS`
- `GLOVES`

**Accessories:**
- `AMULET`
- `RING`
- `RELIC`

**Idols:**
- `IDOL_1x1_ETERRA`
- `IDOL_1x1_LAGON`
- `IDOL_2x1`
- `IDOL_1x2`
- `IDOL_3x1`
- `IDOL_1x3`
- `IDOL_4x1`
- `IDOL_1x4`
- `IDOL_2x2`

**subTypes** (Optional)
- Array of specific item base IDs (subTypeId values)
- Empty `<subTypes />` = all sub-types
- Specific: `<subTypes><int>0</int><int>5</int></subTypes>`

**Examples:**
```xml
<!-- All helmets -->
<Condition i:type="SubTypeCondition">
  <type>
    <EquipmentType>HELMET</EquipmentType>
  </type>
  <subTypes />
</Condition>

<!-- Specific helmet bases -->
<Condition i:type="SubTypeCondition">
  <type>
    <EquipmentType>HELMET</EquipmentType>
  </type>
  <subTypes>
    <int>0</int>
    <int>5</int>
  </subTypes>
</Condition>
```

---

### 5. ClassCondition

Filters by class requirement.

```xml
<Condition i:type="ClassCondition">
  <req>CLASS_NAME</req>
</Condition>
```

**req Values:**
- `Primalist`
- `Mage`
- `Sentinel`
- `Acolyte`
- `Rogue`

**Example:**
```xml
<Condition i:type="ClassCondition">
  <req>Sentinel</req>
</Condition>
```

---

### 6. CharacterLevelCondition

Filters based on character level range.

```xml
<Condition i:type="CharacterLevelCondition">
  <minimumLvl>INTEGER</minimumLvl>
  <maximumLvl>INTEGER</maximumLvl>
</Condition>
```

**Fields:**
- `minimumLvl`: Minimum character level (0 = no minimum)
- `maximumLvl`: Maximum character level (0 = no maximum)

**Example:**
```xml
<!-- Character level 50-75 -->
<Condition i:type="CharacterLevelCondition">
  <minimumLvl>50</minimumLvl>
  <maximumLvl>75</maximumLvl>
</Condition>
```

---

### 7. LevelCondition

Filters items by level relative to character level.

```xml
<Condition i:type="LevelCondition">
  <treshold>INTEGER</treshold>
  <type>LEVEL_TYPE</type>
</Condition>
```

**type Values:**
- `BELOW_LEVEL`: Item level below threshold
- `ABOVE_LEVEL`: Item level above threshold
- `MAX_LVL_BELOW_CHARACTER_LEVEL`: Item max level X below character level
- `HIGHEST_USABLE_LEVEL`: Items at highest usable level

**Examples:**
```xml
<!-- Items below level 50 -->
<Condition i:type="LevelCondition">
  <treshold>50</treshold>
  <type>BELOW_LEVEL</type>
</Condition>

<!-- Items 10 levels below character -->
<Condition i:type="LevelCondition">
  <treshold>10</treshold>
  <type>MAX_LVL_BELOW_CHARACTER_LEVEL</type>
</Condition>
```

---

### 8. FactionCondition

Filters faction-specific items.

```xml
<Condition i:type="FactionCondition">
  <EligibleFactions>
    <FactionID>FACTION_NAME</FactionID>
  </EligibleFactions>
</Condition>
```

**FactionID Values:**
- `CircleOfFortune`
- `MerchantsGuild`

**Example:**
```xml
<Condition i:type="FactionCondition">
  <EligibleFactions>
    <FactionID>CircleOfFortune</FactionID>
  </EligibleFactions>
</Condition>
```

---

### 9. KeysCondition

Filters keys and dungeon-related items.

```xml
<Condition i:type="KeysCondition">
  <NonEquippableItemFilterFlags>FLAG_VALUE</NonEquippableItemFilterFlags>
</Condition>
```

**NonEquippableItemFilterFlags Values:**
- `ArenaKeys`
- `DungeonKeys`
- `DungeonCharms`
- `LizardTails`
- `HarbingerEye`
- `PrimordialMaterials`

**Example:**
```xml
<Condition i:type="KeysCondition">
  <NonEquippableItemFilterFlags>DungeonKeys</NonEquippableItemFilterFlags>
</Condition>
```

---

### 10. CraftingMaterialsCondition

Filters crafting materials.

```xml
<Condition i:type="CraftingMaterialsCondition">
  <NonEquippableItemFilterFlags>FLAG_VALUE</NonEquippableItemFilterFlags>
</Condition>
```

**NonEquippableItemFilterFlags Values:**
- `CommonShards`
- `CommonRunes`
- `CommonGlyphs`
- `RareShards`
- `RareRunes`
- `RareGlyphs`

**Example:**
```xml
<Condition i:type="CraftingMaterialsCondition">
  <NonEquippableItemFilterFlags>RareGlyphs</NonEquippableItemFilterFlags>
</Condition>
```

---

### 11. ResonancesCondition

Filters resonance items.

```xml
<Condition i:type="ResonancesCondition">
  <NonEquippableItemFilterFlags>FLAG_VALUE</NonEquippableItemFilterFlags>
</Condition>
```

**NonEquippableItemFilterFlags Values:**
- `GoldResonance`
- `ObsidianResonance`

**Example:**
```xml
<Condition i:type="ResonancesCondition">
  <NonEquippableItemFilterFlags>GoldResonance</NonEquippableItemFilterFlags>
</Condition>
```

---

### 12. WovenEchoesCondition

Filters Woven Echoes by rank.

```xml
<Condition i:type="WovenEchoesCondition">
  <NonEquippableItemFilterFlags>FLAG_VALUE</NonEquippableItemFilterFlags>
</Condition>
```

**NonEquippableItemFilterFlags Values:**
- `WovenEchoesRank1` through `WovenEchoesRank10`
- `WovenEchoesUnpurchasable`

**Example:**
```xml
<Condition i:type="WovenEchoesCondition">
  <NonEquippableItemFilterFlags>WovenEchoesRank10</NonEquippableItemFilterFlags>
</Condition>
```

---

## VISUAL CUSTOMIZATION

### Color Values
```
0  = Default (by rarity)
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

### Sound IDs
```
0  = Default
2  = Shing
3  = Shaker
4  = Zap
5  = Drum
6  = Begin
7  = Fight
8  = Discovery
9  = Inspiration
10 = Anvil
```

### Beam IDs
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

### Emphasis
- `emphasized=true`: Item name in ALL CAPS
- `emphasized=false`: Normal case

---

## FILTER DESIGN PATTERNS

### Pattern 1: Defensive (Safest)
```
Priority Order:
1. SHOW LEGENDARY/SET/UNIQUE/EXALTED (top priority)
2. RECOLOR items with desired affixes
3. RECOLOR items by base types  
4. HIDE unwanted item types
5. HIDE low rarity items
```
**Pros**: Won't miss valuable items  
**Cons**: More screen clutter

### Pattern 2: Aggressive (Advanced)
```
Priority Order:
1. SHOW LEGENDARY/SET/UNIQUE/EXALTED (safety net)
2. SHOW items with desired affixes
3. SHOW specific base types
4. HIDE ALL other items
```
**Pros**: Very clean  
**Cons**: Can miss items if too strict

### Pattern 3: Color-Coded Tiers (Recommended)
```
Priority Order:
1. SHOW LEGENDARY/SET/UNIQUE/EXALTED
2. SHOW WHITE: 4+ affixes, tier 6+
3. SHOW PINK: 4 affixes
4. SHOW RED: 3 affixes  
5. SHOW ORANGE: 2 affixes
6. SHOW YELLOW: 1 affix
7. HIDE unwanted bases
8. HIDE low level items
9. HIDE NORMAL MAGIC
```
**Pros**: Visual tier assessment  
**Cons**: Requires maintenance

---

## BEST PRACTICES

### Rule Organization
1. **Safety net first**: SHOW valuable rarities at top (Order 0-5)
2. **Group similar rules**: All affix rules together
3. **Use nameOverride**: Describe complex rules
4. **Document**: Use description field

### Affix Selection
1. **Start broad**: Include many relevant affixes
2. **Refine over time**: Remove common affixes
3. **Use tier thresholds**: Filter by tier in endgame
4. **Multi-affix combos**: minOnTheSameItem=2+

### Level Progression
- **Early (1-25)**: Show most items, hide wrong bases
- **Mid (25-60)**: Add affix filters, hide NORMAL
- **Late (60-90)**: Hide MAGIC, require tier 5+
- **Endgame (90+)**: Tier 6+ only, specific bases, high LP

---

## COMMON MISTAKES

### ❌ Wrong Priority Order
**Bad**: HIDE ALL at Order 0 → hides everything  
**Good**: HIDE ALL at Order 74 → only hides leftovers

### ❌ Contradictory Conditions
**Bad**: HIDE UNIQUE + SHOW specific affix (if on unique, hidden)  
**Good**: SHOW UNIQUE at top, HIDE rules below

### ❌ Too Strict Too Fast
**Bad**: HIDE ALL NORMAL MAGIC RARE at level 10  
**Good**: Gradually hide as you progress

### ❌ Forgetting LP/Weaver
**Bad**: Hiding UNIQUE without LP check  
**Good**: Show UNIQUE with minLegendaryPotential=1

---

## MAINTENANCE SCHEDULE

### Every 10 Levels
- Increase minimum affix tier
- Hide lower rarities
- Add level-based conditions

### When Inventory Fills
- Increase minOnTheSameItem
- Hide more rarities
- Increase tier requirements

### When Build Changes
- Update affix list
- Change base type filters
- Adjust class requirements

---

## EXAMPLE TEMPLATES

### Fresh Character (1-25)
```xml
Order 0: SHOW UNIQUE SET EXALTED
Order 10: HIDE wrong weapon types
Order 20: SHOW items with 1+ desired affix
```

### Leveling (25-75)
```xml
Order 0: SHOW UNIQUE SET EXALTED
Order 5: SHOW WHITE (4+ affixes, tier 5+)
Order 10: SHOW RED (3+ affixes)
Order 15: SHOW ORANGE (2+ affixes)
Order 20: SHOW YELLOW (1+ affix)
Order 60: HIDE wrong bases
Order 65: HIDE level -10
Order 70: HIDE NORMAL
```

### Endgame (75+)
```xml
Order 0: SHOW UNIQUE with LP 2+
Order 5: SHOW SET
Order 10: SHOW EXALTED tier 7
Order 15: SHOW EXALTED (3+ affixes, tier 6+)
Order 20: SHOW specific bases for crafting
Order 70: HIDE ALL others
```

---

## TECHNICAL NOTES

### Encoding
- UTF-8 required
- XML special characters:
  - `&` → `&amp;`
  - `<` → `&lt;`
  - `>` → `&gt;`

### File Location (Windows)
```
C:\Users\{Username}\AppData\LocalLow\Eleventh Hour Games\Last Epoch\Filters
```

### Import Methods
1. Copy XML to Filters folder
2. Paste in-game: Shift+F → + → Paste

---

## VALIDATION CHECKLIST

- [ ] UTF-8 encoded
- [ ] lootFilterVersion = 5
- [ ] lastModifiedInVersion = 1.3.5
- [ ] Max 75 rules
- [ ] Order values 0-74
- [ ] No duplicate Order values
- [ ] All required fields present
- [ ] i:type matches condition structure
- [ ] Null values use i:nil="true"
- [ ] Empty tags: `<tag />`
- [ ] Boolean lowercase: `true`/`false`
- [ ] Only one of each condition type per rule (except AffixCondition)

---

## DATA STRUCTURES FOR CODING

```python
RARITIES = ["NORMAL", "MAGIC", "RARE", "EXALTED", "UNIQUE", "SET", "LEGENDARY"]
SEALED_TYPES = ["Any", "NotSealed", "Sealed", "SealedPrefix", "SealedSuffix"]
CLASSES = ["Primalist", "Mage", "Sentinel", "Acolyte", "Rogue"]
FACTIONS = ["CircleOfFortune", "MerchantsGuild"]
LEVEL_TYPES = ["BELOW_LEVEL", "ABOVE_LEVEL", "MAX_LVL_BELOW_CHARACTER_LEVEL", "HIGHEST_USABLE_LEVEL"]
COMPARISONS = ["ANY", "EQUAL", "LESS", "LESS_OR_EQUAL", "MORE", "MORE_OR_EQUAL"]

EQUIPMENT_TYPES = {
    "one_handed": ["ONE_HANDED_AXE", "ONE_HANDED_MACES", "ONE_HANDED_SCEPTRE", 
                   "ONE_HANDED_SWORD", "WAND", "ONE_HANDED_DAGGER"],
    "two_handed": ["TWO_HANDED_AXE", "TWO_HANDED_MACE", "TWO_HANDED_SWORD", 
                   "TWO_HANDED_STAFF", "TWO_HANDED_SPEAR", "BOW"],
    "off_hand": ["CATALYST", "SHIELD", "QUIVER"],
    "armor": ["HELMET", "BODY_ARMOR", "BELT", "BOOTS", "GLOVES"],
    "accessories": ["AMULET", "RING", "RELIC"],
    "idols": ["IDOL_1x1_ETERRA", "IDOL_1x1_LAGON", "IDOL_2x1", "IDOL_1x2", 
              "IDOL_3x1", "IDOL_1x3", "IDOL_4x1", "IDOL_1x4", "IDOL_2x2"]
}
```

---

## AUTOMATION NOTES

When generating filters:
1. Include XML declaration: `<?xml version="1.0" encoding="utf-8"?>`
2. Include namespace: `xmlns:i="http://www.w3.org/2001/XMLSchema-instance"`
3. Set Order values 0-74
4. Use `i:nil="true"` for nulls
5. Validate affix IDs (0-946 range)
6. Test in-game before distribution

---

*Complete specification combining original documentation with verified structures from Last Epoch 1.3.5 working filters.*