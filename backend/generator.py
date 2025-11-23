"""
Filter Generator for Last Epoch Loot Filter Backend

Generates valid Last Epoch XML filters based on user criteria and analyzed patterns.
"""

import logging
from typing import List, Dict, Any, Optional
from lxml import etree

from models import (
    FilterRequest, FilterRule, RuleCondition, FilterMetadata,
    CharacterClass, DamageType, EquipmentType, Rarity, RuleType
)
from analyzer import FilterAnalyzer
from templates import (
    get_strictness_config, get_base_rules,
    create_legendary_rule, create_unique_rule, create_exalted_rule,
    create_set_rule, create_hide_rarity_rule, create_class_rule,
    create_affix_highlight_rule, create_idol_rule,
    RulePriority, VALUE_COLORS, EQUIPMENT_GROUPS
)

logger = logging.getLogger(__name__)

# XML Namespace for xsi:type
XSI_NS = "http://www.w3.org/2001/XMLSchema-instance"
NSMAP = {"i": XSI_NS}


class FilterGenerator:
    """Generates Last Epoch loot filters from user criteria"""

    def __init__(self, analyzer: FilterAnalyzer):
        self.analyzer = analyzer

    def generate(self, request: FilterRequest) -> str:
        """
        Generate a complete filter XML from request criteria.

        Args:
            request: Filter generation request with user criteria

        Returns:
            Valid Last Epoch XML filter string
        """
        # Analyze existing patterns
        patterns = self.analyzer.analyze_patterns(request)

        # Build rule list
        rules: List[FilterRule] = []

        # Priority 1: Always show valuable items (Legendary, Unique, Exalted)
        rules.extend(self._create_valuable_items_rules(request, patterns))

        # Priority 2: Class-specific affix rules
        rules.extend(self._create_affix_rules(patterns, request))

        # Priority 3: Equipment-specific rules
        rules.extend(self._create_equipment_rules(request, patterns))

        # Priority 4: Idol rules
        rules.extend(self._create_idol_rules(request, patterns))

        # Priority 5: Hide rules for unwanted items
        rules.extend(self._create_hide_rules(request))

        # Sort by priority (descending - higher priority first)
        rules.sort(key=lambda x: x.priority, reverse=True)

        # Assign order numbers
        for idx, rule in enumerate(rules):
            rule.order = idx

        # Generate XML
        return self._generate_xml(rules, request)

    def _create_valuable_items_rules(
        self,
        request: FilterRequest,
        patterns: Dict[str, Any]
    ) -> List[FilterRule]:
        """Create rules for always-show valuable items"""
        rules = []
        config = get_strictness_config(request.strictness)

        # Legendary - always show with emphasis
        rules.append(create_legendary_rule())

        # Unique with LP/WW requirements based on strictness
        if config.minLegendaryPotential > 0:
            # High LP uniques first
            rules.append(create_unique_rule(
                min_lp=config.minLegendaryPotential,
                min_ww=0
            ))
        if config.minWeaversWill > 0:
            # High WW uniques
            rules.append(create_unique_rule(
                min_lp=0,
                min_ww=config.minWeaversWill
            ))
        # All uniques (may be hidden later if strictness is high)
        rules.append(create_unique_rule())

        # Exalted items
        build_profile = patterns.get("build_profile")
        if build_profile:
            # Show exalted with build affixes
            valued_affixes = build_profile.get("valued_affixes", {})
            all_build_affixes = (
                valued_affixes.get("essential", []) +
                valued_affixes.get("high", [])
            )
            if all_build_affixes:
                rules.append(create_exalted_rule(
                    affix_ids=all_build_affixes,
                    min_matches=config.minAffixMatches
                ))

        # Generic exalted rule
        rules.append(create_exalted_rule())

        # Set items based on strictness
        if Rarity.SET not in [Rarity(r) for r in config.hideRarities]:
            rules.append(create_set_rule(show=True))

        return rules

    def _create_affix_rules(
        self,
        patterns: Dict[str, Any],
        request: FilterRequest
    ) -> List[FilterRule]:
        """Create rules for highlighting items with priority affixes"""
        rules = []
        affix_priorities = patterns.get("affix_priorities", [])
        color_scheme = patterns.get("color_scheme", VALUE_COLORS)

        if not affix_priorities:
            return rules

        # Essential affixes (top 5) - red/orange highlight
        essential_affixes = [
            a["id"] for a in affix_priorities[:5]
            if "build_essential" in a.get("sources", []) or a.get("score", 0) >= 80
        ]
        if essential_affixes:
            rules.append(create_affix_highlight_rule(
                affix_ids=essential_affixes,
                color=color_scheme.get("essential", 5),
                name="ESSENTIAL Affixes (2+)",
                min_matches=2,
                priority=RulePriority.EXALTED_BUILD + 5,
                rarities=[Rarity.RARE, Rarity.EXALTED],
            ))
            rules.append(create_affix_highlight_rule(
                affix_ids=essential_affixes,
                color=color_scheme.get("essential", 5),
                name="ESSENTIAL Affixes (1+)",
                min_matches=1,
                priority=RulePriority.EXALTED_BUILD,
                rarities=[Rarity.RARE, Rarity.EXALTED],
            ))

        # High priority affixes (5-15) - yellow highlight
        high_affixes = [
            a["id"] for a in affix_priorities[5:15]
            if a.get("score", 0) >= 40
        ]
        if high_affixes:
            rules.append(create_affix_highlight_rule(
                affix_ids=high_affixes,
                color=color_scheme.get("high", 4),
                name="HIGH Priority Affixes",
                min_matches=2,
                priority=RulePriority.RARE_BUILD,
                rarities=[Rarity.RARE, Rarity.EXALTED],
            ))

        # Medium priority affixes (15-30) - green highlight
        medium_affixes = [
            a["id"] for a in affix_priorities[15:30]
            if a.get("score", 0) >= 20
        ]
        if medium_affixes:
            rules.append(create_affix_highlight_rule(
                affix_ids=medium_affixes,
                color=color_scheme.get("medium", 2),
                name="MEDIUM Priority Affixes",
                min_matches=2,
                priority=RulePriority.RARE_GENERAL,
                rarities=[Rarity.RARE, Rarity.EXALTED],
            ))

        return rules

    def _create_equipment_rules(
        self,
        request: FilterRequest,
        patterns: Dict[str, Any]
    ) -> List[FilterRule]:
        """Create rules for specific equipment types"""
        rules = []
        build_profile = patterns.get("build_profile")

        if not build_profile:
            return rules

        # Create rules for preferred weapons
        weapons = build_profile.get("weapons", [])
        if weapons:
            valued_affixes = build_profile.get("valued_affixes", {})
            weapon_affixes = (
                valued_affixes.get("essential", []) +
                valued_affixes.get("high", [])
            )

            if weapon_affixes:
                # Convert string weapon types to enum
                weapon_types = []
                for w in weapons:
                    try:
                        weapon_types.append(EquipmentType(w))
                    except ValueError:
                        pass

                if weapon_types:
                    rules.append(create_exalted_rule(
                        affix_ids=weapon_affixes[:10],
                        min_matches=1,
                        equipment_types=weapon_types,
                    ))

        return rules

    def _create_idol_rules(
        self,
        request: FilterRequest,
        patterns: Dict[str, Any]
    ) -> List[FilterRule]:
        """Create rules for idol items"""
        rules = []
        build_profile = patterns.get("build_profile")
        config = get_strictness_config(request.strictness)

        idol_requirement = config.idolAffixRequirement
        min_matches = {
            "any": 1,
            "one_valued": 1,
            "two_valued": 2,
            "perfect": 2,
        }.get(idol_requirement, 1)

        if build_profile:
            idol_affixes = build_profile.get("idol_affixes", {})

            # Small idols (1x1)
            small_affixes = idol_affixes.get("small", [])
            if small_affixes:
                rules.append(create_idol_rule(
                    idol_types=[EquipmentType.IDOL_1x1_ETERRA, EquipmentType.IDOL_1x1_LAGON],
                    affix_ids=small_affixes,
                    min_matches=min_matches,
                ))

            # Humble idols (1x2, 2x1)
            humble_affixes = idol_affixes.get("humble", [])
            if humble_affixes:
                rules.append(create_idol_rule(
                    idol_types=[EquipmentType.IDOL_1x2, EquipmentType.IDOL_2x1],
                    affix_ids=humble_affixes,
                    min_matches=min_matches,
                ))

            # Stout idols (1x3, 3x1)
            stout_affixes = idol_affixes.get("stout", [])
            if stout_affixes:
                rules.append(create_idol_rule(
                    idol_types=[EquipmentType.IDOL_1x3, EquipmentType.IDOL_3x1],
                    affix_ids=stout_affixes,
                    min_matches=min_matches,
                ))

            # Grand idols (1x4, 4x1)
            grand_affixes = idol_affixes.get("grand", [])
            if grand_affixes:
                rules.append(create_idol_rule(
                    idol_types=[EquipmentType.IDOL_1x4, EquipmentType.IDOL_4x1],
                    affix_ids=grand_affixes,
                    min_matches=min_matches,
                ))

            # Large idols (2x2)
            large_affixes = idol_affixes.get("large", [])
            if large_affixes:
                rules.append(create_idol_rule(
                    idol_types=[EquipmentType.IDOL_2x2],
                    affix_ids=large_affixes,
                    min_matches=min_matches,
                ))

        return rules

    def _create_hide_rules(self, request: FilterRequest) -> List[FilterRule]:
        """Create rules for hiding unwanted items"""
        rules = []
        config = get_strictness_config(request.strictness)

        # Hide other class items
        other_classes = [
            c for c in CharacterClass
            if c.value != request.character_class
        ]
        if other_classes:
            rules.append(create_class_rule(other_classes, hide=True))

        # Hide unwanted rarities based on strictness
        hide_rarities = []

        # Always hide normal/magic if requested or strictness requires
        if request.hide_normal or Rarity.NORMAL in [Rarity(r) for r in config.hideRarities]:
            hide_rarities.append(Rarity.NORMAL)
        if request.hide_magic or Rarity.MAGIC in [Rarity(r) for r in config.hideRarities]:
            hide_rarities.append(Rarity.MAGIC)

        # Hide rares at high strictness
        if Rarity.RARE in [Rarity(r) for r in config.hideRarities]:
            hide_rarities.append(Rarity.RARE)

        # Hide set items at strict+ levels
        if Rarity.SET in [Rarity(r) for r in config.hideRarities]:
            hide_rarities.append(Rarity.SET)

        if hide_rarities:
            rules.append(create_hide_rarity_rule(hide_rarities))

        return rules

    def _generate_xml(self, rules: List[FilterRule], request: FilterRequest) -> str:
        """Generate valid Last Epoch XML filter"""
        # Create root element with namespace
        root = etree.Element("ItemFilter", nsmap=NSMAP)

        # Add metadata
        build_name = request.build_id or request.character_class
        etree.SubElement(root, "name").text = f"{build_name} Filter"
        etree.SubElement(root, "filterIcon").text = "1"
        etree.SubElement(root, "filterIconColor").text = "11"
        etree.SubElement(root, "description").text = (
            f"Generated filter for {request.character_class} at level {request.level}. "
            f"Strictness: {request.strictness}"
        )
        etree.SubElement(root, "lastModifiedInVersion").text = "1.3.0"
        etree.SubElement(root, "lootFilterVersion").text = "5"

        # Add rules
        rules_elem = etree.SubElement(root, "rules")

        for rule in rules:
            rule_elem = etree.SubElement(rules_elem, "Rule")

            etree.SubElement(rule_elem, "type").text = rule.type.value if isinstance(rule.type, RuleType) else rule.type

            # Conditions
            conditions_elem = etree.SubElement(rule_elem, "conditions")
            for condition in rule.conditions:
                cond_elem = etree.SubElement(conditions_elem, "Condition")
                cond_elem.set(f"{{{XSI_NS}}}type", condition.type)

                # Add condition properties
                self._add_condition_properties(cond_elem, condition)

            etree.SubElement(rule_elem, "color").text = str(rule.color)
            etree.SubElement(rule_elem, "isEnabled").text = str(rule.isEnabled).lower()
            etree.SubElement(rule_elem, "emphasized").text = str(rule.emphasized).lower()
            etree.SubElement(rule_elem, "nameOverride").text = rule.nameOverride or ""
            etree.SubElement(rule_elem, "SoundId").text = str(rule.soundId)
            etree.SubElement(rule_elem, "BeamId").text = str(rule.beamId)
            etree.SubElement(rule_elem, "Order").text = str(rule.order)

        # Generate XML string
        xml_bytes = etree.tostring(
            root,
            pretty_print=True,
            xml_declaration=True,
            encoding="UTF-8"
        )

        return xml_bytes.decode("utf-8")

    def _add_condition_properties(
        self,
        cond_elem: etree._Element,
        condition: RuleCondition
    ):
        """Add properties to a condition element based on its type"""
        props = condition.properties

        if condition.type == "RarityCondition":
            # Rarity list
            rarity_list = props.get("rarity", [])
            if isinstance(rarity_list, list):
                etree.SubElement(cond_elem, "rarity").text = " ".join(rarity_list)
            else:
                etree.SubElement(cond_elem, "rarity").text = str(rarity_list)

            # LP/WW with nullable support
            self._add_nullable_element(cond_elem, "minLegendaryPotential",
                                       props.get("minLegendaryPotential"))
            self._add_nullable_element(cond_elem, "maxLegendaryPotential",
                                       props.get("maxLegendaryPotential"))
            self._add_nullable_element(cond_elem, "minWeaversWill",
                                       props.get("minWeaversWill"))
            self._add_nullable_element(cond_elem, "maxWeaversWill",
                                       props.get("maxWeaversWill"))

        elif condition.type == "AffixCondition":
            # Affix list
            affixes = props.get("affixes", [])
            if affixes:
                etree.SubElement(cond_elem, "affixes").text = " ".join(map(str, affixes))

            etree.SubElement(cond_elem, "comparison").text = props.get("comparison", "ANY")
            etree.SubElement(cond_elem, "comparisonValue").text = str(props.get("comparisonValue", 1))
            etree.SubElement(cond_elem, "minOnTheSameItem").text = str(props.get("minOnTheSameItem", 1))
            etree.SubElement(cond_elem, "combinedComparison").text = props.get("combinedComparison", "ANY")
            etree.SubElement(cond_elem, "combinedComparisonValue").text = str(props.get("combinedComparisonValue", 0))
            etree.SubElement(cond_elem, "advanced").text = str(props.get("advanced", False)).lower()

        elif condition.type == "SubTypeCondition":
            # Equipment types
            equipment_types = props.get("equipmentTypes", [])
            if equipment_types:
                etree.SubElement(cond_elem, "equipmentTypes").text = " ".join(equipment_types)

            # Subtypes
            sub_types = props.get("subTypes", [])
            if sub_types:
                etree.SubElement(cond_elem, "subTypes").text = " ".join(map(str, sub_types))

        elif condition.type == "ClassCondition":
            classes = props.get("classes", [])
            if classes:
                etree.SubElement(cond_elem, "classes").text = " ".join(classes)

        elif condition.type == "CharacterLevelCondition":
            etree.SubElement(cond_elem, "minimumLvl").text = str(props.get("minimumLvl", 0))
            etree.SubElement(cond_elem, "maximumLvl").text = str(props.get("maximumLvl", 100))

    def _add_nullable_element(
        self,
        parent: etree._Element,
        name: str,
        value: Optional[int]
    ):
        """Add an element with nullable value support"""
        elem = etree.SubElement(parent, name)
        if value is not None:
            elem.text = str(value)
        else:
            elem.set(f"{{{XSI_NS}}}nil", "true")

    def generate_preview(self, request: FilterRequest) -> Dict[str, Any]:
        """
        Generate a preview of what the filter would contain.

        Returns a summary without generating full XML.
        """
        patterns = self.analyzer.analyze_patterns(request)
        config = get_strictness_config(request.strictness)

        # Count rules by type
        rules = []
        rules.extend(self._create_valuable_items_rules(request, patterns))
        rules.extend(self._create_affix_rules(patterns, request))
        rules.extend(self._create_equipment_rules(request, patterns))
        rules.extend(self._create_idol_rules(request, patterns))
        rules.extend(self._create_hide_rules(request))

        rule_summary = {
            "SHOW": 0,
            "HIDE": 0,
            "HIGHLIGHT": 0,
        }
        for rule in rules:
            rule_type = rule.type.value if isinstance(rule.type, RuleType) else rule.type
            rule_summary[rule_type] = rule_summary.get(rule_type, 0) + 1

        return {
            "total_rules": len(rules),
            "rule_breakdown": rule_summary,
            "strictness": config.name,
            "build_profile": patterns.get("build_profile", {}).get("displayName") if patterns.get("build_profile") else None,
            "top_affixes": [
                {"id": a["id"], "name": a["name"]}
                for a in patterns.get("affix_priorities", [])[:10]
            ],
            "color_scheme": patterns.get("color_scheme", {}),
        }
