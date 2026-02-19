"""
Rule Templates for Last Epoch Loot Filter Backend

Contains strictness configurations, color schemes, and rule generation templates.
"""

from typing import List, Dict, Any, Optional
from models import (
    FilterRule, RuleCondition, RuleType, Rarity, StrictnessLevel,
    CharacterClass, EquipmentType, StrictnessConfig, DamageType
)


# ============================================================================
# Color Definitions
# ============================================================================

FILTER_COLORS = {
    "white": 0,
    "gray": 1,
    "bright_yellow": 2,
    "yellow": 3,
    "light_orange": 4,
    "orange": 5,
    "light_red": 6,
    "red": 7,
    "light_pink": 8,
    "pink": 9,
    "dark_purple": 10,
    "light_purple": 11,
    "blue": 12,
    "light_blue": 13,
    "light_turquoise": 14,
    "turquoise": 15,
    "green": 16,
    "dark_green": 17,
}

# Value-based color scheme
VALUE_COLORS = {
    "legendary": 7,      # Red - Legendary items
    "essential": 5,      # Orange - Essential/top tier affixes
    "high": 4,           # Light Orange - High priority
    "medium": 2,         # Bright Yellow - Medium priority
    "low": 16,           # Green - Low priority
    "unique": 10,        # Dark Purple - Uniques
    "exalted": 11,       # Light Purple - Exalted
    "set": 13,           # Light Blue - Set items
    "rare": 3,           # Yellow - Rares
    "magic": 0,          # White - Magic
    "normal": 1,         # Gray - Normal
    "hide": 1,           # Gray - Items to hide
}

# Sound effects
FILTER_SOUNDS = {
    0: 'Default',
    2: 'Shing',
    3: 'Shaker',
    4: 'Zap',
    5: 'Drum',
    6: 'Begin',
    7: 'Fight',
    8: 'Discovery',
    9: 'Inspiration',
    10: 'Anvil',
}

# Beam effects
FILTER_BEAMS = {
    0: 'Default',
    2: 'Rare',
    3: 'Shaker',
    4: 'Set',
    5: 'Legendary',
    6: 'Key',
    7: 'Exalted',
    8: 'Golden',
    9: 'Obsidian',
}


# ============================================================================
# Strictness Configurations
# ============================================================================

