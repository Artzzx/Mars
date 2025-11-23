"""
Filter Analyzer for Last Epoch Loot Filter Backend

Analyzes existing filters and database patterns to determine optimal rule configurations.
"""

import logging
from typing import List, Dict, Any, Optional
from collections import Counter

from db import DatabaseConnection, get_database
from models import (
    FilterRequest, BuildProfile, StrictnessConfig,
    CharacterClass, DamageType, EquipmentType
)
from templates import (
    get_strictness_config, DAMAGE_TYPE_AFFIXES, DEFENSIVE_AFFIXES,
    ATTRIBUTE_AFFIXES, VALUE_COLORS
)

logger = logging.getLogger(__name__)


class FilterAnalyzer:
    """Analyzes existing filters and build profiles to extract optimal patterns"""

    def __init__(self, db: Optional[DatabaseConnection] = None):
        self.db = db or get_database()

    def analyze_patterns(self, criteria: FilterRequest) -> Dict[str, Any]:
        """
        Extract common patterns from existing filters matching criteria.

        Returns:
            Dictionary containing:
            - common_rules: Most frequently used rules
            - affix_priorities: Prioritized list of affixes for this build
            - color_scheme: Recommended color scheme
            - rule_order: Optimized rule ordering
            - build_profile: Matching build profile if found
            - strictness_config: Applied strictness configuration
        """
        # Get strictness configuration
        strictness_config = get_strictness_config(criteria.strictness)

        # Try to find matching build profile
        build_profile = self._find_build_profile(criteria)

        # Get rules from database
        db_rules = self.db.get_rules_for_criteria(
            criteria.character_class,
            criteria.strictness,
            limit=200
        )

        # Calculate affix priorities
        affix_priorities = self._calculate_affix_priorities(
            db_rules, criteria, build_profile
        )

        # Extract common rule patterns
        common_rules = self._extract_common_rules(db_rules)

        # Determine color scheme
        color_scheme = self._determine_color_scheme(criteria, build_profile)

        # Optimize rule order
        rule_order = self._optimize_rule_order(common_rules, criteria.level)

        return {
            "common_rules": common_rules,
            "affix_priorities": affix_priorities,
            "color_scheme": color_scheme,
            "rule_order": rule_order,
            "build_profile": build_profile,
            "strictness_config": strictness_config.model_dump() if strictness_config else None,
        }

    def _find_build_profile(self, criteria: FilterRequest) -> Optional[Dict[str, Any]]:
        """Find a matching build profile from database or predefined builds"""
        # First check if build_id was specified
        if criteria.build_id:
            profile = self.db.get_build_profile(criteria.build_id)
            if profile:
                return profile

        # Try to find by class and damage types
        all_profiles = self.db.get_all_build_profiles()

        best_match = None
        best_score = 0

        for profile in all_profiles:
            score = 0

            # Match class
            if profile.get("character_class") == criteria.character_class:
                score += 10

            # Match damage types
            profile_damage_types = profile.get("damage_types", [])
            for dt in criteria.damage_types:
                if dt in profile_damage_types:
                    score += 5

            # Match weapons
            profile_weapons = profile.get("weapons", [])
            for wt in criteria.weapon_types:
                if wt in profile_weapons:
                    score += 3

            if score > best_score:
                best_score = score
                best_match = profile

        return best_match if best_score >= 10 else None

    def _calculate_affix_priorities(
        self,
        rules: List[Dict[str, Any]],
        criteria: FilterRequest,
        build_profile: Optional[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Determine which affixes appear most frequently for this build type.

        Returns prioritized list of affix IDs with their priority scores.
        """
        affix_frequency: Dict[int, int] = Counter()
        affix_sources: Dict[int, List[str]] = {}

        # Add affixes from user criteria
        user_affixes = self._get_affixes_from_criteria(criteria)
        for affix_id in user_affixes:
            affix_frequency[affix_id] += 100  # High weight for user-specified
            affix_sources.setdefault(affix_id, []).append("user_criteria")

        # Add affixes from build profile
        if build_profile:
            valued = build_profile.get("valued_affixes", {})

            for affix_id in valued.get("essential", []):
                affix_frequency[affix_id] += 80
                affix_sources.setdefault(affix_id, []).append("build_essential")

            for affix_id in valued.get("high", []):
                affix_frequency[affix_id] += 60
                affix_sources.setdefault(affix_id, []).append("build_high")

            for affix_id in valued.get("medium", []):
                affix_frequency[affix_id] += 40
                affix_sources.setdefault(affix_id, []).append("build_medium")

            for affix_id in valued.get("low", []):
                affix_frequency[affix_id] += 20
                affix_sources.setdefault(affix_id, []).append("build_low")

        # Add affixes from database rules
        for rule in rules:
            conditions = rule.get("conditions", {})
            if isinstance(conditions, dict) and conditions.get("type") == "AffixCondition":
                for affix_id in conditions.get("affixes", []):
                    # Weight by usage count
                    weight = min(10, rule.get("usage_count", 1))
                    affix_frequency[affix_id] += weight
                    affix_sources.setdefault(affix_id, []).append("database")

        # Sort by frequency and create result
        sorted_affixes = sorted(
            affix_frequency.items(),
            key=lambda x: x[1],
            reverse=True
        )

        result = []
        for affix_id, score in sorted_affixes:
            # Get affix details from database
            affix_data = self.db.get_affix(affix_id)
            result.append({
                "id": affix_id,
                "score": score,
                "sources": affix_sources.get(affix_id, []),
                "name": affix_data.get("name") if affix_data else f"Affix {affix_id}",
                "category": affix_data.get("category") if affix_data else "unknown",
            })

        return result

    def _get_affixes_from_criteria(self, criteria: FilterRequest) -> List[int]:
        """Extract affix IDs from user criteria"""
        affixes = []

        # Add damage type affixes
        for damage_type in criteria.damage_types:
            affixes.extend(DAMAGE_TYPE_AFFIXES.get(damage_type, []))

        # Add priority stats affixes
        for category, stats in criteria.priority_stats.items():
            if category == "offensive":
                for stat in stats:
                    # Map stat names to affix IDs (simplified)
                    affixes.extend(self._stat_name_to_affix_ids(stat))
            elif category == "defensive":
                for stat in stats:
                    affixes.extend(self._stat_name_to_affix_ids(stat))

        return list(set(affixes))

    def _stat_name_to_affix_ids(self, stat_name: str) -> List[int]:
        """Map stat name to affix IDs"""
        stat_mapping = {
            # Offensive
            "melee_damage": [27, 28],
            "spell_damage": [4, 5],
            "attack_speed": [87, 88],
            "cast_speed": [89, 90],
            "critical_strike_chance": [6, 7],
            "critical_strike_multiplier": [8, 9],

            # Damage types
            "fire_damage": DAMAGE_TYPE_AFFIXES.get("fire", []),
            "cold_damage": DAMAGE_TYPE_AFFIXES.get("cold", []),
            "lightning_damage": DAMAGE_TYPE_AFFIXES.get("lightning", []),
            "void_damage": DAMAGE_TYPE_AFFIXES.get("void", []),
            "physical_damage": DAMAGE_TYPE_AFFIXES.get("physical", []),
            "necrotic_damage": DAMAGE_TYPE_AFFIXES.get("necrotic", []),
            "poison_damage": DAMAGE_TYPE_AFFIXES.get("poison", []),

            # Defensive
            "health": DEFENSIVE_AFFIXES.get("health", []),
            "armor": DEFENSIVE_AFFIXES.get("armor", []),
            "resistances": DEFENSIVE_AFFIXES.get("resistances", []),
            "fire_resistance": [41],
            "cold_resistance": [42],
            "lightning_resistance": [43],
            "void_resistance": [44],
            "necrotic_resistance": [45],
            "poison_resistance": [46],
            "block": DEFENSIVE_AFFIXES.get("block", []),
            "dodge": DEFENSIVE_AFFIXES.get("dodge", []),

            # Attributes
            "strength": ATTRIBUTE_AFFIXES.get("strength", []),
            "dexterity": ATTRIBUTE_AFFIXES.get("dexterity", []),
            "intelligence": ATTRIBUTE_AFFIXES.get("intelligence", []),
            "vitality": ATTRIBUTE_AFFIXES.get("vitality", []),
            "attunement": ATTRIBUTE_AFFIXES.get("attunement", []),
        }

        # Try exact match
        if stat_name.lower() in stat_mapping:
            return stat_mapping[stat_name.lower()]

        # Try partial match
        for key, ids in stat_mapping.items():
            if stat_name.lower() in key or key in stat_name.lower():
                return ids

        return []

    def _extract_common_rules(self, rules: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Extract most common rule patterns from database rules"""
        if not rules:
            return []

        # Group rules by type and condition pattern
        rule_patterns: Dict[str, List[Dict[str, Any]]] = {}

        for rule in rules:
            # Create pattern key
            conditions = rule.get("conditions", {})
            pattern_key = f"{rule.get('rule_type', 'SHOW')}_{conditions.get('type', 'unknown')}"
            rule_patterns.setdefault(pattern_key, []).append(rule)

        # Select most common patterns
        common = []
        for pattern_key, pattern_rules in rule_patterns.items():
            # Sum usage counts
            total_usage = sum(r.get("usage_count", 0) for r in pattern_rules)

            if total_usage > 0:
                # Use the most used rule as representative
                representative = max(pattern_rules, key=lambda r: r.get("usage_count", 0))
                common.append({
                    "pattern": pattern_key,
                    "total_usage": total_usage,
                    "rule_type": representative.get("rule_type"),
                    "conditions": representative.get("conditions"),
                    "color": representative.get("color"),
                    "priority": representative.get("priority"),
                })

        # Sort by total usage
        common.sort(key=lambda x: x["total_usage"], reverse=True)

        return common[:20]  # Return top 20 patterns

    def _determine_color_scheme(
        self,
        criteria: FilterRequest,
        build_profile: Optional[Dict[str, Any]]
    ) -> Dict[str, int]:
        """Determine recommended color scheme based on build"""
        # Default scheme
        scheme = dict(VALUE_COLORS)

        # Customize based on damage types
        if criteria.damage_types:
            primary_damage = criteria.damage_types[0]
            damage_colors = {
                "physical": {"essential": 5, "high": 4},    # Orange theme
                "fire": {"essential": 7, "high": 5},        # Red/Orange theme
                "cold": {"essential": 13, "high": 12},      # Blue theme
                "lightning": {"essential": 2, "high": 3},   # Yellow theme
                "void": {"essential": 10, "high": 11},      # Purple theme
                "necrotic": {"essential": 17, "high": 1},   # Dark green/gray theme
                "poison": {"essential": 16, "high": 15},    # Green theme
            }
            if primary_damage in damage_colors:
                scheme.update(damage_colors[primary_damage])

        return scheme

    def _optimize_rule_order(
        self,
        common_rules: List[Dict[str, Any]],
        level: int
    ) -> List[str]:
        """
        Optimize rule order based on common patterns and level.

        Returns list of rule pattern keys in optimal order.
        """
        # Define base ordering (higher = earlier in filter)
        base_order = [
            "SHOW_RarityCondition_LEGENDARY",
            "SHOW_RarityCondition_UNIQUE_LP",
            "SHOW_RarityCondition_UNIQUE",
            "SHOW_RarityCondition_EXALTED",
            "SHOW_AffixCondition_BUILD",
            "SHOW_RarityCondition_SET",
            "SHOW_RarityCondition_RARE",
            "HIGHLIGHT_AffixCondition",
            "SHOW_SubTypeCondition_IDOL",
            "HIDE_ClassCondition",
            "HIDE_RarityCondition",
            "HIDE_CharacterLevelCondition",
        ]

        # Adjust based on level
        if level < 30:
            # Show more items during leveling
            pass
        elif level >= 85:
            # Remove rare rules for high level
            base_order = [o for o in base_order if "RARE" not in o]

        return base_order

    def get_recommended_affixes(
        self,
        character_class: str,
        damage_types: List[str],
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Get recommended affixes for a character class and damage types.

        Returns list of affix recommendations.
        """
        affixes = []

        # Add damage type affixes
        for damage_type in damage_types:
            dt_affixes = DAMAGE_TYPE_AFFIXES.get(damage_type, [])
            for affix_id in dt_affixes:
                affix_data = self.db.get_affix(affix_id)
                if affix_data:
                    affixes.append({
                        "id": affix_id,
                        "name": affix_data.get("name", f"Affix {affix_id}"),
                        "category": "offensive",
                        "priority": "essential",
                        "source": f"{damage_type} damage",
                    })

        # Add defensive affixes
        for category, ids in DEFENSIVE_AFFIXES.items():
            for affix_id in ids:
                affix_data = self.db.get_affix(affix_id)
                if affix_data:
                    affixes.append({
                        "id": affix_id,
                        "name": affix_data.get("name", f"Affix {affix_id}"),
                        "category": "defensive",
                        "priority": "medium" if category == "health" else "low",
                        "source": category,
                    })

        # Add class-specific attributes
        class_attributes = {
            "Sentinel": ["strength", "vitality"],
            "Mage": ["intelligence", "attunement"],
            "Primalist": ["attunement", "strength"],
            "Rogue": ["dexterity"],
            "Acolyte": ["intelligence", "vitality"],
        }

        for attr in class_attributes.get(character_class, []):
            attr_ids = ATTRIBUTE_AFFIXES.get(attr, [])
            for affix_id in attr_ids:
                affix_data = self.db.get_affix(affix_id)
                if affix_data:
                    affixes.append({
                        "id": affix_id,
                        "name": affix_data.get("name", f"Affix {affix_id}"),
                        "category": "attribute",
                        "priority": "high",
                        "source": f"class attribute ({attr})",
                    })

        # Remove duplicates and limit
        seen_ids = set()
        unique_affixes = []
        for affix in affixes:
            if affix["id"] not in seen_ids:
                seen_ids.add(affix["id"])
                unique_affixes.append(affix)

        return unique_affixes[:limit]

    def analyze_filter_xml(self, xml_content: str) -> Dict[str, Any]:
        """
        Analyze an XML filter file and extract patterns.

        Returns analysis of the filter structure.
        """
        # This would parse the XML and extract patterns
        # For now, return a placeholder
        return {
            "rule_count": 0,
            "patterns": [],
            "affixes_used": [],
            "strictness_estimate": "unknown",
        }
