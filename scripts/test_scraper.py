#!/usr/bin/env python3
"""Unit tests for scrape_base_items.py — validates parsing, incremental updates, and resume logic."""

import json
import tempfile
import shutil
from pathlib import Path

from scrape_base_items import parse_item_name, collect_items_to_scrape, count_named, save_json, load_json


def test_parse_exact_html():
    """Test parsing the exact HTML pattern from the user's example."""
    html = '''<a class="item-name rarity0" item-id="IIwBjIJgZnI" target="_blank"
         href="/db/items/IIwBjIJgZnI">Runed Visage</a>'''
    assert parse_item_name(html) == "Runed Visage"


def test_parse_different_rarity():
    """Test parsing with different rarity classes."""
    for rarity in range(6):
        html = f'<a class="item-name rarity{rarity}" item-id="abc123">Test Item {rarity}</a>'
        assert parse_item_name(html) == f"Test Item {rarity}"


def test_parse_full_page():
    """Test parsing from a realistic full HTML page."""
    html = """<!DOCTYPE html>
    <html><head><title>Runed Visage - Last Epoch Tools</title></head>
    <body>
    <div class="main-content">
      <div class="item-header">
        <a class="item-name rarity0" item-id="IIwBjIJgZnI" target="_blank"
           href="/db/items/IIwBjIJgZnI">Runed Visage</a>
        <div class="item-details">Some details</div>
      </div>
    </div>
    </body></html>"""
    assert parse_item_name(html) == "Runed Visage"


def test_parse_special_characters():
    """Test parsing names with special characters."""
    html = '<a class="item-name rarity0" item-id="x">Dragon\'s Breath &amp; Shield</a>'
    name = parse_item_name(html)
    assert name is not None
    assert "Dragon" in name


def test_parse_og_title_fallback():
    """Test fallback to og:title meta tag."""
    html = '''<html><head>
    <meta property="og:title" content="Crimson Plate - Last Epoch Tools" />
    </head><body></body></html>'''
    assert parse_item_name(html) == "Crimson Plate"


def test_parse_returns_none_for_empty():
    """Test that empty/invalid HTML returns None."""
    assert parse_item_name("") is None
    assert parse_item_name("<html><body>Nothing here</body></html>") is None


def test_parse_cloudflare_challenge():
    """Test that Cloudflare challenge pages return None."""
    html = """<html><head><title>Just a moment...</title></head>
    <body><div id="cf-challenge-running">Checking your browser...</div></body></html>"""
    assert parse_item_name(html) is None


def test_incremental_update():
    """Test that JSON is updated incrementally without rewriting."""
    # Create a temp JSON with known structure
    data = {
        "metadata": {"extractedAt": "2026-01-01", "totalBaseTypes": 1},
        "baseTypes": {
            "0": {
                "baseTypeId": 0,
                "subItems": {
                    "0": {"id": "abc", "sprite": "I0", "levelRequirement": 5},
                    "1": {"id": "def", "sprite": "I1", "levelRequirement": 10},
                    "2": {"id": "ghi", "sprite": "I2", "levelRequirement": 15, "name": "Already Named"},
                }
            }
        }
    }

    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        json.dump(data, f)
        tmp_path = Path(f.name)

    try:
        loaded = load_json(tmp_path)

        # Items needing scrape should exclude "Already Named"
        to_scrape = collect_items_to_scrape(loaded)
        assert len(to_scrape) == 2
        assert to_scrape[0] == ("0", "0", "abc")
        assert to_scrape[1] == ("0", "1", "def")

        # Named count
        assert count_named(loaded) == 1

        # Simulate adding a name
        loaded["baseTypes"]["0"]["subItems"]["0"]["name"] = "Test Helmet"
        save_json(tmp_path, loaded)

        # Reload and verify
        reloaded = load_json(tmp_path)
        assert reloaded["baseTypes"]["0"]["subItems"]["0"]["name"] == "Test Helmet"
        assert reloaded["baseTypes"]["0"]["subItems"]["0"]["sprite"] == "I0"  # original preserved
        assert reloaded["baseTypes"]["0"]["subItems"]["0"]["levelRequirement"] == 5  # original preserved
        assert reloaded["baseTypes"]["0"]["subItems"]["2"]["name"] == "Already Named"  # untouched
        assert "name" not in reloaded["baseTypes"]["0"]["subItems"]["1"]  # still no name
        assert reloaded["metadata"]["extractedAt"] == "2026-01-01"  # metadata preserved

        # Now only 1 item should need scraping
        to_scrape2 = collect_items_to_scrape(reloaded)
        assert len(to_scrape2) == 1
        assert to_scrape2[0] == ("0", "1", "def")

    finally:
        tmp_path.unlink(missing_ok=True)


def test_resume_skips_named():
    """Test that items with 'name' field are skipped on resume."""
    data = {
        "metadata": {},
        "baseTypes": {
            "0": {
                "subItems": {
                    "0": {"id": "a", "name": "Already Done"},
                    "1": {"id": "b"},
                    "2": {"id": "c", "name": "Also Done"},
                    "3": {"id": "d"},
                }
            }
        }
    }
    to_scrape = collect_items_to_scrape(data)
    assert len(to_scrape) == 2
    ids = [x[2] for x in to_scrape]
    assert "b" in ids
    assert "d" in ids
    assert "a" not in ids
    assert "c" not in ids


def test_10_consecutive_parses():
    """Criterion #2: validate the parser works for at least 10 consecutive items."""
    successes = 0
    for i in range(10):
        html = f'''<html><body>
        <a class="item-name rarity0" item-id="item{i}">Test Item Number {i}</a>
        </body></html>'''
        name = parse_item_name(html)
        assert name == f"Test Item Number {i}", f"Failed on item {i}: got {name}"
        successes += 1
    assert successes == 10
    print(f"  Parsed {successes}/10 items successfully")


if __name__ == "__main__":
    tests = [
        test_parse_exact_html,
        test_parse_different_rarity,
        test_parse_full_page,
        test_parse_special_characters,
        test_parse_og_title_fallback,
        test_parse_returns_none_for_empty,
        test_parse_cloudflare_challenge,
        test_incremental_update,
        test_resume_skips_named,
        test_10_consecutive_parses,
    ]

    passed = 0
    failed = 0
    for test in tests:
        try:
            test()
            print(f"  PASS: {test.__name__}")
            passed += 1
        except AssertionError as e:
            print(f"  FAIL: {test.__name__} — {e}")
            failed += 1
        except Exception as e:
            print(f"  ERROR: {test.__name__} — {e}")
            failed += 1

    print(f"\n{passed}/{passed + failed} tests passed")
    if failed:
        exit(1)