STRICTNESS_CONFIGS: Dict[str, StrictnessConfig] = {
    "regular": StrictnessConfig(
        id="regular",
        name="Regular",
        description="Recommended filter-strictness for leveling season-starters. "
                   "Progressively hides the worst items & highlights potential upgrades.",
        order=0,
        showRarities=[Rarity.NORMAL, Rarity.MAGIC, Rarity.RARE, Rarity.EXALTED,
                     Rarity.UNIQUE, Rarity.SET, Rarity.LEGENDARY],
        hideRarities=[],
        minLegendaryPotential=0,
        minWeaversWill=0,
        minExaltedTier=5,
        showRaresWithAffixes=True,
        minAffixMatches=1,
        idolAffixRequirement="any",
        showNormalBases=True,
        showMagicItems=True,
        hideNormalAfterLevel=25,
        hideMagicAfterLevel=50,
        hideRareAfterLevel=100,
    ),
    "strict": StrictnessConfig(
        id="strict",
        name="Strict",
        description="Recommended for start of Empowered Monolith. "
                   "Hides most Uniques without significant LP/WW. Hides most Rares. Hides Set Items.",
        order=1,
        showRarities=[Rarity.EXALTED, Rarity.UNIQUE, Rarity.LEGENDARY],
        hideRarities=[Rarity.NORMAL, Rarity.MAGIC, Rarity.SET],
        minLegendaryPotential=1,
        minWeaversWill=5,
        minExaltedTier=6,
        showRaresWithAffixes=True,
        minAffixMatches=2,
        idolAffixRequirement="one_valued",
        showNormalBases=False,
        showMagicItems=False,
        hideNormalAfterLevel=1,
        hideMagicAfterLevel=1,
        hideRareAfterLevel=75,
    ),
    "very-strict": StrictnessConfig(
        id="very-strict",
        name="Very Strict",
        description="Recommended to focus on Tier 7 Items. High LP Uniques. "
                   "Hides most Tier 6 Exalteds. Shows best Exalted Bases. Hides Sets.",
        order=2,
        showRarities=[Rarity.EXALTED, Rarity.UNIQUE, Rarity.LEGENDARY],
        hideRarities=[Rarity.NORMAL, Rarity.MAGIC, Rarity.RARE, Rarity.SET],
        minLegendaryPotential=2,
        minWeaversWill=10,
        minExaltedTier=7,
        showRaresWithAffixes=False,
        minAffixMatches=3,
        idolAffixRequirement="two_valued",
        showNormalBases=False,
        showMagicItems=False,
        hideNormalAfterLevel=1,
        hideMagicAfterLevel=1,
        hideRareAfterLevel=1,
    ),
    "uber-strict": StrictnessConfig(
        id="uber-strict",
        name="Uber Strict",
        description="Recommended for Endgame: High LP Uniques. Strict Idols. "
                   "Hides Tier 6 Exalteds. Designed for optimized gameplay.",
        order=3,
        showRarities=[Rarity.EXALTED, Rarity.UNIQUE, Rarity.LEGENDARY],
        hideRarities=[Rarity.NORMAL, Rarity.MAGIC, Rarity.RARE, Rarity.SET],
        minLegendaryPotential=3,
        minWeaversWill=15,
        minExaltedTier=7,
        showRaresWithAffixes=False,
        minAffixMatches=4,
        idolAffixRequirement="perfect",
        showNormalBases=False,
        showMagicItems=False,
        hideNormalAfterLevel=1,
        hideMagicAfterLevel=1,
        hideRareAfterLevel=1,
    ),
    "giga-strict": StrictnessConfig(
        id="giga-strict",
        name="GIGA Strict",
        description="Multi Exalt Imprint Farm. High LP Uniques. Strict Planner Idols. "
                   "Double Tier 7. Triple+ Exalteds. Designed for maximum efficiency.",
        order=4,
        showRarities=[Rarity.UNIQUE, Rarity.LEGENDARY],
        hideRarities=[Rarity.NORMAL, Rarity.MAGIC, Rarity.RARE, Rarity.SET, Rarity.EXALTED],
        minLegendaryPotential=4,
        minWeaversWill=20,
        minExaltedTier=7,
        showRaresWithAffixes=False,
        minAffixMatches=5,
        idolAffixRequirement="perfect",
        showNormalBases=False,
        showMagicItems=False,
        hideNormalAfterLevel=1,
        hideMagicAfterLevel=1,
        hideRareAfterLevel=1,
    ),
}


def get_strictness_config(strictness: str) -> StrictnessConfig:
    """Get strictness configuration by ID"""
    return STRICTNESS_CONFIGS.get(strictness, STRICTNESS_CONFIGS["regular"])


def get_strictness_for_level(level: int) -> StrictnessConfig:
    """Get appropriate strictness based on character level"""
    if level < 30:
        return STRICTNESS_CONFIGS["regular"]
    elif level < 60:
        return STRICTNESS_CONFIGS["regular"]
    elif level < 85:
        return STRICTNESS_CONFIGS["strict"]
    elif level < 95:
        return STRICTNESS_CONFIGS["very-strict"]
    else:
        return STRICTNESS_CONFIGS["uber-strict"]


# ============================================================================
# Equipment Groups
# ============================================================================

EQUIPMENT_GROUPS = {
    "armor": [
        EquipmentType.HELMET, EquipmentType.BODY_ARMOR, EquipmentType.GLOVES,
        EquipmentType.BELT, EquipmentType.BOOTS
    ],
    "weapons_melee": [
        EquipmentType.ONE_HANDED_AXE, EquipmentType.ONE_HANDED_MACES,
        EquipmentType.ONE_HANDED_SWORD, EquipmentType.ONE_HANDED_DAGGER,
        EquipmentType.TWO_HANDED_AXE, EquipmentType.TWO_HANDED_MACE,
        EquipmentType.TWO_HANDED_SPEAR, EquipmentType.TWO_HANDED_SWORD
    ],
    "weapons_caster": [
        EquipmentType.ONE_HANDED_SCEPTRE, EquipmentType.TWO_HANDED_STAFF,
        EquipmentType.WAND
    ],
    "weapons_ranged": [
        EquipmentType.BOW
    ],
    "offhand": [
        EquipmentType.SHIELD, EquipmentType.QUIVER, EquipmentType.CATALYST
    ],
    "accessories": [
        EquipmentType.AMULET, EquipmentType.RING, EquipmentType.RELIC
    ],
    "idols_small": [
        EquipmentType.IDOL_1x1_ETERRA, EquipmentType.IDOL_1x1_LAGON
    ],
    "idols_humble": [
        EquipmentType.IDOL_1x2, EquipmentType.IDOL_2x1
    ],
    "idols_stout": [
        EquipmentType.IDOL_1x3, EquipmentType.IDOL_3x1
    ],
    "idols_grand": [
        EquipmentType.IDOL_1x4, EquipmentType.IDOL_4x1
    ],
    "idols_large": [
        EquipmentType.IDOL_2x2
    ],
}


