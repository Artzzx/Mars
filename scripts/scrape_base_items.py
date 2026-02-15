#!/usr/bin/env python3
"""
Scrape item names from lastepochtools.com and add them to last_epoch_base_items.json.

Uses curl_cffi to impersonate a real browser (TLS fingerprint) to bypass Cloudflare.
Saves progress incrementally — safe to interrupt and resume.

Requirements:
    pip install curl_cffi beautifulsoup4

Usage:
    python scripts/scrape_base_items.py                    # Full scrape
    python scripts/scrape_base_items.py --test             # Test with mock HTML (no network)
    python scripts/scrape_base_items.py --limit 20         # Scrape only first 20 missing items
    python scripts/scrape_base_items.py --delay 2.5        # Custom delay between requests (seconds)
"""

import argparse
import json
import os
import random
import re
import sys
import time
from pathlib import Path
from typing import Optional

# ---------------------------------------------------------------------------
# HTML parsing — BeautifulSoup
# ---------------------------------------------------------------------------
try:
    from bs4 import BeautifulSoup
except ImportError:
    print("ERROR: beautifulsoup4 is required.  pip install beautifulsoup4")
    sys.exit(1)

# ---------------------------------------------------------------------------
# HTTP client — curl_cffi (Cloudflare bypass via TLS fingerprint impersonation)
# ---------------------------------------------------------------------------
try:
    from curl_cffi import requests as cffi_requests
except ImportError:
    cffi_requests = None


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
BASE_URL = "https://www.lastepochtools.com/db/items"
JSON_PATH = Path(__file__).resolve().parent.parent / "public" / "last_epoch_base_items.json"
IMPERSONATE_BROWSERS = ["chrome", "chrome110", "chrome116", "chrome120", "edge99", "edge101"]

# Realistic headers
DEFAULT_HEADERS = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
}


def parse_item_name(html: str) -> Optional[str]:
    """Extract item name from the page HTML.

    Looks for: <a class="item-name rarity0" ...>Item Name</a>
    Falls back to any <a class="item-name ..."> element.
    """
    soup = BeautifulSoup(html, "html.parser")

    # Primary: exact pattern from the user's example
    tag = soup.select_one('a.item-name[item-id]')
    if tag:
        name = tag.get_text(strip=True)
        if name:
            return name

    # Fallback: any element with class containing "item-name"
    tag = soup.select_one('[class*="item-name"]')
    if tag:
        name = tag.get_text(strip=True)
        if name:
            return name

    # Fallback: look for the name in a meta og:title or <title>
    og = soup.select_one('meta[property="og:title"]')
    if og and og.get("content"):
        content = og["content"].strip()
        # Strip site suffix like " - Last Epoch Tools"
        content = re.sub(r"\s*[-|]\s*Last Epoch.*$", "", content).strip()
        if content:
            return content

    return None


def create_session():
    """Create a curl_cffi session with browser impersonation."""
    if cffi_requests is None:
        raise RuntimeError("curl_cffi is required for live scraping.  pip install curl_cffi")

    browser = random.choice(IMPERSONATE_BROWSERS)
    session = cffi_requests.Session(impersonate=browser)
    session.headers.update(DEFAULT_HEADERS)
    return session, browser


def fetch_item_page(session, item_id: str, max_retries: int = 3, base_delay: float = 2.0) -> Optional[str]:
    """Fetch a single item page with retries and exponential backoff.

    Returns the HTML string or None on failure.
    """
    url = f"{BASE_URL}/{item_id}"

    for attempt in range(max_retries):
        try:
            resp = session.get(url, timeout=30)

            if resp.status_code == 200:
                return resp.text

            if resp.status_code == 403:
                # Cloudflare challenge — rotate browser fingerprint
                print(f"    [!] 403 on attempt {attempt + 1}, rotating browser fingerprint...")
                browser = random.choice(IMPERSONATE_BROWSERS)
                session.close()
                session = cffi_requests.Session(impersonate=browser)
                session.headers.update(DEFAULT_HEADERS)

            elif resp.status_code == 429:
                print(f"    [!] Rate limited (429) on attempt {attempt + 1}, backing off...")

            else:
                print(f"    [!] HTTP {resp.status_code} on attempt {attempt + 1}")

        except Exception as e:
            print(f"    [!] Request error on attempt {attempt + 1}: {e}")

        # Exponential backoff with jitter
        delay = base_delay * (2 ** attempt) + random.uniform(0.5, 2.0)
        print(f"    Waiting {delay:.1f}s before retry...")
        time.sleep(delay)

    return None


