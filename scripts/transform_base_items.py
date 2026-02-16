#!/usr/bin/env python3
"""
Transform last_epoch_base_items.json:
1. Split "name" into base name + category (e.g. "Refuge Helmet - Helmet" -> name="Refuge Helmet", category="Helmet")
2. Add affix names to basicMods and implicits using property ID -> affixes.json mapping
3. Remove unnecessary fields: sprite, displayNameKey, isStartingItem, loreText, specialTag
"""

import json
import os
import sys
import copy

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

DEFAULT_ITEMS_PATH = os.path.join(PROJECT_ROOT, "public", "last_epoch_base_items.json")
DEFAULT_AFFIXES_PATH = os.path.join(PROJECT_ROOT, "public", "affixes.json")

# Fields to remove at each level
SUBITEM_FIELDS_TO_REMOVE = {"sprite", "displayNameKey", "isStartingItem"}
UNIQUE_FIELDS_TO_REMOVE = {"sprite", "loreText"}
BASETYPE_FIELDS_TO_REMOVE = {"displayNameKey"}
MOD_FIELDS_TO_REMOVE = {"specialTag"}  # Inside basicMods[] and implicits[]


def load_affix_map(affixes_path):
    """Load affixes.json and build property ID -> name mapping."""
    with open(affixes_path, "r", encoding="utf-8") as f:
        affix_data = json.load(f)

    affix_map = {}
    for affix in affix_data.get("singleAffixes", []):
        affix_map[affix["affixId"]] = affix["name"]
    for affix in affix_data.get("multiAffixes", []):
        affix_map[affix["affixId"]] = affix["name"]

    return affix_map


def split_name(name):
    """Split 'Base Name - Category' into (base_name, category).

    Returns (base_name, category) or (name, None) if no ' - ' separator found.
    """
    if " - " in name:
        parts = name.rsplit(" - ", 1)
        return parts[0].strip(), parts[1].strip()
    return name, None


def add_affix_names_to_mods(mods, affix_map):
    """Add 'affixName' field to each mod based on its 'property' ID.
    Also remove 'specialTag' field.
    """
    for mod in mods:
        prop_id = mod.get("property")
        if prop_id is not None and prop_id in affix_map:
            mod["affixName"] = affix_map[prop_id]
        # Remove specialTag
        for field in MOD_FIELDS_TO_REMOVE:
            mod.pop(field, None)


def transform_data(data, affix_map):
    """Transform the base items data in-place.

    Returns stats dict with counts of modifications made.
    """
    stats = {
        "names_split": 0,
        "categories_added": 0,
        "basicMods_annotated": 0,
        "implicits_annotated": 0,
        "subitem_fields_removed": 0,
        "unique_fields_removed": 0,
        "basetype_fields_removed": 0,
        "mod_specialtags_removed": 0,
        "total_subitems": 0,
        "total_uniques": 0,
    }

    for bt_key, bt in data["baseTypes"].items():
        # Remove fields at baseType level
        for field in BASETYPE_FIELDS_TO_REMOVE:
            if field in bt:
                del bt[field]
                stats["basetype_fields_removed"] += 1

        for si_key, si in bt["subItems"].items():
            stats["total_subitems"] += 1

            # 1. Split name into base name + category
            name = si.get("name", "")
            if name and " - " in name:
                base_name, category = split_name(name)
                si["name"] = base_name
                # Insert category between baseTypeId and rarity
                # We rebuild the dict to control key order
                new_si = {}
                for k, v in si.items():
                    new_si[k] = v
                    if k == "baseTypeId":
                        new_si["category"] = category
                # Replace the subitem dict contents
                si.clear()
                si.update(new_si)
                stats["names_split"] += 1
                stats["categories_added"] += 1

            # 2. Add affix names to implicits
            for imp in si.get("implicits", []):
                prop_id = imp.get("property")
                if prop_id is not None and prop_id in affix_map:
                    imp["affixName"] = affix_map[prop_id]
                    stats["implicits_annotated"] += 1
                for field in MOD_FIELDS_TO_REMOVE:
                    if field in imp:
                        del imp[field]
                        stats["mod_specialtags_removed"] += 1

            # 3. Remove unnecessary fields from subitem
            for field in SUBITEM_FIELDS_TO_REMOVE:
                if field in si:
                    del si[field]
                    stats["subitem_fields_removed"] += 1

            # 4. Process uniques
            uniques = si.get("uniques", {})
            if isinstance(uniques, dict):
                for u_key, u in uniques.items():
                    stats["total_uniques"] += 1

                    # Add affix names to basicMods
                    for mod in u.get("basicMods", []):
                        prop_id = mod.get("property")
                        if prop_id is not None and prop_id in affix_map:
                            mod["affixName"] = affix_map[prop_id]
                            stats["basicMods_annotated"] += 1
                        for field in MOD_FIELDS_TO_REMOVE:
                            if field in mod:
                                del mod[field]
                                stats["mod_specialtags_removed"] += 1

                    # Remove unnecessary fields from unique
                    for field in UNIQUE_FIELDS_TO_REMOVE:
                        if field in u:
                            del u[field]
                            stats["unique_fields_removed"] += 1

    return stats


def run_transform(items_path=None, affixes_path=None, dry_run=False):
    """Main transformation function.

    Args:
        items_path: Path to last_epoch_base_items.json
        affixes_path: Path to affixes.json
        dry_run: If True, don't write changes, just report what would happen

    Returns:
        stats dict with transformation counts
    """
    items_path = items_path or DEFAULT_ITEMS_PATH
    affixes_path = affixes_path or DEFAULT_AFFIXES_PATH

    print(f"Loading affixes from: {affixes_path}")
    affix_map = load_affix_map(affixes_path)
    print(f"  Loaded {len(affix_map)} affix mappings")

    print(f"Loading base items from: {items_path}")
    with open(items_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    base_type_count = len(data.get("baseTypes", {}))
    print(f"  Found {base_type_count} base types")

    print("Transforming data...")
    stats = transform_data(data, affix_map)

    print(f"\nTransformation stats:")
    for key, value in stats.items():
        print(f"  {key}: {value}")

    if not dry_run:
        # Write to temp file then atomic replace
        tmp_path = items_path + ".tmp"
        print(f"\nWriting to: {items_path}")
        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write("\n")
        os.replace(tmp_path, items_path)
        print("Done!")
    else:
        print("\n[DRY RUN] No changes written.")

    return stats


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Transform Last Epoch base items JSON")
    parser.add_argument("--items", default=DEFAULT_ITEMS_PATH, help="Path to base items JSON")
    parser.add_argument("--affixes", default=DEFAULT_AFFIXES_PATH, help="Path to affixes JSON")
    parser.add_argument("--dry-run", action="store_true", help="Don't write changes")
    args = parser.parse_args()

    run_transform(items_path=args.items, affixes_path=args.affixes, dry_run=args.dry_run)