# ============================================================================
# Rule Priority System
# ============================================================================

class RulePriority:
    """Rule priority constants - higher values = checked first in game"""
    LEGENDARY = 100
    UNIQUE_HIGH_LP = 95
    UNIQUE = 90
    EXALTED_T7 = 85
    EXALTED_BUILD = 80
    SET_ITEMS = 75
    RARE_BUILD = 70
    RARE_GENERAL = 65
    MAGIC_BUILD = 60
    NORMAL_BASE = 55
    IDOL_PERFECT = 50
    IDOL_BUILD = 45
    HIDE_OTHER_CLASS = 20
    HIDE_RARITY = 15
    HIDE_LEVEL = 10


# ============================================================================
# Rule Template Functions
# ============================================================================

def create_legendary_rule() -> FilterRule:
    """Create rule for Legendary items - always show"""
    return FilterRule(
        type=RuleType.SHOW,
        priority=RulePriority.LEGENDARY,
        conditions=[
            RuleCondition(
                type="RarityCondition",
                properties={
                    "rarity": ["LEGENDARY"],
                    "minLegendaryPotential": None,
                    "maxLegendaryPotential": None,
                    "minWeaversWill": None,
                    "maxWeaversWill": None,
                }
            )
        ],
        color=VALUE_COLORS["legendary"],
        emphasized=True,
        nameOverride="LEGENDARY",
        soundId=7,
        beamId=7,
    )


def create_unique_rule(min_lp: int = 0, min_ww: int = 0) -> FilterRule:
    """Create rule for Unique items with LP/WW requirements"""
    return FilterRule(
        type=RuleType.SHOW,
        priority=RulePriority.UNIQUE_HIGH_LP if min_lp > 0 else RulePriority.UNIQUE,
        conditions=[
            RuleCondition(
                type="RarityCondition",
                properties={
                    "rarity": ["UNIQUE"],
                    "minLegendaryPotential": min_lp if min_lp > 0 else None,
                    "maxLegendaryPotential": None,
                    "minWeaversWill": min_ww if min_ww > 0 else None,
                    "maxWeaversWill": None,
                }
            )
        ],
        color=VALUE_COLORS["unique"],
        emphasized=min_lp >= 2,
        nameOverride=f"UNIQUE {'LP'+str(min_lp)+'+' if min_lp > 0 else ''}"
                    f"{' WW'+str(min_ww)+'+' if min_ww > 0 else ''}".strip(),
        soundId=6 if min_lp >= 2 else 2,
        beamId=5 if min_lp >= 2 else 0,
    )


def create_exalted_rule(
    affix_ids: Optional[List[int]] = None,
    min_matches: int = 1,
    equipment_types: Optional[List[EquipmentType]] = None,
) -> FilterRule:
    """Create rule for Exalted items"""
    conditions = [
        RuleCondition(
            type="RarityCondition",
            properties={
                "rarity": ["EXALTED"],
                "minLegendaryPotential": None,
                "maxLegendaryPotential": None,
                "minWeaversWill": None,
                "maxWeaversWill": None,
            }
        )
    ]

    if affix_ids:
        conditions.append(
            RuleCondition(
                type="AffixCondition",
                properties={
                    "affixes": affix_ids,
                    "comparison": "ANY",
                    "comparisonValue": min_matches,
                    "minOnTheSameItem": min_matches,
                    "combinedComparison": "ANY",
                    "combinedComparisonValue": 0,
                    "advanced": False,
                }
            )
        )

    if equipment_types:
        conditions.append(
            RuleCondition(
                type="SubTypeCondition",
                properties={
                    "equipmentTypes": [et.value for et in equipment_types],
                    "subTypes": [],
                }
            )
        )

    return FilterRule(
        type=RuleType.SHOW,
        priority=RulePriority.EXALTED_BUILD if affix_ids else RulePriority.EXALTED_T7,
        conditions=conditions,
        color=VALUE_COLORS["exalted"],
        emphasized=min_matches >= 2,
        nameOverride=f"EXALTED {min_matches}+ Build Affixes" if affix_ids else "EXALTED",
        soundId=2,
        beamId=5 if min_matches >= 2 else 0,
    )