def load_json(path: Path) -> dict:
    """Load the base items JSON."""
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(path: Path, data: dict) -> None:
    """Save JSON incrementally — overwrites only the file, not the structure.

    Uses atomic write (write to tmp then rename) to avoid corruption on interrupt.
    """
    tmp_path = path.with_suffix(".json.tmp")
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")
    os.replace(tmp_path, path)


def collect_items_to_scrape(data: dict) -> list:
    """Return list of (baseTypeKey, subItemKey, item_id) for items missing a 'name'."""
    items = []
    for bt_key, bt in data.get("baseTypes", {}).items():
        for si_key, si in bt.get("subItems", {}).items():
            item_id = si.get("id")
            if item_id and "name" not in si:
                items.append((bt_key, si_key, item_id))
    return items


def count_named(data: dict) -> int:
    """Count how many sub-items already have a 'name' field."""
    count = 0
    for bt in data.get("baseTypes", {}).values():
        for si in bt.get("subItems", {}).values():
            if "name" in si:
                count += 1
    return count


# ---------------------------------------------------------------------------
# Mock HTML for --test mode
# ---------------------------------------------------------------------------
MOCK_HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head><title>{name} - Last Epoch Tools</title></head>
<body>
<div class="item-header">
  <a class="item-name rarity0" item-id="{item_id}" target="_blank"
     href="/db/items/{item_id}">{name}</a>
