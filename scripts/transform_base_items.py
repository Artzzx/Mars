#!/usr/bin/env python3
"""
Transform last_epoch_base_items.json:
1. Remove affixName fields from implicits and basicMods (rollback affix mapping)
2. Remove implicits arrays from subitems and basicMods arrays from uniques
3. Remove itemTags fields from subitems
"""

import json
import os
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

DEFAULT_ITEMS_PATH = os.path.join(PROJECT_ROOT, "public", "last_epoch_base_items.json")


def transform_data(data):
    """Transform the base items data in-place.

    Returns stats dict with counts of modifications made.
    """
    stats = {
        "affixNames_removed": 0,
        "implicits_removed": 0,
        "basicMods_removed": 0,
        "itemTags_removed": 0,
        "total_subitems": 0,
        "total_uniques": 0,
    }

    for bt_key, bt in data["baseTypes"].items():
        for si_key, si in bt["subItems"].items():
            stats["total_subitems"] += 1

            # 1. Remove affixName from implicits (rollback), then remove the array
            for imp in si.get("implicits", []):
                if "affixName" in imp:
                    del imp["affixName"]
                    stats["affixNames_removed"] += 1

            # 2. Remove implicits array entirely
            if "implicits" in si:
                del si["implicits"]
                stats["implicits_removed"] += 1

            # 3. Remove itemTags
            if "itemTags" in si:
                del si["itemTags"]
                stats["itemTags_removed"] += 1

            # 4. Process uniques
            uniques = si.get("uniques", {})
            if isinstance(uniques, dict):
                for u_key, u in uniques.items():
                    stats["total_uniques"] += 1

                    # Remove affixName from basicMods (rollback), then remove the array
                    for mod in u.get("basicMods", []):
                        if "affixName" in mod:
                            del mod["affixName"]
                            stats["affixNames_removed"] += 1

                    # Remove basicMods array entirely
                    if "basicMods" in u:
                        del u["basicMods"]
                        stats["basicMods_removed"] += 1

    return stats


def run_transform(items_path=None, dry_run=False):
    """Main transformation function.

    Args:
        items_path: Path to last_epoch_base_items.json
        dry_run: If True, don't write changes, just report what would happen

    Returns:
        stats dict with transformation counts
    """
    items_path = items_path or DEFAULT_ITEMS_PATH

    print(f"Loading base items from: {items_path}")
    with open(items_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    base_type_count = len(data.get("baseTypes", {}))
    print(f"  Found {base_type_count} base types")

    print("Transforming data...")
    stats = transform_data(data)

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
    parser.add_argument("--dry-run", action="store_true", help="Don't write changes")
    args = parser.parse_args()

    run_transform(items_path=args.items, dry_run=args.dry_run)
