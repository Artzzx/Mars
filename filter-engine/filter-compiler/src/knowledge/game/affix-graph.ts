/**
 * affix-graph.ts
 * SYNERGY and PREREQUISITE relationships between affixes.
 * These are game mechanic facts, not meta opinions.
 *
 * All affixId values are sourced from MasterAffixesList.json.
 * Idol affixes (affixName contains "idol") are excluded.
 *
 * SYNERGY:     If affix A is high priority, affix B gets a weight boost.
 * PREREQUISITE: Affix A is only relevant if condition B is true for the build.
 *               If the prerequisite fails, the affix weight is zeroed.
 *
 * NO CONFLICT edges — Last Epoch prevents the same affix rolling twice
 * on one item by game rules, making conflict modeling redundant.
 *
 * PREREQUISITE `to` field: the anchor affix that represents the build archetype.
 * It is a semantic reference, not a functional dependency.
 */

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type EdgeType = 'SYNERGY' | 'PREREQUISITE';

export interface AffixEdge {
  readonly from: number;           // affix ID (from MasterAffixesList.json)
  readonly to: number;             // affix ID (from MasterAffixesList.json)
  readonly type: EdgeType;
  /**
   * For SYNERGY: 0–1, how strongly the from affix boosts the to affix.
   * For PREREQUISITE: always 1 (binary gate — condition met or affix zeroed).
   */
  readonly strength: number;
  /**
   * Human-readable condition for PREREQUISITE edges.
   * Evaluated by the compiler against the resolved build context.
   * For SYNERGY edges, set to empty string.
   */
  readonly condition: string;
  readonly reason: string;
}

// ─────────────────────────────────────────────
// Quick-reference ID map (non-idol affixes)
// ─────────────────────────────────────────────
//
//    0  Void Penetration              25  Added Health
//    2  Increased Melee Attack Speed  26  Increased Minion Damage
//    3  Added Block Chance            28  Increased Movement Speed
//    4  Increased Cast Speed          30  Increased Physical Damage
//    5  Increased Critical Strike Ch. 31  Added Armor
//    6  Added Critical Strike Multi   32  Fire Penetration
//    8  Added Dodge Rating            33  Physical Penetration
//    9  Increased Elemental Damage    34  Added Mana
//   11  Freeze Rate Multiplier        35  Cold Penetration
//   12  Increased Fire Damage         37  Poison Penetration
//   15  Increased Void Damage         38  Increased Spell Damage
//   16  Increased Cold Damage         39  Lightning Penetration
//   18  Increased Necrotic Damage     40  Leech Rate
//   22  Increased Health Regen        41  Health Gained on Block
//   23  Increased Lightning Damage    44  Health On Melee Hit
//   24  Lightning Resistance          49  Added Spell Damage For Swords
//   52  Increased Health              72  Increased Damage Over Time
//   54  Chance To Poison              73  Minion Health Regen (class_gated)
//   55  Chance To Ignite              74  Less Damage Taken on Block
//   56  Chance To Chill               76  Added Melee Void Damage
//   57  Chance To Slow                77  Added Melee Fire Damage
//   58  Increased Stun Chance         78  Added Melee Cold Damage
//   59  Increased Dodge Rating        79  Added Melee Lightning Damage
//   61  Increased Poison Damage       81  Added Block Effectiveness
//   62  Added Melee Crit Chance       83  Potion Health Converted to Ward
//   63  Added Melee Physical Damage   84  Increased Spell Crit Chance
//   66  Ward On Potion Use            85  Chance To Shock
//   68  Chance to Inflict Bleed       86  Armor Shred Chance
//   69  Melee Health Leech            87  Increased Throwing Attack Speed
//   70  Minion Health (class_gated)   88  Added Throwing Damage (class_gated)
//   71  Minion Dodge Rating           89  Increased Melee Damage
//   90  Health Regen                  91  Increased Melee Stun Chance
//   92  Endurance                     93  Necrotic Penetration
//   98  Increased Minion Dmg Over Time 99 Ward Gained on Kill
//  100  Increased Elemental DoT       101 Increased Area for Area Skills
//  103  Damage While Channelling      104 All Resistances While Channelling
//  330  Increased Mana Regen          334 Primalist Totem Added Spell Damage
//  342  Primalist Totem Increased Cast Speed
//  352  Primalist Increased Totem Crit Chance
//  357  Primalist Increased Totem Damage
//  425  Endurance Threshold           428 Melee Frailty Chance
//  431  Increased Bow Damage          432 Increased Bow Attack Speed
//  433  Added Bow Physical Damage     434 Added Bow Fire Damage
//  669  Added Bow Lightning Damage    670 Added Bow Cold Damage
//  671  Area for Melee Area Skills    382 Ward Per Second (class_gated)

// ─────────────────────────────────────────────
// Affix Graph Edges
// ─────────────────────────────────────────────

