"""
Data Models for Last Epoch Loot Filter Backend

Pydantic models for API requests/responses and internal data structures.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal
from enum import Enum


# ============================================================================
# Enums
# ============================================================================

class Rarity(str, Enum):
    NORMAL = "NORMAL"
    MAGIC = "MAGIC"
    RARE = "RARE"
    EXALTED = "EXALTED"
    UNIQUE = "UNIQUE"
    SET = "SET"
    LEGENDARY = "LEGENDARY"


class RuleType(str, Enum):
    SHOW = "SHOW"
    HIDE = "HIDE"


class ComparisonType(str, Enum):
    ANY = "ANY"
    EQUAL = "EQUAL"
    LESS = "LESS"
    LESS_OR_EQUAL = "LESS_OR_EQUAL"
    MORE = "MORE"
    MORE_OR_EQUAL = "MORE_OR_EQUAL"


class CharacterClass(str, Enum):
    PRIMALIST = "Primalist"
    MAGE = "Mage"
    SENTINEL = "Sentinel"
    ROGUE = "Rogue"
    ACOLYTE = "Acolyte"


class DamageType(str, Enum):
    PHYSICAL = "physical"
    FIRE = "fire"
    COLD = "cold"
    LIGHTNING = "lightning"
    VOID = "void"
    NECROTIC = "necrotic"
    POISON = "poison"


class StrictnessLevel(str, Enum):
    REGULAR = "regular"
    STRICT = "strict"
    VERY_STRICT = "very-strict"
    UBER_STRICT = "uber-strict"
    GIGA_STRICT = "giga-strict"


class EquipmentType(str, Enum):
    # Armor
    HELMET = "HELMET"
    BODY_ARMOR = "BODY_ARMOR"
    GLOVES = "GLOVES"
    BELT = "BELT"
    BOOTS = "BOOTS"
    # Weapons
    ONE_HANDED_AXE = "ONE_HANDED_AXE"
    ONE_HANDED_MACES = "ONE_HANDED_MACES"
    ONE_HANDED_SWORD = "ONE_HANDED_SWORD"
    ONE_HANDED_DAGGER = "ONE_HANDED_DAGGER"
    ONE_HANDED_SCEPTRE = "ONE_HANDED_SCEPTRE"
    TWO_HANDED_AXE = "TWO_HANDED_AXE"
    TWO_HANDED_MACE = "TWO_HANDED_MACE"
    TWO_HANDED_SPEAR = "TWO_HANDED_SPEAR"
    TWO_HANDED_STAFF = "TWO_HANDED_STAFF"
    TWO_HANDED_SWORD = "TWO_HANDED_SWORD"
    WAND = "WAND"
    BOW = "BOW"
    # Off-hand
    SHIELD = "SHIELD"
    QUIVER = "QUIVER"
    CATALYST = "CATALYST"
    # Accessories
    AMULET = "AMULET"
    RING = "RING"
    RELIC = "RELIC"
    # Idols
    IDOL_1x1_ETERRA = "IDOL_1x1_ETERRA"
    IDOL_1x1_LAGON = "IDOL_1x1_LAGON"
    IDOL_1x2 = "IDOL_1x2"
    IDOL_2x1 = "IDOL_2x1"
    IDOL_1x3 = "IDOL_1x3"
    IDOL_3x1 = "IDOL_3x1"
    IDOL_1x4 = "IDOL_1x4"
    IDOL_4x1 = "IDOL_4x1"
    IDOL_2x2 = "IDOL_2x2"


class AffixCategory(str, Enum):
    OFFENSIVE = "offensive"
    DEFENSIVE = "defensive"
    UTILITY = "utility"
    MINION = "minion"
    ELEMENTAL = "elemental"
    PHYSICAL = "physical"
    DOT = "dot"
    CRIT = "crit"
    MANA = "mana"
    HEALTH = "health"
    RESISTANCE = "resistance"
    ATTRIBUTE = "attribute"


# ============================================================================
# Constants
# ============================================================================

MAX_RULES = 75


# ============================================================================
# Request Models
# ============================================================================

class FilterRequest(BaseModel):
    """Request model for filter generation"""
    character_class: CharacterClass
    level: int = Field(ge=1, le=100, default=75)
    strictness: StrictnessLevel = StrictnessLevel.STRICT
    damage_types: List[DamageType] = Field(default_factory=list)
    priority_stats: Dict[str, List[str]] = Field(default_factory=dict)
    weapon_types: List[EquipmentType] = Field(default_factory=list)
    hide_normal: bool = False
    hide_magic: bool = False
    min_legendary_potential: int = Field(ge=0, le=4, default=0)
    min_weavers_will: int = Field(ge=0, le=28, default=0)
    build_id: Optional[str] = None  # Optional build profile ID

    class Config:
        use_enum_values = True


class BuildAnalysisRequest(BaseModel):
    """Request model for build analysis"""
    character_class: CharacterClass
    damage_types: List[DamageType] = Field(default_factory=list)
    build_id: Optional[str] = None

    class Config:
        use_enum_values = True


# ============================================================================
# Condition Models
# ============================================================================

class RuleCondition(BaseModel):
    """Base condition model for filter rules"""
    type: str  # "RarityCondition" | "AffixCondition" | "SubTypeCondition" etc
    properties: Dict[str, Any]


class RarityConditionProperties(BaseModel):
    """Properties for RarityCondition"""
    rarity: List[str]
    minLegendaryPotential: Optional[int] = None
    maxLegendaryPotential: Optional[int] = None
    minWeaversWill: Optional[int] = None
    maxWeaversWill: Optional[int] = None


class AffixConditionProperties(BaseModel):
    """Properties for AffixCondition"""
    affixes: List[int]
    comparison: ComparisonType = ComparisonType.ANY
    comparisonValue: int = 1
    minOnTheSameItem: int = 1
    combinedComparison: ComparisonType = ComparisonType.ANY
    combinedComparisonValue: int = 1
    advanced: bool = False


class SubTypeConditionProperties(BaseModel):
    """Properties for SubTypeCondition"""
    equipmentTypes: List[str] = Field(default_factory=list)
    subTypes: List[int] = Field(default_factory=list)


class ClassConditionProperties(BaseModel):
    """Properties for ClassCondition"""
    classes: List[str]


class CharacterLevelConditionProperties(BaseModel):
    """Properties for CharacterLevelCondition"""
    minimumLvl: int = 0
    maximumLvl: int = 100


class AffixCountConditionProperties(BaseModel):
    """Properties for AffixCountCondition"""
    comparison: ComparisonType = ComparisonType.ANY
    comparisonValue: int = 1


class LevelConditionProperties(BaseModel):
    """Properties for LevelCondition"""
    comparison: ComparisonType = ComparisonType.ANY
    comparisonValue: int = 1


class FactionConditionProperties(BaseModel):
    """Properties for FactionCondition"""
    factions: List[int] = Field(default_factory=list)


class KeysConditionProperties(BaseModel):
    """Properties for KeysCondition"""
    keys: List[int] = Field(default_factory=list)


class CraftingMaterialsConditionProperties(BaseModel):
    """Properties for CraftingMaterialsCondition"""
    materials: List[int] = Field(default_factory=list)


class ResonancesConditionProperties(BaseModel):
    """Properties for ResonancesCondition"""
    resonances: List[int] = Field(default_factory=list)


class WovenEchoesConditionProperties(BaseModel):
    """Properties for WovenEchoesCondition"""
    wovenEchoes: List[int] = Field(default_factory=list)


# ============================================================================
# Rule Models
# ============================================================================

class FilterRule(BaseModel):
    """Complete filter rule model"""
    type: RuleType = RuleType.SHOW
    conditions: List[RuleCondition] = Field(default_factory=list)
    color: int = Field(ge=0, le=17, default=0)
    isEnabled: bool = True
    emphasized: bool = False
    nameOverride: str = ""
    soundId: int = Field(ge=0, le=10, default=0)
    beamId: int = Field(ge=0, le=9, default=0)
    order: int = 0
    priority: int = 50  # Internal priority for ordering

    class Config:
        use_enum_values = True


# ============================================================================
# Affix Models
# ============================================================================

class Affix(BaseModel):
    """Affix data model"""
    id: int
    name: str
    shortName: str
    tier: Literal["prefix", "suffix"]
    category: AffixCategory
    tags: List[str] = Field(default_factory=list)
    classes: Optional[List[CharacterClass]] = None
    maxTier: int = 7

    class Config:
        use_enum_values = True


# ============================================================================
# Build Profile Models
# ============================================================================

class ValuedAffixes(BaseModel):
    """Affix priority groups for a build"""
    essential: List[int] = Field(default_factory=list)
    high: List[int] = Field(default_factory=list)
    medium: List[int] = Field(default_factory=list)
    low: List[int] = Field(default_factory=list)


class IdolAffixes(BaseModel):
    """Idol affix preferences by size"""
    small: List[int] = Field(default_factory=list)   # 1x1 idols
    humble: List[int] = Field(default_factory=list)  # 1x2, 2x1
    stout: List[int] = Field(default_factory=list)   # 1x3, 3x1
    grand: List[int] = Field(default_factory=list)   # 1x4, 4x1
    large: List[int] = Field(default_factory=list)   # 2x2


class BuildProfile(BaseModel):
    """Complete build profile configuration"""
    id: str
    name: str
    displayName: str
    character_class: CharacterClass = Field(alias="class")
    ascendancy: str
    primaryStats: List[str] = Field(default_factory=list)
    damageTypes: List[DamageType] = Field(default_factory=list)
    valuedAffixes: ValuedAffixes
    weapons: List[EquipmentType] = Field(default_factory=list)
    offhand: Optional[List[EquipmentType]] = None
    idolAffixes: IdolAffixes

    class Config:
        use_enum_values = True
        populate_by_name = True


# ============================================================================
# Strictness Configuration Models
# ============================================================================

class StrictnessConfig(BaseModel):
    """Strictness level configuration"""
    id: str
    name: str
    description: str
    order: int

    showRarities: List[Rarity] = Field(default_factory=list)
    hideRarities: List[Rarity] = Field(default_factory=list)

    minLegendaryPotential: int = 0
    minWeaversWill: int = 0

    minExaltedTier: int = 5
    showRaresWithAffixes: bool = True
    minAffixMatches: int = 1

    idolAffixRequirement: Literal["any", "one_valued", "two_valued", "perfect"] = "any"

    showNormalBases: bool = True
    showMagicItems: bool = True

    hideNormalAfterLevel: int = 25
    hideMagicAfterLevel: int = 50
    hideRareAfterLevel: int = 100

    class Config:
        use_enum_values = True


# ============================================================================
# Response Models
# ============================================================================

class FilterMetadata(BaseModel):
    """Filter metadata"""
    name: str
    filterIcon: int = 1
    filterIconColor: int = 11
    description: str = ""
    lastModifiedInVersion: str = "1.3.5"
    lootFilterVersion: int = 5


class AnalysisResponse(BaseModel):
    """Response model for build analysis"""
    recommended_affixes: List[Dict[str, Any]]
    build_profile: Optional[Dict[str, Any]] = None
    strictness_config: Dict[str, Any]
    rule_preview: List[Dict[str, str]]


class FilterResponse(BaseModel):
    """Response model for filter generation"""
    xml: str
    metadata: FilterMetadata
    rule_count: int
    warnings: List[str] = Field(default_factory=list)


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    version: str
    database_connected: bool


# ============================================================================
# Database Models
# ============================================================================

class FilterRuleDB(BaseModel):
    """Database model for stored filter rules"""
    id: Optional[int] = None
    character_class: CharacterClass
    strictness: StrictnessLevel
    level_range: List[int] = Field(default_factory=lambda: [1, 100])
    rule_type: RuleType
    conditions: Dict[str, Any]
    color: int = 0
    priority: int = 50
    usage_count: int = 0
    created_at: Optional[str] = None

    class Config:
        use_enum_values = True
