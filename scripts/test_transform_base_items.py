#!/usr/bin/env python3
"""
Tests for transform_base_items.py

Criteria:
1. JSON must be valid and usable after transformation
2. Script must process all items without failing
3. Only edits existing JSON, doesn't recreate one
"""

import json
import os
import sys
import copy
import tempfile
import shutil

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from transform_base_items import (
    split_name,
    load_affix_map,
    add_affix_names_to_mods,
    transform_data,
    run_transform,
    SUBITEM_FIELDS_TO_REMOVE,
    UNIQUE_FIELDS_TO_REMOVE,
    BASETYPE_FIELDS_TO_REMOVE,
    MOD_FIELDS_TO_REMOVE,
)

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
ITEMS_PATH = os.path.join(PROJECT_ROOT, "public", "last_epoch_base_items.json")
AFFIXES_PATH = os.path.join(PROJECT_ROOT, "public", "affixes.json")

passed = 0
failed = 0


def test(name):
    """Decorator for test functions."""
    def decorator(func):
        global passed, failed
        try:
            func()
            print(f"  PASS: {name}")
            passed += 1
        except Exception as e:
            print(f"  FAIL: {name}")
            print(f"        {e}")
            failed += 1
    return decorator


# ─── Unit Tests ───

@test("split_name: standard 'Base Name - Category' format")
def _():
    base, cat = split_name("Refuge Helmet - Helmet")
    assert base == "Refuge Helmet", f"Expected 'Refuge Helmet', got '{base}'"
    assert cat == "Helmet", f"Expected 'Helmet', got '{cat}'"


@test("split_name: category with hyphen uses last separator")
def _():
    base, cat = split_name("Some Item - Off-Hand Catalyst")
    assert base == "Some Item", f"Expected 'Some Item', got '{base}'"
    assert cat == "Off-Hand Catalyst", f"Expected 'Off-Hand Catalyst', got '{cat}'"


@test("split_name: no separator returns original name")
def _():
    base, cat = split_name("JustAName")
    assert base == "JustAName", f"Expected 'JustAName', got '{base}'"
    assert cat is None, f"Expected None, got '{cat}'"


@test("add_affix_names_to_mods: adds affixName and removes specialTag")
def _():
    affix_map = {0: "Void Penetration", 1: "Armor"}
    mods = [
        {"property": 0, "value": 1.5, "specialTag": 1, "tags": 8, "type": 0},
        {"property": 1, "value": 0.4, "specialTag": 0, "tags": 8, "type": 1},
    ]
    add_affix_names_to_mods(mods, affix_map)
    assert mods[0]["affixName"] == "Void Penetration"
    assert mods[1]["affixName"] == "Armor"
    assert "specialTag" not in mods[0]
    assert "specialTag" not in mods[1]


@test("add_affix_names_to_mods: missing property ID doesn't crash")
def _():
    affix_map = {0: "Void Penetration"}
    mods = [{"property": 9999, "value": 1.0, "specialTag": 0}]
    add_affix_names_to_mods(mods, affix_map)
    assert "affixName" not in mods[0]
    assert "specialTag" not in mods[0]


# ─── Integration Tests (using real data files) ───

@test("load_affix_map: loads all 946 affixes from real affixes.json")
def _():
    affix_map = load_affix_map(AFFIXES_PATH)
    assert len(affix_map) == 946, f"Expected 946 affixes, got {len(affix_map)}"
    assert affix_map[0] == "Void Penetration", f"Affix 0: {affix_map.get(0)}"
    assert affix_map[1] == "Armor", f"Affix 1: {affix_map.get(1)}"


@test("transform_data on real data: processes all 855 subitems without error")
def _():
    with open(ITEMS_PATH, "r") as f:
        data = json.load(f)
    affix_map = load_affix_map(AFFIXES_PATH)

    original_subitem_count = sum(
        len(bt["subItems"]) for bt in data["baseTypes"].values()
    )
    assert original_subitem_count == 855, f"Expected 855, got {original_subitem_count}"

    stats = transform_data(data, affix_map)
    assert stats["total_subitems"] == 855, f"Processed {stats['total_subitems']}, expected 855"
    assert stats["names_split"] == 855, f"Names split: {stats['names_split']}, expected 855"