def create_affix_highlight_rule(
    affix_ids: List[int],
    color: int,
    name: str,
    min_matches: int = 1,
    priority: int = 70,
    rarities: Optional[List[Rarity]] = None,
) -> FilterRule:
    """Create rule to highlight items with specific affixes"""
    conditions = []

    if rarities:
        conditions.append(
            RuleCondition(
                type="RarityCondition",
                properties={
                    "rarity": [r.value for r in rarities],
                    "minLegendaryPotential": None,
                    "maxLegendaryPotential": None,
                    "minWeaversWill": None,
                    "maxWeaversWill": None,
                }
            )
        )

    conditions.append(
        RuleCondition(
            type="AffixCondition",
            properties={
                "affixes": affix_ids,
                "comparison": "ANY",
                "comparisonValue": min_matches,
                "minOnTheSameItem": min_matches,
                "combinedComparison": "ANY",
                "combinedComparisonValue": 0,
                "advanced": False,
            }
        )
    )

    return FilterRule(
        type=RuleType.SHOW,
        priority=priority,
        conditions=conditions,
        color=color,
        emphasized=False,
        nameOverride=name,
        soundId=0,
        beamId=0,
    )


def create_set_rule(show: bool = True) -> FilterRule:
    """Create rule for Set items"""
    return FilterRule(
        type=RuleType.SHOW if show else RuleType.HIDE,
        priority=RulePriority.SET_ITEMS,
        conditions=[
            RuleCondition(
                type="RarityCondition",
                properties={
                    "rarity": ["SET"],
                    "minLegendaryPotential": None,
                    "maxLegendaryPotential": None,
                    "minWeaversWill": None,
                    "maxWeaversWill": None,
                }
            )
        ],
        color=VALUE_COLORS["set"] if show else VALUE_COLORS["hide"],
        emphasized=False,
        nameOverride="SET Items" if show else "HIDE SET Items",
        soundId=0,
        beamId=0,
    )


def create_hide_rarity_rule(rarities: List[Rarity]) -> FilterRule:
    """Create rule to hide items of specific rarities"""
    return FilterRule(
        type=RuleType.HIDE,
        priority=RulePriority.HIDE_RARITY,
        conditions=[
            RuleCondition(
                type="RarityCondition",
                properties={
                    "rarity": [r.value for r in rarities],
                    "minLegendaryPotential": None,
                    "maxLegendaryPotential": None,
                    "minWeaversWill": None,
                    "maxWeaversWill": None,
                }
            )
        ],
        color=VALUE_COLORS["hide"],
        emphasized=False,
        nameOverride=f"HIDE {', '.join([r.value for r in rarities])}",
        soundId=0,
        beamId=0,
    )


def create_class_rule(
    classes: List[CharacterClass],
    hide: bool = True
) -> FilterRule:
    """Create rule to show/hide items for specific classes"""
    return FilterRule(
        type=RuleType.HIDE if hide else RuleType.SHOW,
        priority=RulePriority.HIDE_OTHER_CLASS,
        conditions=[
            RuleCondition(
                type="ClassCondition",
                properties={
                    "classes": [c.value for c in classes],
                }
            )
        ],
        color=VALUE_COLORS["hide"] if hide else 0,
        emphasized=False,
        nameOverride=f"{'HIDE' if hide else 'SHOW'} {', '.join([c.value for c in classes])} Items",
        soundId=0,
        beamId=0,
    )