</div>
</body>
</html>"""

# Realistic fake names keyed by position index
MOCK_NAMES = [
    "Runed Visage", "Iron Helm", "Crimson Plate", "Shadow Boots",
    "Ancient Gauntlets", "Arcane Belt", "Void Staff", "Flame Wand",
    "Glacier Bow", "Thunder Shield", "Jade Amulet", "Silver Ring",
    "Bone Relic", "Storm Dagger", "Crystal Sceptre", "Dawn Blade",
    "Granite Mace", "Oak Spear", "Silk Quiver", "Obsidian Catalyst",
    "Elder Idol", "Blessed Idol", "War Idol", "Fury Idol", "Grace Idol",
]


def mock_fetch(_session, item_id: str, **_kwargs) -> Optional[str]:
    """Return mock HTML for testing without network access."""
    # Deterministic name from item_id hash
    idx = hash(item_id) % len(MOCK_NAMES)
    name = f"{MOCK_NAMES[idx]} ({item_id[:6]})"
    return MOCK_HTML_TEMPLATE.format(name=name, item_id=item_id)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def run_scrape(
    json_path: Path,
    test_mode: bool = False,
    limit: int = 0,
    delay: float = 1.5,
    save_every: int = 5,
):
    """Main scraping loop.

    Args:
        json_path: Path to last_epoch_base_items.json
        test_mode: Use mock HTML instead of real HTTP
        limit: Max items to scrape (0 = all)
        delay: Seconds between requests
        save_every: Save to disk every N successful scrapes
    """
    if not json_path.exists():
        print(f"ERROR: {json_path} not found")
        sys.exit(1)

    data = load_json(json_path)
    total_sub_items = sum(
        len(bt.get("subItems", {})) for bt in data.get("baseTypes", {}).values()
    )
    already_named = count_named(data)
    print(f"Loaded {json_path.name}: {total_sub_items} sub-items, {already_named} already named")

    to_scrape = collect_items_to_scrape(data)
    print(f"Items needing names: {len(to_scrape)}")

    if limit > 0:
        to_scrape = to_scrape[:limit]
        print(f"Limiting to first {limit} items")

    if not to_scrape:
        print("Nothing to scrape — all items already have names!")
        return

    # Setup fetcher
    session = None
    fetch_fn = mock_fetch
    if not test_mode:
        if cffi_requests is None:
            print("ERROR: curl_cffi is required for live scraping.  pip install curl_cffi")
            sys.exit(1)
        session, browser = create_session()
        fetch_fn = fetch_item_page
        print(f"Using curl_cffi with browser impersonation: {browser}")

        # Warm up session by visiting the main page first
        print("Warming up session (visiting main items page)...")
        try:
            warmup = session.get("https://www.lastepochtools.com/db/items", timeout=30)
            print(f"  Warmup status: {warmup.status_code}")
            time.sleep(random.uniform(1.0, 2.0))
        except Exception as e:
            print(f"  Warmup failed: {e} (continuing anyway)")
    else:
        print("TEST MODE: using mock HTML (no network)")

    success = 0
    failures = 0
    unsaved = 0

    for i, (bt_key, si_key, item_id) in enumerate(to_scrape):
        print(f"[{i + 1}/{len(to_scrape)}] baseType={bt_key} subItem={si_key} id={item_id} ... ", end="", flush=True)

        html = fetch_fn(session, item_id)
        if html is None:
            print("FAILED (no response)")
            failures += 1
            continue

        name = parse_item_name(html)
        if name is None:
            print("FAILED (could not parse name)")
            failures += 1
            # Check if we got a Cloudflare challenge page
            if "challenge" in html.lower() or "cf-" in html.lower():
                print("    [!] Likely a Cloudflare challenge page. Increasing delay...")
                time.sleep(delay * 3)
            continue

        # Add name to the sub-item (in-memory mutation — preserves all other fields)
        data["baseTypes"][bt_key]["subItems"][si_key]["name"] = name
        success += 1
        unsaved += 1
        print(f"OK -> \"{name}\"")

        # Save periodically
        if unsaved >= save_every:
            save_json(json_path, data)
            unsaved = 0
            print(f"  [saved to disk — {count_named(data)}/{total_sub_items} named]")

        # Delay between requests (with jitter)
        if not test_mode and i < len(to_scrape) - 1:
            jitter = random.uniform(delay * 0.5, delay * 1.5)
            time.sleep(jitter)

    # Final save
    if unsaved > 0:
        save_json(json_path, data)

    # Cleanup
    if session:
        session.close()

    named_total = count_named(data)
    print(f"\nDone! {success} scraped, {failures} failed")
    print(f"Total named: {named_total}/{total_sub_items}")

    return success, failures


def main():
    parser = argparse.ArgumentParser(
        description="Scrape item names from lastepochtools.com into last_epoch_base_items.json"
    )
    parser.add_argument(
        "--test", action="store_true",
        help="Test mode: use mock HTML, no network access"
    )
    parser.add_argument(
        "--limit", type=int, default=0,
        help="Max items to scrape (0 = all)"
    )
    parser.add_argument(
        "--delay", type=float, default=1.5,
        help="Base delay between requests in seconds (default: 1.5)"
    )
    parser.add_argument(
        "--save-every", type=int, default=5,
        help="Save to disk every N successful scrapes (default: 5)"
    )
    parser.add_argument(
        "--json", type=str, default=str(JSON_PATH),
        help=f"Path to JSON file (default: {JSON_PATH})"
    )
    args = parser.parse_args()

    run_scrape(
        json_path=Path(args.json),
        test_mode=args.test,
        limit=args.limit,
        delay=args.delay,
        save_every=args.save_every,
    )


if __name__ == "__main__":
    main()