@test("transform_data: name is split and category inserted after baseTypeId")
def _():
    data = {
        "baseTypes": {
            "0": {
                "baseTypeId": 0,
                "subItems": {
                    "0": {
                        "sprite": "S1",
                        "subTypeId": 0,
                        "levelRequirement": 1,
                        "displayNameKey": "Item_Names.Test",
                        "isStartingItem": False,
                        "implicits": [],
                        "baseTypeId": 0,
                        "rarity": 0,
                        "id": "test123",
                        "name": "Iron Casque - Helmet",
                        "uniques": {},
                    }
                },
            }
        }
    }
    affix_map = {}
    stats = transform_data(data, affix_map)
    si = data["baseTypes"]["0"]["subItems"]["0"]

    assert si["name"] == "Iron Casque", f"Expected 'Iron Casque', got '{si['name']}'"
    assert si["category"] == "Helmet", f"Expected 'Helmet', got '{si.get('category')}'"
    assert stats["names_split"] == 1

    # Verify key order: category comes after baseTypeId
    keys = list(si.keys())
    bt_idx = keys.index("baseTypeId")
    cat_idx = keys.index("category")
    assert cat_idx == bt_idx + 1, f"category at {cat_idx}, baseTypeId at {bt_idx}"


@test("transform_data: removed fields are gone from subitems, uniques, and mods")
def _():
    data = {
        "baseTypes": {
            "0": {
                "baseTypeId": 0,
                "displayNameKey": "ShouldBeRemoved",
                "subItems": {
                    "0": {
                        "sprite": "S1",
                        "subTypeId": 0,
                        "levelRequirement": 1,
                        "displayNameKey": "ShouldBeRemoved",
                        "isStartingItem": True,
                        "implicits": [
                            {"property": 0, "specialTag": 1, "tags": 0, "type": 0, "implicitValue": 5}
                        ],
                        "baseTypeId": 0,
                        "rarity": 0,
                        "id": "test",
                        "name": "Test - Helmet",
                        "uniques": {
                            "1": {
                                "displayName": "TestUnique",
                                "sprite": "U1",
                                "loreText": "Some lore",
                                "basicMods": [
                                    {"property": 0, "specialTag": 2, "value": 1.0, "tags": 0, "type": 0}
                                ],
                                "uniqueId": 1,
                            }
                        },
                    }
                },
            }
        }
    }
    affix_map = {0: "Void Penetration"}
    transform_data(data, affix_map)

    bt = data["baseTypes"]["0"]
    si = bt["subItems"]["0"]
    u = si["uniques"]["1"]

    # SubItem: sprite, displayNameKey, isStartingItem removed
    assert "sprite" not in si, "sprite should be removed from subitem"
    assert "displayNameKey" not in si, "displayNameKey should be removed from subitem"
    assert "isStartingItem" not in si, "isStartingItem should be removed from subitem"

    # BaseType: displayNameKey removed
    assert "displayNameKey" not in bt, "displayNameKey should be removed from baseType"

    # Unique: sprite, loreText removed
    assert "sprite" not in u, "sprite should be removed from unique"
    assert "loreText" not in u, "loreText should be removed from unique"

    # Mods: specialTag removed
    assert "specialTag" not in si["implicits"][0], "specialTag should be removed from implicit"
    assert "specialTag" not in u["basicMods"][0], "specialTag should be removed from basicMod"

    # Affix names added
    assert si["implicits"][0]["affixName"] == "Void Penetration"
    assert u["basicMods"][0]["affixName"] == "Void Penetration"


@test("transform_data: preserves all other fields (no data loss)")
def _():
    with open(ITEMS_PATH, "r") as f:
        original = json.load(f)
    data = copy.deepcopy(original)
    affix_map = load_affix_map(AFFIXES_PATH)
    transform_data(data, affix_map)

    # Check that key fields still exist
    for bt_key, bt in data["baseTypes"].items():
        assert "baseTypeId" in bt, f"baseTypeId missing in baseType {bt_key}"
        assert "subItems" in bt, f"subItems missing in baseType {bt_key}"

        for si_key, si in bt["subItems"].items():
            assert "name" in si, f"name missing in subItem {si_key}"
            assert "category" in si, f"category missing in subItem {si_key}"
            assert "baseTypeId" in si, f"baseTypeId missing in subItem {si_key}"
            assert "rarity" in si, f"rarity missing in subItem {si_key}"
            assert "id" in si, f"id missing in subItem {si_key}"
            assert "subTypeId" in si, f"subTypeId missing in subItem {si_key}"
            assert "levelRequirement" in si, f"levelRequirement missing in subItem {si_key}"

            # Implicits should have affixName if property mapped
            for imp in si.get("implicits", []):
                assert "property" in imp, "property missing in implicit"

            # Uniques should be preserved
            orig_bt = original["baseTypes"][bt_key]
            orig_si = orig_bt["subItems"][si_key]
            orig_uniques = orig_si.get("uniques", {})
            curr_uniques = si.get("uniques", {})
            if isinstance(orig_uniques, dict):
                assert len(curr_uniques) == len(orig_uniques), \
                    f"Unique count mismatch: {len(curr_uniques)} vs {len(orig_uniques)}"