def create_idol_rule(
    idol_types: List[EquipmentType],
    affix_ids: Optional[List[int]] = None,
    min_matches: int = 1,
) -> FilterRule:
    """Create rule for idol items"""
    conditions = [
        RuleCondition(
            type="SubTypeCondition",
            properties={
                "equipmentTypes": [it.value for it in idol_types],
                "subTypes": [],
            }
        )
    ]

    if affix_ids:
        conditions.append(
            RuleCondition(
                type="AffixCondition",
                properties={
                    "affixes": affix_ids,
                    "comparison": "ANY",
                    "comparisonValue": min_matches,
                    "minOnTheSameItem": min_matches,
                    "combinedComparison": "ANY",
                    "combinedComparisonValue": 0,
                    "advanced": False,
                }
            )
        )

    idol_size = "IDOL"
    if idol_types[0] in [EquipmentType.IDOL_1x1_ETERRA, EquipmentType.IDOL_1x1_LAGON]:
        idol_size = "Small IDOL"
    elif idol_types[0] in [EquipmentType.IDOL_1x2, EquipmentType.IDOL_2x1]:
        idol_size = "Humble IDOL"
    elif idol_types[0] in [EquipmentType.IDOL_1x3, EquipmentType.IDOL_3x1]:
        idol_size = "Stout IDOL"
    elif idol_types[0] in [EquipmentType.IDOL_1x4, EquipmentType.IDOL_4x1]:
        idol_size = "Grand IDOL"
    elif idol_types[0] == EquipmentType.IDOL_2x2:
        idol_size = "Large IDOL"

    return FilterRule(
        type=RuleType.SHOW,
        priority=RulePriority.IDOL_BUILD if affix_ids else RulePriority.IDOL_PERFECT,
        conditions=conditions,
        color=VALUE_COLORS["medium"],
        emphasized=min_matches >= 2,
        nameOverride=f"{idol_size} {'Build' if affix_ids else ''}",
        soundId=0,
        beamId=0,
    )


def create_level_based_hide_rule(max_level: int) -> FilterRule:
    """Create rule to hide items below a certain level threshold"""
    return FilterRule(
        type=RuleType.HIDE,
        priority=RulePriority.HIDE_LEVEL,
        conditions=[
            RuleCondition(
                type="CharacterLevelCondition",
                properties={
                    "minimumLvl": max_level + 1,
                    "maximumLvl": 100,
                }
            )
        ],
        color=VALUE_COLORS["hide"],
        emphasized=False,
        nameOverride=f"HIDE Low Level (After Lvl {max_level})",
        soundId=0,
        beamId=0,
    )


# ============================================================================
# Base Rule Templates
# ============================================================================

def get_base_rules(strictness: str, level: int) -> List[FilterRule]:
    """Get base rules based on strictness and level"""
    config = get_strictness_config(strictness)
    rules = []

    # Always show Legendary
    rules.append(create_legendary_rule())

    # Unique rules with LP/WW requirements
    if config.minLegendaryPotential > 0 or config.minWeaversWill > 0:
        rules.append(create_unique_rule(
            min_lp=config.minLegendaryPotential,
            min_ww=config.minWeaversWill
        ))
    else:
        rules.append(create_unique_rule())

    # Exalted rule
    rules.append(create_exalted_rule())

    # Set items
    if Rarity.SET in config.hideRarities:
        rules.append(create_set_rule(show=False))
    elif Rarity.SET in config.showRarities:
        rules.append(create_set_rule(show=True))

    # Hide unwanted rarities
    hide_rarities = []
    if Rarity.NORMAL in config.hideRarities or level > config.hideNormalAfterLevel:
        hide_rarities.append(Rarity.NORMAL)
    if Rarity.MAGIC in config.hideRarities or level > config.hideMagicAfterLevel:
        hide_rarities.append(Rarity.MAGIC)
    if Rarity.RARE in config.hideRarities or level > config.hideRareAfterLevel:
        hide_rarities.append(Rarity.RARE)

    if hide_rarities:
        rules.append(create_hide_rarity_rule(hide_rarities))

    return rules


# ============================================================================
# Damage Type to Affix Mapping
# ============================================================================

# Common affix IDs by damage type (these would normally come from database)
DAMAGE_TYPE_AFFIXES: Dict[str, List[int]] = {
    "physical": [27, 28, 29, 30],  # Physical damage, melee physical, etc.
    "fire": [10, 11, 12, 13],      # Fire damage, fire penetration, etc.
    "cold": [14, 15, 16, 17],      # Cold damage, freeze rate, etc.
    "lightning": [18, 19, 20, 21], # Lightning damage, shock chance, etc.
    "void": [22, 23, 24, 25],      # Void damage, void penetration, etc.
    "necrotic": [33, 34, 35, 36],  # Necrotic damage, etc.
    "poison": [37, 38, 39, 40],    # Poison damage, poison chance, etc.
}

# Common defensive affix IDs
DEFENSIVE_AFFIXES = {
    "health": [31, 32],
    "armor": [50, 51],
    "resistances": [41, 42, 43, 44, 45],
    "block": [52, 53],
    "dodge": [54, 55],
}

# Attribute affix IDs
ATTRIBUTE_AFFIXES = {
    "strength": [60],
    "dexterity": [61],
    "intelligence": [62],
    "vitality": [63],
    "attunement": [64],
}
