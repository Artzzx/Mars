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
from transform_base_items import transform_data, run_transform

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
ITEMS_PATH = os.path.join(PROJECT_ROOT, "public", "last_epoch_base_items.json")

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

@test("transform_data: removes affixName from implicits")
def _():
    data = {
        "baseTypes": {
            "0": {
                "subItems": {
                    "0": {
                        "implicits": [
                            {"property": 10, "tags": 0, "type": 0, "affixName": "Necrotic Resistance"},
                            {"property": 8, "tags": 0, "type": 0, "affixName": "Armor"},
                        ],
                        "uniques": {},
                    }
                }
            }
        }
    }
    stats = transform_data(data)
    assert stats["affixNames_removed"] == 2, f"Expected 2, got {stats['affixNames_removed']}"


@test("transform_data: removes implicits array entirely")
def _():
    data = {
        "baseTypes": {
            "0": {
                "subItems": {
                    "0": {
                        "implicits": [{"property": 10, "affixName": "Test"}],
                        "uniques": {},
                    }
                }
            }
        }
    }
    transform_data(data)
    si = data["baseTypes"]["0"]["subItems"]["0"]
    assert "implicits" not in si, "implicits should be removed"


@test("transform_data: removes basicMods from uniques")
def _():
    data = {
        "baseTypes": {
            "0": {
                "subItems": {
                    "0": {
                        "uniques": {
                            "1": {
                                "displayName": "TestUnique",
                                "basicMods": [
                                    {"property": 1, "affixName": "Armor", "value": 1.5},
                                ],
                            }
                        },
                    }
                }
            }
        }
    }
    stats = transform_data(data)
    u = data["baseTypes"]["0"]["subItems"]["0"]["uniques"]["1"]
    assert "basicMods" not in u, "basicMods should be removed from unique"
    assert stats["basicMods_removed"] == 1
    assert stats["affixNames_removed"] == 1


@test("transform_data: removes itemTags from subitems")
def _():
    data = {
        "baseTypes": {
            "0": {
                "subItems": {
                    "0": {
                        "itemTags": 0,
                        "name": "Test",
                        "uniques": {},
                    }
                }
            }
        }
    }
    stats = transform_data(data)
    si = data["baseTypes"]["0"]["subItems"]["0"]
    assert "itemTags" not in si, "itemTags should be removed"
    assert stats["itemTags_removed"] == 1


@test("transform_data: preserves other subitem fields")
def _():
    data = {
        "baseTypes": {
            "0": {
                "subItems": {
                    "0": {
                        "subTypeId": 0,
                        "levelRequirement": 5,
                        "name": "Iron Casque",
                        "category": "Helmet",
                        "baseTypeId": 0,
                        "rarity": 0,
                        "id": "abc123",
                        "itemTags": 0,
                        "implicits": [{"property": 1}],
                        "uniques": {},
                    }
                }
            }
        }
    }
    transform_data(data)
    si = data["baseTypes"]["0"]["subItems"]["0"]
    assert si["name"] == "Iron Casque"
    assert si["category"] == "Helmet"
    assert si["baseTypeId"] == 0
    assert si["rarity"] == 0
    assert si["id"] == "abc123"
    assert si["levelRequirement"] == 5
    assert si["subTypeId"] == 0


@test("transform_data: preserves other unique fields after basicMods removal")
def _():
    data = {
        "baseTypes": {
            "0": {
                "subItems": {
                    "0": {
                        "uniques": {
                            "1": {
                                "displayName": "Calamity",
                                "uniqueId": 1,
                                "levelRequirement": 10,
                                "rarity": 7,
                                "basicMods": [{"property": 1, "affixName": "Armor"}],
                                "descriptionParts": [{"description": "test"}],
                            }
                        },
                    }
                }
            }
        }
    }
    transform_data(data)
    u = data["baseTypes"]["0"]["subItems"]["0"]["uniques"]["1"]
    assert u["displayName"] == "Calamity"
    assert u["uniqueId"] == 1
    assert u["levelRequirement"] == 10
    assert u["rarity"] == 7
    assert u["descriptionParts"] == [{"description": "test"}]
    assert "basicMods" not in u


@test("transform_data: handles subitems without implicits/itemTags/uniques gracefully")
def _():
    data = {
        "baseTypes": {
            "0": {
                "subItems": {
                    "0": {
                        "name": "Minimal Item",
                        "baseTypeId": 0,
                    }
                }
            }
        }
    }
    stats = transform_data(data)
    assert stats["total_subitems"] == 1
    assert stats["implicits_removed"] == 0
    assert stats["itemTags_removed"] == 0


# ─── Integration Tests (using real data) ───

@test("real data: processes all 855 subitems without error")
def _():
    with open(ITEMS_PATH, "r") as f:
        data = json.load(f)

    original_count = sum(len(bt["subItems"]) for bt in data["baseTypes"].values())
    assert original_count == 855, f"Expected 855, got {original_count}"

    stats = transform_data(data)
    assert stats["total_subitems"] == 855, f"Processed {stats['total_subitems']}"