@test("full run_transform: produces valid JSON that can be re-loaded")
def _():
    # Work on a temp copy
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_items = os.path.join(tmpdir, "base_items.json")
        shutil.copy2(ITEMS_PATH, tmp_items)

        stats = run_transform(items_path=tmp_items, affixes_path=AFFIXES_PATH)

        # Re-load the written file
        with open(tmp_items, "r") as f:
            result = json.load(f)

        # Validate structure
        assert "baseTypes" in result
        total_si = sum(len(bt["subItems"]) for bt in result["baseTypes"].values())
        assert total_si == 855, f"Expected 855 subitems, got {total_si}"

        # Spot-check a known item
        si = result["baseTypes"]["0"]["subItems"]["0"]
        assert si["name"] == "Refuge Helmet", f"Name: {si['name']}"
        assert si["category"] == "Helmet", f"Category: {si.get('category')}"
        assert "sprite" not in si
        assert "displayNameKey" not in si
        assert "isStartingItem" not in si


@test("full run_transform: file size is reasonable (not empty, not bloated)")
def _():
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_items = os.path.join(tmpdir, "base_items.json")
        shutil.copy2(ITEMS_PATH, tmp_items)

        orig_size = os.path.getsize(tmp_items)
        run_transform(items_path=tmp_items, affixes_path=AFFIXES_PATH)
        new_size = os.path.getsize(tmp_items)

        # Should be smaller (removed fields) but not drastically (still has all data)
        assert new_size > 0, "Output file is empty!"
        # Adding affixName strings and category may offset removal of sprite/loreText
        # Just check it's within a reasonable range
        ratio = new_size / orig_size
        assert 0.5 < ratio < 2.0, f"Size ratio {ratio:.2f} seems wrong (orig={orig_size}, new={new_size})"
        print(f"        Size: {orig_size} -> {new_size} ({ratio:.2%})")


@test("full run_transform on real data: every subitem has category and no removed fields")
def _():
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_items = os.path.join(tmpdir, "base_items.json")
        shutil.copy2(ITEMS_PATH, tmp_items)

        run_transform(items_path=tmp_items, affixes_path=AFFIXES_PATH)

        with open(tmp_items, "r") as f:
            data = json.load(f)

        errors = []
        for bt_key, bt in data["baseTypes"].items():
            if "displayNameKey" in bt:
                errors.append(f"baseType {bt_key} still has displayNameKey")

            for si_key, si in bt["subItems"].items():
                if "category" not in si:
                    errors.append(f"subItem {bt_key}/{si_key} missing category")
                for field in SUBITEM_FIELDS_TO_REMOVE:
                    if field in si:
                        errors.append(f"subItem {bt_key}/{si_key} still has {field}")

                for imp in si.get("implicits", []):
                    if "specialTag" in imp:
                        errors.append(f"implicit in {bt_key}/{si_key} still has specialTag")

                uniques = si.get("uniques", {})
                if isinstance(uniques, dict):
                    for u_key, u in uniques.items():
                        for field in UNIQUE_FIELDS_TO_REMOVE:
                            if field in u:
                                errors.append(f"unique {u_key} in {bt_key}/{si_key} still has {field}")
                        for mod in u.get("basicMods", []):
                            if "specialTag" in mod:
                                errors.append(f"basicMod in unique {u_key} still has specialTag")

        if errors:
            raise AssertionError(f"{len(errors)} errors:\n" + "\n".join(errors[:10]))


@test("run_transform: doesn't modify affixes.json (read-only)")
def _():
    with open(AFFIXES_PATH, "r") as f:
        original_content = f.read()

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_items = os.path.join(tmpdir, "base_items.json")
        shutil.copy2(ITEMS_PATH, tmp_items)
        run_transform(items_path=tmp_items, affixes_path=AFFIXES_PATH)

    with open(AFFIXES_PATH, "r") as f:
        after_content = f.read()

    assert original_content == after_content, "affixes.json was modified!"


@test("idempotent: running transform twice produces same result")
def _():
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_items = os.path.join(tmpdir, "base_items.json")
        shutil.copy2(ITEMS_PATH, tmp_items)

        run_transform(items_path=tmp_items, affixes_path=AFFIXES_PATH)
        with open(tmp_items, "r") as f:
            first_result = f.read()

        run_transform(items_path=tmp_items, affixes_path=AFFIXES_PATH)
        with open(tmp_items, "r") as f:
            second_result = f.read()

        assert first_result == second_result, "Second run produced different output!"


# ─── Summary ───

print(f"\n{'='*50}")
print(f"Results: {passed} passed, {failed} failed, {passed + failed} total")
if failed > 0:
    print("SOME TESTS FAILED!")
    sys.exit(1)
else:
    print("ALL TESTS PASSED!")
    sys.exit(0)