export const AFFIX_EDGES: readonly AffixEdge[] = [

  // ══ SYNERGY EDGES ══════════════════════════════════════════════════════════

  // ── Crit system ────────────────────────────────────────────────────────────
  // Crit chance and crit multiplier scale each other multiplicatively.
  // Any source of crit chance is therefore synergistic with crit multiplier.
  {
    from: 5,   // Increased Critical Strike Chance
    to: 6,     // Added Critical Strike Multiplier
    type: 'SYNERGY',
    strength: 0.9,
    condition: '',
    reason: 'Crit chance and multiplier scale each other multiplicatively. High crit chance makes multiplier more valuable and vice versa.',
  },
  {
    from: 6,   // Added Critical Strike Multiplier
    to: 5,     // Increased Critical Strike Chance
    type: 'SYNERGY',
    strength: 0.9,
    condition: '',
    reason: 'Bidirectional — crit multiplier is wasted without reasonable crit chance.',
  },
  {
    from: 62,  // Added Melee Crit Chance
    to: 6,     // Added Critical Strike Multiplier
    type: 'SYNERGY',
    strength: 0.8,
    condition: '',
    reason: 'Melee crit chance feeds into the same global crit multiplier.',
  },
  {
    from: 84,  // Increased Spell Crit Chance
    to: 6,     // Added Critical Strike Multiplier
    type: 'SYNERGY',
    strength: 0.8,
    condition: '',
    reason: 'Spell crit chance feeds into the same global crit multiplier.',
  },

  // ── Penetration + damage type (bidirectional) ──────────────────────────────
  // Penetration scales raw damage dealt. The two are multiplicatively linked:
  // high base damage increases the benefit of penetration, and vice versa.
  {
    from: 32,  // Fire Penetration
    to: 12,    // Increased Fire Damage
    type: 'SYNERGY',
    strength: 0.7,
    condition: '',
    reason: 'Penetration multiplies the effective value of base fire damage.',
  },
  {
    from: 12,  // Increased Fire Damage
    to: 32,    // Fire Penetration
    type: 'SYNERGY',
    strength: 0.7,
    condition: '',
    reason: 'High fire damage makes fire penetration proportionally more valuable.',
  },
  {
    from: 35,  // Cold Penetration
    to: 16,    // Increased Cold Damage
    type: 'SYNERGY',
    strength: 0.7,
    condition: '',
    reason: 'Same penetration + base damage relationship as fire.',
  },
  {
    from: 16,  // Increased Cold Damage
    to: 35,    // Cold Penetration
    type: 'SYNERGY',
    strength: 0.7,
    condition: '',
    reason: 'High cold damage makes cold penetration more valuable.',
  },
  {
    from: 39,  // Lightning Penetration
    to: 23,    // Increased Lightning Damage
    type: 'SYNERGY',
    strength: 0.7,
    condition: '',
    reason: 'Same penetration + base damage relationship as fire.',
  },
  {
    from: 23,  // Increased Lightning Damage
    to: 39,    // Lightning Penetration
    type: 'SYNERGY',
    strength: 0.7,
    condition: '',
    reason: 'High lightning damage makes lightning penetration more valuable.',
  },
  {
    from: 33,  // Physical Penetration
    to: 30,    // Increased Physical Damage
    type: 'SYNERGY',
    strength: 0.7,
    condition: '',
    reason: 'Physical penetration reduces armor, scaling all physical damage dealt.',
  },
  {
    from: 30,  // Increased Physical Damage
    to: 33,    // Physical Penetration
    type: 'SYNERGY',
    strength: 0.7,
    condition: '',
    reason: 'High physical damage makes armor shred and penetration more valuable.',
  },
  {
    from: 93,  // Necrotic Penetration
    to: 18,    // Increased Necrotic Damage
    type: 'SYNERGY',
    strength: 0.7,
    condition: '',
    reason: 'Penetration scales with base damage — same pattern as other elements.',
  },
  {
    from: 18,  // Increased Necrotic Damage
    to: 93,    // Necrotic Penetration
    type: 'SYNERGY',
    strength: 0.7,
    condition: '',
    reason: 'High necrotic damage makes necrotic penetration more valuable.',
  },
  {
    from: 37,  // Poison Penetration
    to: 61,    // Increased Poison Damage
    type: 'SYNERGY',
    strength: 0.75,
    condition: '',
    reason: 'Poison penetration is only relevant when actively scaling poison damage.',
  },
  {
    from: 61,  // Increased Poison Damage
    to: 37,    // Poison Penetration
    type: 'SYNERGY',
    strength: 0.75,
    condition: '',
    reason: 'Scaling poison damage increases the value of resistance reduction.',
  },
  {
    from: 0,   // Void Penetration
    to: 15,    // Increased Void Damage
    type: 'SYNERGY',
    strength: 0.7,
    condition: '',
    reason: 'Void penetration scales with void base damage.',
  },
  {
    from: 15,  // Increased Void Damage
    to: 0,     // Void Penetration
    type: 'SYNERGY',
    strength: 0.7,
    condition: '',
    reason: 'High void damage makes void penetration proportionally more impactful.',
  },

  // ── Elemental umbrella ─────────────────────────────────────────────────────
  // "Increased Elemental Damage" boosts all three elemental types.
  // If a build runs fire/cold/lightning, the elemental umbrella becomes
  // a synergy for each of those specific damage types.
  {
    from: 9,   // Increased Elemental Damage
    to: 12,    // Increased Fire Damage
    type: 'SYNERGY',
    strength: 0.5,
    condition: '',
    reason: 'Elemental damage is a flat multiplier on top of specific elemental mods; they stack additively with each other but the umbrella amplifies all of them.',
  },
  {
    from: 9,   // Increased Elemental Damage
    to: 16,    // Increased Cold Damage
    type: 'SYNERGY',
    strength: 0.5,
    condition: '',
    reason: 'Same as above for cold damage.',
  },
  {
    from: 9,   // Increased Elemental Damage
    to: 23,    // Increased Lightning Damage
    type: 'SYNERGY',
    strength: 0.5,
    condition: '',
    reason: 'Same as above for lightning damage.',
  },
  {
    from: 100, // Increased Elemental Damage Over Time
    to: 72,    // Increased Damage Over Time
    type: 'SYNERGY',
    strength: 0.65,
    condition: '',
    reason: 'Elemental DoT and generic DoT stack additively — both belong in the same DoT build.',
  },
  {
    from: 72,  // Increased Damage Over Time
    to: 100,   // Increased Elemental Damage Over Time
    type: 'SYNERGY',
    strength: 0.65,
    condition: '',
    reason: 'Generic DoT scales elemental DoT sources; they complement each other.',
  },

  // ── Ailment application + scaling ─────────────────────────────────────────
  // Applying an ailment is only valuable if you also scale its damage/duration.
  // Conversely, investing in scaling rewards applying more reliably.
  {
    from: 54,  // Chance To Poison
    to: 61,    // Increased Poison Damage
    type: 'SYNERGY',
    strength: 0.85,
    condition: '',
    reason: 'Applying poison has no value without scaling it. These two are tightly coupled.',
  },
  {
    from: 61,  // Increased Poison Damage
    to: 54,    // Chance To Poison
    type: 'SYNERGY',
    strength: 0.85,
    condition: '',
    reason: 'Scaling poison requires applying it — bidirectional coupling.',
  },
  {
    from: 54,  // Chance To Poison
    to: 37,    // Poison Penetration
    type: 'SYNERGY',
    strength: 0.7,
    condition: '',
    reason: 'Poison builds naturally pair with poison penetration to maximise damage.',
  },
  {
    from: 61,  // Increased Poison Damage
    to: 72,    // Increased Damage Over Time
    type: 'SYNERGY',
    strength: 0.7,
    condition: '',
    reason: 'Poison is a DoT; generic DoT scaling stacks additively with poison-specific scaling.',
  },
  {
    from: 55,  // Chance To Ignite
    to: 12,    // Increased Fire Damage
    type: 'SYNERGY',
    strength: 0.7,
    condition: '',
    reason: 'Ignite deals fire DoT; fire damage scaling multiplies ignite damage.',
  },
  {
    from: 55,  // Chance To Ignite
    to: 72,    // Increased Damage Over Time
    type: 'SYNERGY',
    strength: 0.65,
    condition: '',
    reason: 'Ignite is a DoT — generic DoT scaling applies to ignite damage.',
  },
  {
    from: 56,  // Chance To Chill
    to: 16,    // Increased Cold Damage
    type: 'SYNERGY',
    strength: 0.65,
    condition: '',
    reason: 'Chill builds heavily invest in cold damage, making both affixes relevant together.',
  },
  {
    from: 11,  // Freeze Rate Multiplier
    to: 16,    // Increased Cold Damage
    type: 'SYNERGY',
    strength: 0.7,
    condition: '',
    reason: 'Freeze builds are cold builds — freeze rate and cold damage scaling go hand in hand.',
  },
  {
    from: 85,  // Chance To Shock
    to: 23,    // Increased Lightning Damage
    type: 'SYNERGY',
    strength: 0.7,
    condition: '',
    reason: 'Shock builds invest in lightning damage, making both affixes co-relevant.',
  },
  {
    from: 68,  // Chance to Inflict Bleed
    to: 30,    // Increased Physical Damage
    type: 'SYNERGY',
    strength: 0.7,
    condition: '',
    reason: 'Bleed is a physical DoT — physical damage scaling multiplies bleed damage.',
  },
  {
    from: 68,  // Chance to Inflict Bleed
    to: 33,    // Physical Penetration
    type: 'SYNERGY',
    strength: 0.65,
    condition: '',
    reason: 'Bleed scales with physical damage; penetration increases effective damage dealt.',
  },

  // ── Melee: attack speed + damage ───────────────────────────────────────────
  {
    from: 2,   // Increased Melee Attack Speed
    to: 89,    // Increased Melee Damage
    type: 'SYNERGY',
    strength: 0.75,
    condition: '',
    reason: 'Attack speed scales DPS multiplicatively with damage; each benefits from the other.',
  },
  {
    from: 89,  // Increased Melee Damage
    to: 2,     // Increased Melee Attack Speed
    type: 'SYNERGY',
    strength: 0.75,
    condition: '',
    reason: 'Bidirectional — high melee damage per hit makes attack speed more valuable.',
  },
  {
    from: 2,   // Increased Melee Attack Speed
    to: 62,    // Added Melee Crit Chance
    type: 'SYNERGY',
    strength: 0.6,
    condition: '',
    reason: 'Faster attacks generate more crit attempts; attack speed and crit chance synergise on DPS.',
  },
  {
    from: 86,  // Armor Shred Chance
    to: 89,    // Increased Melee Damage
    type: 'SYNERGY',
    strength: 0.65,
    condition: '',
    reason: 'Armor shred amplifies all physical damage dealt — pairing it with melee damage increases output.',
  },
  {
    from: 86,  // Armor Shred Chance
    to: 63,    // Added Melee Physical Damage
    type: 'SYNERGY',
    strength: 0.65,
    condition: '',
    reason: 'More base physical damage means armor shred reduces a larger effective resistance pool.',
  },
  {
    from: 63,  // Added Melee Physical Damage
    to: 33,    // Physical Penetration
    type: 'SYNERGY',
    strength: 0.6,
    condition: '',
    reason: 'Physical base damage and penetration scale the same hits; both belong in a physical melee build.',
  },
  {
    from: 69,  // Melee Health Leech
    to: 89,    // Increased Melee Damage
    type: 'SYNERGY',
    strength: 0.6,
    condition: '',
    reason: 'Leech scales with damage dealt — higher melee damage means more sustain.',
  },

  // ── Bow: attack speed + damage ─────────────────────────────────────────────
  {
    from: 432, // Increased Bow Attack Speed
    to: 431,   // Increased Bow Damage
    type: 'SYNERGY',
    strength: 0.8,
    condition: '',
    reason: 'Bow attack speed and damage scale DPS multiplicatively — tightly coupled for any bow build.',
  },
  {
    from: 431, // Increased Bow Damage
    to: 432,   // Increased Bow Attack Speed
    type: 'SYNERGY',
    strength: 0.8,
    condition: '',
    reason: 'Bidirectional — high bow damage per hit rewards faster attack speed.',
  },
  {
    from: 433, // Added Bow Physical Damage
    to: 431,   // Increased Bow Damage
    type: 'SYNERGY',
    strength: 0.7,
    condition: '',
    reason: 'Added flat damage and increased % damage stack additively then multiply together.',
  },
  {
    from: 433, // Added Bow Physical Damage
    to: 33,    // Physical Penetration
    type: 'SYNERGY',
    strength: 0.6,
    condition: '',
    reason: 'Physical bow builds benefit from armor penetration the same way melee physical builds do.',
  },

  // ── Throwing: speed + damage ───────────────────────────────────────────────
  {
    from: 87,  // Increased Throwing Attack Speed
    to: 88,    // Added Throwing Damage
    type: 'SYNERGY',
    strength: 0.75,
    condition: '',
    reason: 'Attack speed and flat damage scale DPS together for throwing builds.',
  },

  // ── Spell: cast speed + damage ─────────────────────────────────────────────
  {
    from: 4,   // Increased Cast Speed
    to: 38,    // Increased Spell Damage
    type: 'SYNERGY',
    strength: 0.75,
    condition: '',
    reason: 'Cast speed scales effective DPS of spell builds; both belong in any caster.',
  },
  {
    from: 38,  // Increased Spell Damage
    to: 4,     // Increased Cast Speed
    type: 'SYNERGY',
    strength: 0.75,
    condition: '',
    reason: 'Bidirectional — high spell damage per cast makes cast speed more impactful.',
  },
  {
    from: 84,  // Increased Spell Crit Chance
    to: 38,    // Increased Spell Damage
    type: 'SYNERGY',
    strength: 0.7,
    condition: '',
    reason: 'Spell crit chance and spell damage both amplify spell output; crit is only worth stacking if damage is already high.',
  },
  {
    from: 38,  // Increased Spell Damage
    to: 84,    // Increased Spell Crit Chance
    type: 'SYNERGY',
    strength: 0.7,
    condition: '',
    reason: 'High spell damage per cast makes spell crit proportionally more impactful.',
  },
  {
    from: 103, // Damage While Channelling
    to: 38,    // Increased Spell Damage
    type: 'SYNERGY',
    strength: 0.7,
    condition: '',
    reason: 'Channelling builds want both generic spell damage and the channelling-specific multiplier.',
  },

  // ── Minion synergies ────────────────────────────────────────────────────────
  // Minion builds split investment between offence (damage) and survival
  // (health, regen, dodge). Both axes matter because dead minions deal no damage.
  {
    from: 26,  // Increased Minion Damage
    to: 98,    // Increased Minion Damage Over Time
    type: 'SYNERGY',
    strength: 0.75,
    condition: '',
    reason: 'Generic minion damage scales both hits and DoT sources; DoT scaling synergises with the base multiplier.',
  },
  {
    from: 98,  // Increased Minion Damage Over Time
    to: 26,    // Increased Minion Damage
    type: 'SYNERGY',
    strength: 0.75,
    condition: '',
    reason: 'Bidirectional — DoT minion builds need the base damage multiplier as well.',
  },
  {
    from: 26,  // Increased Minion Damage
    to: 70,    // Minion Health
    type: 'SYNERGY',
    strength: 0.7,
    condition: '',
    reason: 'Minion builds need minions alive to deal damage — offensive and defensive minion affixes are co-relevant.',
  },
  {
    from: 70,  // Minion Health
    to: 26,    // Increased Minion Damage
    type: 'SYNERGY',
    strength: 0.7,
    condition: '',
    reason: 'Survivable minions create a stable offensive platform — both sides of the minion equation matter.',
  },
  {
    from: 70,  // Minion Health
    to: 73,    // Minion Health Regen
    type: 'SYNERGY',
    strength: 0.8,
    condition: '',
    reason: 'Larger health pools make health regen proportionally more effective and vice versa.',
  },
  {
    from: 73,  // Minion Health Regen
    to: 70,    // Minion Health
    type: 'SYNERGY',
    strength: 0.8,
    condition: '',
    reason: 'Bidirectional — regen without a large pool is weak; large pool without regen is slow to recover.',
  },
  {
    from: 26,  // Increased Minion Damage
    to: 71,    // Minion Dodge Rating
    type: 'SYNERGY',
    strength: 0.6,
    condition: '',
    reason: 'Survivable minions deal more cumulative damage; dodge rating reduces incoming hits.',
  },

  // ── Health / sustain synergies ─────────────────────────────────────────────
  {
    from: 25,  // Added Health
    to: 52,    // Increased Health
    type: 'SYNERGY',
    strength: 0.85,
    condition: '',
    reason: '% increased health multiplies the added flat health; the two scale each other.',
  },
  {
    from: 52,  // Increased Health
    to: 25,    // Added Health
    type: 'SYNERGY',
    strength: 0.85,
    condition: '',
    reason: 'Bidirectional — flat health pool is the base that % modifiers multiply.',
  },
  {
    from: 25,  // Added Health
    to: 90,    // Health Regen
    type: 'SYNERGY',
    strength: 0.6,
    condition: '',
    reason: 'Larger health pool makes regen (flat value) replenish a smaller fraction — investing in both keeps sustain meaningful.',
  },
  {
    from: 52,  // Increased Health
    to: 22,    // Increased Health Regen
    type: 'SYNERGY',
    strength: 0.6,
    condition: '',
    reason: 'Similar logic to above — high health pool rewards investing in regen rate.',
  },
  {
    from: 40,  // Leech Rate
    to: 69,    // Melee Health Leech
    type: 'SYNERGY',
    strength: 0.75,
    condition: '',
    reason: 'Leech rate multiplies the amount leeched per hit — only valuable if there is a leech source.',
  },

  // ── Endurance ──────────────────────────────────────────────────────────────
  {
    from: 92,  // Endurance
    to: 425,   // Endurance Threshold
    type: 'SYNERGY',
    strength: 0.8,
    condition: '',
    reason: 'Endurance threshold determines how often the endurance mechanic activates; both affixes must scale together to be effective.',
  },
  {
    from: 425, // Endurance Threshold
    to: 92,    // Endurance
    type: 'SYNERGY',
    strength: 0.8,
    condition: '',
    reason: 'Bidirectional — endurance stacks are wasted without an adequate threshold.',
  },

  // ── Block synergies ─────────────────────────────────────────────────────────
  // Block is a sub-system: chance → effectiveness → on-block rewards.
  // All block affixes form a coherent cluster.
  {
    from: 3,   // Added Block Chance
    to: 81,    // Added Block Effectiveness
    type: 'SYNERGY',
    strength: 0.85,
    condition: '',
    reason: 'Block chance and block effectiveness scale each other — chance determines how often you block, effectiveness determines how much damage is mitigated.',
  },
  {
    from: 81,  // Added Block Effectiveness
    to: 3,     // Added Block Chance
    type: 'SYNERGY',
    strength: 0.85,
    condition: '',
    reason: 'Bidirectional — high effectiveness is wasted at low block chance.',
  },
  {
    from: 3,   // Added Block Chance
    to: 41,    // Health Gained on Block
    type: 'SYNERGY',
    strength: 0.75,
    condition: '',
    reason: 'More frequent blocks translate directly into more healing from on-block effects.',
  },
  {
    from: 3,   // Added Block Chance
    to: 74,    // Less Damage Taken on Block
    type: 'SYNERGY',
    strength: 0.75,
    condition: '',
    reason: 'Damage reduction on block is only valuable when blocks happen frequently.',
  },

  // ── Dodge synergies ─────────────────────────────────────────────────────────
  {
    from: 8,   // Added Dodge Rating
    to: 59,    // Increased Dodge Rating
    type: 'SYNERGY',
    strength: 0.85,
    condition: '',
    reason: '% increased dodge multiplies the flat dodge pool; they scale each other directly.',
  },
  {
    from: 59,  // Increased Dodge Rating
    to: 8,     // Added Dodge Rating
    type: 'SYNERGY',
    strength: 0.85,
    condition: '',
    reason: 'Bidirectional — the flat pool is the base for % modifiers.',
  },

  // ── Ward synergies ──────────────────────────────────────────────────────────
  {
    from: 83,  // Potion Health Converted to Ward
    to: 99,    // Ward Gained on Kill
    type: 'SYNERGY',
    strength: 0.7,
    condition: '',
    reason: 'Ward builds stack multiple ward generation sources; both belong in the same archetype.',
  },
  {
    from: 99,  // Ward Gained on Kill
    to: 382,   // Ward Per Second
    type: 'SYNERGY',
    strength: 0.65,
    condition: '',
    reason: 'Ward-per-second sustains the pool between kill bursts — both are ward generation sources for the same build.',
  },

  // ── Primalist totem cluster ─────────────────────────────────────────────────
  {
    from: 357, // Primalist Increased Totem Damage
    to: 334,   // Primalist Totem Added Spell Damage
    type: 'SYNERGY',
    strength: 0.85,
    condition: '',
    reason: 'Flat and % totem spell damage stack additively with each other, rewarding stacking both.',
  },
  {
    from: 334, // Primalist Totem Added Spell Damage
    to: 357,   // Primalist Increased Totem Damage
    type: 'SYNERGY',
    strength: 0.85,
    condition: '',
    reason: 'Bidirectional — flat spell damage is the base that % multipliers scale.',
  },
  {
    from: 342, // Primalist Totem Increased Cast Speed
    to: 357,   // Primalist Increased Totem Damage
    type: 'SYNERGY',
    strength: 0.7,
    condition: '',
    reason: 'Totems benefit from both cast speed and damage — they scale DPS multiplicatively.',
  },
  {
    from: 352, // Primalist Increased Totem Crit Chance
    to: 357,   // Primalist Increased Totem Damage
    type: 'SYNERGY',
    strength: 0.75,
    condition: '',
    reason: 'Totem crit chance is valuable only when totem damage is high enough to reward critting.',
  },


  // ══ PREREQUISITE EDGES ═════════════════════════════════════════════════════
  //
  // These gate affixes that are worthless when a build condition is false.
  // The `to` field is the anchor affix representing the build archetype;
  // the `condition` is evaluated against the compiled build context.

  // ── Melee prerequisites ────────────────────────────────────────────────────
  {
    from: 2,   // Increased Melee Attack Speed
    to: 89,    // Increased Melee Damage  (anchor = "this is a melee build")
    type: 'PREREQUISITE',
    strength: 1,
    condition: 'build.attackType === "melee"',
    reason: 'Melee attack speed has zero value for spell casters or ranged builds.',
  },
  {
    from: 62,  // Added Melee Crit Chance
    to: 89,    // Increased Melee Damage
    type: 'PREREQUISITE',
    strength: 1,
    condition: 'build.attackType === "melee"',
    reason: 'Melee crit chance only applies to melee attacks.',
  },
  {
    from: 63,  // Added Melee Physical Damage
    to: 89,    // Increased Melee Damage
    type: 'PREREQUISITE',
    strength: 1,
    condition: 'build.attackType === "melee"',
    reason: 'Flat melee damage is zero value outside of melee.',
  },
  {
    from: 77,  // Added Melee Fire Damage
    to: 89,    // Increased Melee Damage
    type: 'PREREQUISITE',
    strength: 1,
    condition: 'build.attackType === "melee"',
    reason: 'Melee-specific flat elemental damage applies only to melee hits.',
  },
  {
    from: 78,  // Added Melee Cold Damage
    to: 89,
    type: 'PREREQUISITE',
    strength: 1,
    condition: 'build.attackType === "melee"',
    reason: 'Melee-specific flat elemental damage applies only to melee hits.',
  },
  {
    from: 79,  // Added Melee Lightning Damage
    to: 89,
    type: 'PREREQUISITE',
    strength: 1,
    condition: 'build.attackType === "melee"',
    reason: 'Melee-specific flat elemental damage applies only to melee hits.',
  },
  {
    from: 76,  // Added Melee Void Damage
    to: 89,
    type: 'PREREQUISITE',
    strength: 1,
    condition: 'build.attackType === "melee"',
    reason: 'Melee-specific flat elemental damage applies only to melee hits.',
  },
  {
    from: 69,  // Melee Health Leech
    to: 89,    // Increased Melee Damage
    type: 'PREREQUISITE',
    strength: 1,
    condition: 'build.attackType === "melee"',
    reason: 'Melee leech has zero value for non-melee builds.',
  },
  {
    from: 91,  // Increased Melee Stun Chance
    to: 89,    // Increased Melee Damage
    type: 'PREREQUISITE',
    strength: 1,
    condition: 'build.attackType === "melee"',
    reason: 'Melee stun chance only applies to melee attacks.',
  },
  {
    from: 428, // Melee Frailty Chance
    to: 89,    // Increased Melee Damage
    type: 'PREREQUISITE',
    strength: 1,
    condition: 'build.attackType === "melee"',
    reason: 'Frailty from melee hits requires the build to be making melee attacks.',
  },
  {
    from: 44,  // Health On Melee Hit
    to: 89,    // Increased Melee Damage
    type: 'PREREQUISITE',
    strength: 1,
    condition: 'build.attackType === "melee"',
    reason: 'On-hit health sustain requires melee attacks to trigger.',
  },
  {
    from: 671, // Area for Melee Area Skills
    to: 89,    // Increased Melee Damage
    type: 'PREREQUISITE',
    strength: 1,
    condition: 'build.attackType === "melee"',
    reason: 'Melee area skills only exist in the melee attack archetype.',
  },

  // ── Spell / cast prerequisites ─────────────────────────────────────────────
  {
    from: 4,   // Increased Cast Speed
    to: 38,    // Increased Spell Damage  (anchor = "this is a spell build")
    type: 'PREREQUISITE',
    strength: 1,
    condition: 'build.attackType === "spell"',
    reason: 'Cast speed has zero value for melee or ranged attack builds.',
  },
  {
    from: 84,  // Increased Spell Crit Chance
    to: 38,    // Increased Spell Damage
    type: 'PREREQUISITE',
    strength: 1,
    condition: 'build.attackType === "spell"',
    reason: 'Spell crit chance only applies to spell casts.',
  },
  {
    from: 49,  // Added Spell Damage For Swords
    to: 38,    // Increased Spell Damage
    type: 'PREREQUISITE',
    strength: 1,
    condition: 'build.attackType === "spell" && build.weaponType === "sword"',
    reason: 'Requires both a spell build and a sword — zero value otherwise.',
  },
  {
    from: 103, // Damage While Channelling
    to: 38,    // Increased Spell Damage
    type: 'PREREQUISITE',
    strength: 1,
    condition: 'build.channelling === true',
    reason: 'Channelling damage modifier applies only while actively channelling a skill.',
  },
  {
    from: 104, // All Resistances While Channelling
    to: 38,    // Increased Spell Damage
    type: 'PREREQUISITE',
    strength: 1,
    condition: 'build.channelling === true',
    reason: 'Channelling defensive bonus only applies while channelling — zero value for non-channelling builds.',
  },

  // ── Bow prerequisites ──────────────────────────────────────────────────────
  {
    from: 432, // Increased Bow Attack Speed
    to: 431,   // Increased Bow Damage  (anchor = "this is a bow build")
    type: 'PREREQUISITE',
    strength: 1,
    condition: 'build.weaponType === "bow"',
    reason: 'Bow attack speed is zero value without a bow.',
  },
  {
    from: 433, // Added Bow Physical Damage
    to: 431,   // Increased Bow Damage
    type: 'PREREQUISITE',
    strength: 1,
    condition: 'build.weaponType === "bow"',
    reason: 'Bow-specific flat damage requires a bow to be equipped.',
  },
  {
    from: 434, // Added Bow Fire Damage
    to: 431,   // Increased Bow Damage
    type: 'PREREQUISITE',
    strength: 1,
    condition: 'build.weaponType === "bow"',
    reason: 'Bow-specific flat elemental damage requires a bow.',
  },
  {
    from: 669, // Added Bow Lightning Damage
    to: 431,   // Increased Bow Damage
    type: 'PREREQUISITE',
    strength: 1,
    condition: 'build.weaponType === "bow"',
    reason: 'Bow-specific flat elemental damage requires a bow.',
  },
  {
    from: 670, // Added Bow Cold Damage
    to: 431,   // Increased Bow Damage
    type: 'PREREQUISITE',
    strength: 1,
    condition: 'build.weaponType === "bow"',
    reason: 'Bow-specific flat elemental damage requires a bow.',
  },

  // ── Throwing prerequisites ─────────────────────────────────────────────────
  {
    from: 87,  // Increased Throwing Attack Speed
    to: 88,    // Added Throwing Damage  (anchor = "this is a throwing build")
    type: 'PREREQUISITE',
    strength: 1,
    condition: 'build.attackType === "throwing"',
    reason: 'Throwing attack speed is meaningless outside of throwing builds.',
  },

  // ── Physical damage prerequisites ──────────────────────────────────────────
  {
    from: 86,  // Armor Shred Chance
    to: 30,    // Increased Physical Damage
    type: 'PREREQUISITE',
    strength: 1,
    condition: 'build.damageType === "physical"',
    reason: 'Armor shred only reduces physical resistance — zero value for non-physical builds.',
  },
  {
    from: 33,  // Physical Penetration
    to: 30,    // Increased Physical Damage
    type: 'PREREQUISITE',
    strength: 1,
    condition: 'build.damageType === "physical"',
    reason: 'Physical penetration only benefits physical damage builds.',
  },

  // ── Minion prerequisites ───────────────────────────────────────────────────
  {
    from: 98,  // Increased Minion Damage Over Time
    to: 26,    // Increased Minion Damage  (anchor = "this build uses minions")
    type: 'PREREQUISITE',
    strength: 1,
    condition: 'build.usesMinions === true',
    reason: 'Minion affixes are worthless for builds without minions.',
  },
  {
    from: 70,  // Minion Health
    to: 26,    // Increased Minion Damage
    type: 'PREREQUISITE',
    strength: 1,
    condition: 'build.usesMinions === true',
    reason: 'Minion health affixes are worthless without active minions.',
  },
  {
    from: 71,  // Minion Dodge Rating
    to: 26,    // Increased Minion Damage
    type: 'PREREQUISITE',
    strength: 1,
    condition: 'build.usesMinions === true',
    reason: 'Minion dodge rating is worthless without active minions.',
  },
  {
    from: 73,  // Minion Health Regen
    to: 26,    // Increased Minion Damage
    type: 'PREREQUISITE',
    strength: 1,
    condition: 'build.usesMinions === true',
    reason: 'Minion health regen is worthless without active minions.',
  },

  // ── Shield / block prerequisites ───────────────────────────────────────────
  {
    from: 3,   // Added Block Chance
    to: 25,    // Added Health  (anchor = "this build uses a shield")
    type: 'PREREQUISITE',
    strength: 1,
    condition: 'build.usesShield === true',
    reason: 'Block mechanics require an equipped shield — zero value without one.',
  },
  {
    from: 81,  // Added Block Effectiveness
    to: 25,    // Added Health
    type: 'PREREQUISITE',
    strength: 1,
    condition: 'build.usesShield === true',
    reason: 'Block effectiveness requires an equipped shield.',
  },
  {
    from: 41,  // Health Gained on Block
    to: 25,    // Added Health
    type: 'PREREQUISITE',
    strength: 1,
    condition: 'build.usesShield === true',
    reason: 'On-block healing requires a shield to proc.',
  },
  {
    from: 74,  // Less Damage Taken on Block
    to: 25,    // Added Health
    type: 'PREREQUISITE',
    strength: 1,
    condition: 'build.usesShield === true',
    reason: 'Block damage reduction requires an equipped shield.',
  },

  // ── Ward prerequisites ─────────────────────────────────────────────────────
  {
    from: 83,  // Potion Health Converted to Ward
    to: 99,    // Ward Gained on Kill  (anchor = "this is a ward build")
    type: 'PREREQUISITE',
    strength: 1,
    condition: 'build.usesWard === true',
    reason: 'Converting health to ward is only meaningful when the build relies on ward as its defence.',
  },
  {
    from: 66,  // Ward On Potion Use
    to: 99,    // Ward Gained on Kill
    type: 'PREREQUISITE',
    strength: 1,
    condition: 'build.usesWard === true',
    reason: 'Ward-on-potion is wasted if the build uses health as its primary defense layer.',
  },
  {
    from: 382, // Ward Per Second
    to: 99,    // Ward Gained on Kill
    type: 'PREREQUISITE',
    strength: 1,
    condition: 'build.usesWard === true',
    reason: 'Ward-per-second sustain is only relevant in ward-centric builds.',
  },

  // ── Totem prerequisites (Primalist) ────────────────────────────────────────
  {
    from: 334, // Primalist Totem Added Spell Damage
    to: 357,   // Primalist Increased Totem Damage  (anchor = "this is a totem build")
    type: 'PREREQUISITE',
    strength: 1,
    condition: 'build.usesTotems === true',
    reason: 'Totem-specific affixes have zero value for non-totem Primalist builds.',
  },
  {
    from: 342, // Primalist Totem Increased Cast Speed
    to: 357,   // Primalist Increased Totem Damage
    type: 'PREREQUISITE',
    strength: 1,
    condition: 'build.usesTotems === true',
    reason: 'Totem cast speed is only relevant when using totem skills.',
  },
  {
    from: 352, // Primalist Increased Totem Crit Chance
    to: 357,   // Primalist Increased Totem Damage
    type: 'PREREQUISITE',
    strength: 1,
    condition: 'build.usesTotems === true',
    reason: 'Totem crit chance has no effect outside of a totem build.',
  },

] as const;

// ─────────────────────────────────────────────
// Adjacency helpers for the pipeline
// ─────────────────────────────────────────────

type AdjacencyMap = Record<number, Array<{ to: number; type: EdgeType; strength: number; condition: string }>>;

export function buildAdjacencyMap(): AdjacencyMap {
  const map: AdjacencyMap = {};
  for (const edge of AFFIX_EDGES) {
    if (!map[edge.from]) map[edge.from] = [];
    map[edge.from].push({
      to: edge.to,
      type: edge.type,
      strength: edge.strength,
      condition: edge.condition,
    });
  }
  return map;
}

export function getSynergies(affixId: number): readonly AffixEdge[] {
  return AFFIX_EDGES.filter(e => e.from === affixId && e.type === 'SYNERGY');
}

export function getPrerequisites(affixId: number): readonly AffixEdge[] {
  return AFFIX_EDGES.filter(e => e.from === affixId && e.type === 'PREREQUISITE');
}