@test("real data: all implicits removed from every subitem")
def _():
    with open(ITEMS_PATH, "r") as f:
        data = json.load(f)
    transform_data(data)

    for bt_key, bt in data["baseTypes"].items():
        for si_key, si in bt["subItems"].items():
            assert "implicits" not in si, f"implicits still in baseType {bt_key} subItem {si_key}"


@test("real data: all basicMods removed from every unique")
def _():
    with open(ITEMS_PATH, "r") as f:
        data = json.load(f)
    transform_data(data)

    for bt_key, bt in data["baseTypes"].items():
        for si_key, si in bt["subItems"].items():
            uniques = si.get("uniques", {})
            if isinstance(uniques, dict):
                for u_key, u in uniques.items():
                    assert "basicMods" not in u, \
                        f"basicMods still in unique {u_key} (baseType {bt_key}, subItem {si_key})"


@test("real data: all itemTags removed from every subitem")
def _():
    with open(ITEMS_PATH, "r") as f:
        data = json.load(f)
    transform_data(data)

    for bt_key, bt in data["baseTypes"].items():
        for si_key, si in bt["subItems"].items():
            assert "itemTags" not in si, f"itemTags still in baseType {bt_key} subItem {si_key}"


@test("real data: no affixName left anywhere")
def _():
    with open(ITEMS_PATH, "r") as f:
        data = json.load(f)
    transform_data(data)

    # Check the full JSON string for any remaining affixName
    result_str = json.dumps(data)
    assert "affixName" not in result_str, "affixName still present somewhere in the data"


@test("full run_transform: produces valid JSON that can be re-loaded")
def _():
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_items = os.path.join(tmpdir, "base_items.json")
        shutil.copy2(ITEMS_PATH, tmp_items)

        stats = run_transform(items_path=tmp_items)

        # Re-load and validate
        with open(tmp_items, "r") as f:
            result = json.load(f)

        assert "baseTypes" in result
        total_si = sum(len(bt["subItems"]) for bt in result["baseTypes"].values())
        assert total_si == 855, f"Expected 855 subitems, got {total_si}"

        # Spot-check
        si = result["baseTypes"]["0"]["subItems"]["0"]
        assert "name" in si
        assert "implicits" not in si
        assert "itemTags" not in si


@test("full run_transform: file size is smaller (fields removed)")
def _():
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_items = os.path.join(tmpdir, "base_items.json")
        shutil.copy2(ITEMS_PATH, tmp_items)

        orig_size = os.path.getsize(tmp_items)
        run_transform(items_path=tmp_items)
        new_size = os.path.getsize(tmp_items)

        assert new_size > 0, "Output file is empty!"
        assert new_size < orig_size, f"File should be smaller after removal: {orig_size} -> {new_size}"
        print(f"        Size: {orig_size} -> {new_size} ({new_size/orig_size:.2%})")


@test("idempotent: running transform twice produces same result")
def _():
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_items = os.path.join(tmpdir, "base_items.json")
        shutil.copy2(ITEMS_PATH, tmp_items)

        run_transform(items_path=tmp_items)
        with open(tmp_items, "r") as f:
            first_result = f.read()

        run_transform(items_path=tmp_items)
        with open(tmp_items, "r") as f:
            second_result = f.read()

        assert first_result == second_result, "Second run produced different output!"


@test("full run_transform: preserves baseType count and subItem count (no data loss)")
def _():
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_items = os.path.join(tmpdir, "base_items.json")
        shutil.copy2(ITEMS_PATH, tmp_items)

        with open(ITEMS_PATH, "r") as f:
            original = json.load(f)
        orig_bt_count = len(original["baseTypes"])
        orig_unique_count = sum(
            len(si.get("uniques", {}))
            for bt in original["baseTypes"].values()
            for si in bt["subItems"].values()
            if isinstance(si.get("uniques", {}), dict)
        )

        run_transform(items_path=tmp_items)
        with open(tmp_items, "r") as f:
            result = json.load(f)

        assert len(result["baseTypes"]) == orig_bt_count, "BaseType count changed"
        result_unique_count = sum(
            len(si.get("uniques", {}))
            for bt in result["baseTypes"].values()
            for si in bt["subItems"].values()
            if isinstance(si.get("uniques", {}), dict)
        )
        assert result_unique_count == orig_unique_count, \
            f"Unique count changed: {orig_unique_count} -> {result_unique_count}"


# ─── Summary ───

print(f"\n{'='*50}")
print(f"Results: {passed} passed, {failed} failed, {passed + failed} total")
if failed > 0:
    print("SOME TESTS FAILED!")
    sys.exit(1)
else:
    print("ALL TESTS PASSED!")
    sys.exit(0)
