#!/usr/bin/env python3
"""
Separates LE game data into two distinct files:

  affixes.json  – All affix data (from MasterAffixesList.json)
  items.json    – All item data  (from MasterItemsList.json + UniqueList.json)

The cross-contamination removed:
  • MasterItemsList.json contains an "affixList" key which is a Unity object
    reference to the affix asset.  That field is omitted from items.json.

All other data from all three source files is retained.

Usage (from repo root):
    python filter-engine/scripts/separate_affixes_items.py

Override defaults with flags:
    python filter-engine/scripts/separate_affixes_items.py \\
        --affixes  path/to/MasterAffixesList.json \\
        --items    path/to/MasterItemsList.json \\
        --uniques  path/to/UniqueList.json \\
        --out-dir  path/to/output/dir
"""

import json
import argparse
from pathlib import Path

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def load_json(path: Path) -> dict:
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def save_json(data: dict, path: Path, indent: int = 2) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=indent, ensure_ascii=False)
    size_kb = path.stat().st_size / 1024
    print(f"  Written: {path}  ({size_kb:,.1f} KB)")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    # Resolve defaults relative to this script's location so the script works
    # regardless of the working directory it is called from.
    script_dir = Path(__file__).parent
    mappings_dir = script_dir.parent / "data" / "mappings"

    parser = argparse.ArgumentParser(
        description="Split LE game data into affixes.json and items.json."
    )
    parser.add_argument(
        "--affixes",
        default=mappings_dir / "MasterAffixesList.json",
        type=Path,
        help="Path to MasterAffixesList.json",
    )
    parser.add_argument(
        "--items",
        default=mappings_dir / "MasterItemsList.json",
        type=Path,
        help="Path to MasterItemsList.json",
    )
    parser.add_argument(
        "--uniques",
        default=mappings_dir / "UniqueList.json",
        type=Path,
        help="Path to UniqueList.json",
    )
    parser.add_argument(
        "--out-dir",
        default=mappings_dir / "separated",
        type=Path,
        help="Output directory for affixes.json and items.json",
    )
    args = parser.parse_args()

    # --- Load sources -------------------------------------------------------
    print("Loading source files...")
    print(f"  {args.affixes}")
    affixes_src = load_json(args.affixes)

    print(f"  {args.items}")
    items_src = load_json(args.items)

    print(f"  {args.uniques}")
    uniques_src = load_json(args.uniques)

    # --- Build affixes output -----------------------------------------------
    # MasterAffixesList contains only affix data; copy it entirely.
    affixes_output = {k: v for k, v in affixes_src.items()}

    # --- Build items output -------------------------------------------------
    # MasterItemsList has an "affixList" key which is a Unity object reference
    # ({"m_FileID": ..., "m_PathID": ...}) pointing to the affix asset.
    # Strip it — everything else in that file is item data.
    AFFIX_KEYS_TO_STRIP = {"affixList"}
    items_output = {k: v for k, v in items_src.items() if k not in AFFIX_KEYS_TO_STRIP}

    # Merge unique-specific fields from UniqueList.json.
    # Keys that are Unity asset metadata and already present from MasterItemsList
    # are intentionally skipped to avoid overwriting them.
    UNITY_METADATA_KEYS = {"m_GameObject", "m_Enabled", "m_Script", "m_Name"}
    for key, value in uniques_src.items():
        if key not in UNITY_METADATA_KEYS:
            if key in items_output:
                print(
                    f"  Warning: key '{key}' from UniqueList already exists in "
                    "items output — overwriting with UniqueList value."
                )
            items_output[key] = value

    # --- Summary ------------------------------------------------------------
    def _count(d: dict, key: str) -> str:
        v = d.get(key)
        return str(len(v)) if isinstance(v, list) else "—"

    print("\nSummary")
    print(f"  {'Source':<40} {'Key':<35} {'Entries':>7}")
    print(f"  {'-'*40} {'-'*35} {'-'*7}")
    rows = [
        ("MasterAffixesList -> affixes.json",  "singleAffixes",             affixes_output),
        ("",                                   "multiAffixes",               affixes_output),
        ("",                                   "affixDisaplayCategories",    affixes_output),
        ("",                                   "categoryHeaders",            affixes_output),
        ("",                                   "affixGroups",                affixes_output),
        ("MasterItemsList   -> items.json",    "EquippableItems",            items_output),
        ("",                                   "nonEquippableItems",         items_output),
        ("",                                   "disabledBaseTypesForModels", items_output),
        ("",                                   "LootFilterVisualCategories", items_output),
        ("UniqueList        -> items.json",    "uniques",                   items_output),
    ]
    for src, key, data in rows:
        print(f"  {src:<40} {key:<35} {_count(data, key):>7}")

    stripped = sorted(AFFIX_KEYS_TO_STRIP)
    print(f"\n  Stripped from items output: {stripped}")

    # --- Write outputs ------------------------------------------------------
    print(f"\nWriting to {args.out_dir}/")
    save_json(affixes_output, args.out_dir / "affixes.json")
    save_json(items_output,   args.out_dir / "items.json")

    print("\nDone.")


if __name__ == "__main__":
    main()
