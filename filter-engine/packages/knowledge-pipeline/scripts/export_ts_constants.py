"""
export_ts_constants.py
One-time helper (also used in CI) to serialize TypeScript game constants to JSON
so the Python pipeline can consume them without a Node.js dependency at runtime.

Run from the filter-engine directory:
    python packages/knowledge-pipeline/scripts/export_ts_constants.py

Writes: date/mappings/game-constants.json
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

# ─────────────────────────────────────────────────────────────────────────────
# Paths
# ─────────────────────────────────────────────────────────────────────────────

REPO_ROOT = Path(__file__).resolve().parents[3]  # filter-engine/
TS_GAME_DIR = REPO_ROOT / "filter-compiler" / "src" / "knowledge" / "game"
OUTPUT_FILE = REPO_ROOT / "date" / "mappings" / "game-constants.json"


# ─────────────────────────────────────────────────────────────────────────────
# Node.js evaluation strategy (primary)
# ─────────────────────────────────────────────────────────────────────────────

def _try_node_extract(ts_file: Path, export_name: str) -> object | None:
    """Try to use node to evaluate a TS constant and return the parsed value."""
    script = f"""
const fs = require('fs');
const content = fs.readFileSync('{ts_file}', 'utf8');
// Strip TypeScript type annotations for evaluation
const stripped = content
  .replace(/export type [^;]+;/g, '')
  .replace(/export interface [^{{]*\\{{[^}}]*\\}}/gs, '')
  .replace(/as const satisfies [^;,]+/g, '')
  .replace(/as const/g, '')
  .replace(/readonly /g, '')
  .replace(/: Record<[^>]+>/g, '')
  .replace(/export (function|class) [\\s\\S]*?^}}/gm, '')
  .replace(/import [^;]+;/g, '')
  .replace(/: [A-Z][A-Za-z<>\\[\\], |]+(?=[,=\\){{])/g, '');
try {{
  const exports = {{}};
  eval(stripped.replace(/^export const /gm, 'exports.').replace(/^export /gm, ''));
  console.log(JSON.stringify(exports['{export_name}']));
}} catch(e) {{
  process.stderr.write('node eval failed: ' + e.message + '\\n');
  process.exit(1);
}}
"""
    try:
        result = subprocess.run(
            ["node", "-e", script],
            capture_output=True, text=True, timeout=10
        )
        if result.returncode == 0 and result.stdout.strip():
            return json.loads(result.stdout.strip())
    except (subprocess.TimeoutExpired, FileNotFoundError, json.JSONDecodeError):
        pass
    return None


# ─────────────────────────────────────────────────────────────────────────────
# Regex extraction strategy (fallback — reliable for well-structured TS)
# ─────────────────────────────────────────────────────────────────────────────

def _extract_class_hierarchy(content: str) -> dict:
    """Extract CLASS_HIERARCHY from classes.ts."""
    result = {}
    # Find each class block: primalist: { ... },
    class_pattern = re.compile(
        r"(\w+):\s*\{[^}]*baseClass:\s*'(\w+)'[^}]*masteries:\s*\[([^\]]+)\]"
        r"[^}]*exclusiveAffinities:\s*\[([^\]]+)\]"
        r"[^}]*irrelevantAffinities:\s*\[([^\]]+)\]"
        r"[^}]*label:\s*'([^']+)'",
        re.DOTALL,
    )
    for m in class_pattern.finditer(content):
        key = m.group(1)
        masteries = re.findall(r"'(\w+)'", m.group(3))
        exclusive = re.findall(r"'(\w+)'", m.group(4))
        irrelevant = re.findall(r"'(\w+)'", m.group(5))
        label = m.group(6)
        result[key] = {
            "baseClass": m.group(2),
            "masteries": masteries,
            "exclusiveAffinities": exclusive,
            "irrelevantAffinities": irrelevant,
            "label": label,
        }
    return result


def _extract_mastery_to_class(content: str) -> dict:
    """Extract MASTERY_TO_CLASS from classes.ts."""
    result = {}
    pattern = re.compile(r"(\w+):\s*'(\w+)'")
    in_block = False
    for line in content.splitlines():
        if "MASTERY_TO_CLASS" in line:
            in_block = True
            continue
        if in_block:
            if "} as const" in line or line.strip() == "};":
                break
            m = pattern.search(line)
            if m:
                result[m.group(1)] = m.group(2)
    return result


def _extract_damage_type_profiles(content: str) -> dict:
    """Extract DAMAGE_TYPE_PROFILES from damage-types.ts."""
    result = {}
    # Find each damage type block
    type_blocks = re.split(r"\n  (?=\w+:\s*\{)", content)
    for block in type_blocks:
        name_m = re.match(r"\s*(\w+):\s*\{", block)
        if not name_m:
            continue
        name = name_m.group(1)
        if name in ("fire", "cold", "lightning", "void", "necrotic", "poison", "physical"):
            primary = _extract_id_array(block, "primaryAffixIds")
            synergy = _extract_id_array(block, "synergyAffixIds")
            if primary is not None or synergy is not None:
                result[name] = {
                    "primaryAffixIds": primary or [],
                    "synergyAffixIds": synergy or [],
                }
    return result


def _extract_id_array(content: str, key: str) -> list[int] | None:
    """Extract an array of integer IDs from a TS block."""
    pattern = re.compile(
        rf"{key}:\s*\[([^\]]*)\]",
        re.DOTALL,
    )
    m = pattern.search(content)
    if not m:
        return None
    raw = m.group(1)
    # Extract numbers (ignore comments)
    return [int(n) for n in re.findall(r"\b(\d+)\b", raw)]


def _extract_threshold_affix_ids(content: str) -> list[int]:
    """Extract THRESHOLD_AFFIX_IDS from threshold-affixes.ts."""
    # Look for the Set constructor or array, or extract affixId fields from THRESHOLD_AFFIXES
    ids: list[int] = []
    # Try: new Set([...]) or affixId: N
    set_m = re.search(r"THRESHOLD_AFFIX_IDS\s*=\s*new Set\(\[([^\]]+)\]\)", content)
    if set_m:
        ids = [int(n) for n in re.findall(r"\b(\d+)\b", set_m.group(1))]
    else:
        # Extract from THRESHOLD_AFFIXES array: affixId: N
        ids = [int(m.group(1)) for m in re.finditer(r"affixId:\s*(\d+)", content)]
    return ids


def _extract_affix_overrides(content: str) -> list[dict]:
    """Extract AFFIX_CLASSIFICATION_OVERRIDES from affix-overrides.ts."""
    results = []
    # Match each override object: { affixId: N, affixName: '...', isDamageLocked: bool, reason: '...', author: '...' }
    entry_pattern = re.compile(
        r"\{[^}]*affixId:\s*(\d+)[^}]*affixName:\s*'([^']*)'[^}]*isDamageLocked:\s*(true|false)[^}]*reason:\s*'([^']*)'",
        re.DOTALL,
    )
    for m in entry_pattern.finditer(content):
        results.append({
            "affixId": int(m.group(1)),
            "affixName": m.group(2),
            "isDamageLocked": m.group(3) == "true",
            "reason": m.group(4),
        })
    return results


def _extract_affix_edges(content: str) -> list[dict]:
    """Extract AFFIX_EDGES from affix-graph.ts."""
    results = []
    # Match each edge object
    entry_pattern = re.compile(
        r"\{[^}]*from:\s*(\d+)[^}]*to:\s*(\d+)[^}]*type:\s*'(SYNERGY|PREREQUISITE)'[^}]*"
        r"strength:\s*([\d.]+)[^}]*(?:condition:\s*(?:'([^']*)'|null))?",
        re.DOTALL,
    )
    for m in entry_pattern.finditer(content):
        results.append({
            "from": int(m.group(1)),
            "to": int(m.group(2)),
            "type": m.group(3),
            "strength": float(m.group(4)),
            "condition": m.group(5) or None,
        })
    return results


# ─────────────────────────────────────────────────────────────────────────────
# Main extraction
# ─────────────────────────────────────────────────────────────────────────────

def extract_all() -> dict:
    files = {
        "classes": TS_GAME_DIR / "classes.ts",
        "damage_types": TS_GAME_DIR / "damage-types.ts",
        "threshold_affixes": TS_GAME_DIR / "threshold-affixes.ts",
        "affix_overrides": TS_GAME_DIR / "affix-overrides.ts",
        "affix_graph": TS_GAME_DIR / "affix-graph.ts",
    }

    for name, path in files.items():
        if not path.exists():
            print(f"[ERROR] Missing file: {path}", file=sys.stderr)
            sys.exit(1)

    classes_content = files["classes"].read_text(encoding="utf-8")
    damage_content = files["damage_types"].read_text(encoding="utf-8")
    threshold_content = files["threshold_affixes"].read_text(encoding="utf-8")
    overrides_content = files["affix_overrides"].read_text(encoding="utf-8")
    graph_content = files["affix_graph"].read_text(encoding="utf-8")

    print("Extracting class hierarchy...")
    class_hierarchy = _extract_class_hierarchy(classes_content)
    mastery_to_class = _extract_mastery_to_class(classes_content)

    print("Extracting damage type profiles...")
    damage_type_profiles = _extract_damage_type_profiles(damage_content)

    print("Extracting threshold affix IDs...")
    threshold_affix_ids = _extract_threshold_affix_ids(threshold_content)

    print("Extracting affix overrides...")
    affix_overrides = _extract_affix_overrides(overrides_content)

    print("Extracting affix graph edges...")
    affix_edges = _extract_affix_edges(graph_content)

    # Validate we got something reasonable
    assert class_hierarchy, "Failed to extract class hierarchy"
    assert mastery_to_class, "Failed to extract mastery-to-class mapping"
    assert damage_type_profiles, "Failed to extract damage type profiles"
    assert threshold_affix_ids, "Failed to extract threshold affix IDs"

    print(f"  classes: {len(class_hierarchy)}")
    print(f"  mastery_to_class: {len(mastery_to_class)}")
    print(f"  damage_type_profiles: {len(damage_type_profiles)}")
    print(f"  threshold_affix_ids: {len(threshold_affix_ids)}")
    print(f"  affix_overrides: {len(affix_overrides)}")
    print(f"  affix_edges: {len(affix_edges)}")

    return {
        "class_hierarchy": class_hierarchy,
        "mastery_to_class": mastery_to_class,
        "damage_type_profiles": damage_type_profiles,
        "threshold_affix_ids": sorted(set(threshold_affix_ids)),
        "affix_overrides": affix_overrides,
        "affix_edges": affix_edges,
    }


def main() -> None:
    print(f"Reading TypeScript constants from: {TS_GAME_DIR}")
    print(f"Writing to: {OUTPUT_FILE}")

    data = extract_all()

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(
        json.dumps(data, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    print(f"\nWrote {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
