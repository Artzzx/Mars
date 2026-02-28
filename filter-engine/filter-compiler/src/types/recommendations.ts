// TypeScript types mirroring build-recommendations.json schema
// Produced by extract-build-recommendations.ts script

export interface UniqueRec {
  uniqueID: number;
  uniqueName: string;
  slot: string;
  phases: string[];       // e.g. ["starter", "endgame", "aspirational"]
  itemType: number;       // baseTypeID from items.json
  subType: number;        // subTypeID from items.json
}

export interface BaseRec {
  itemType: number;
  subType: number;
  slot: string;
  phases: string[];
  baseName: string | null;
  is_exalted_target: boolean;
}

export interface IdolAffixRec {
  affix_id: number;
  slot: number;
  itemType: number;
  subType: number;
  phases: string[];
  max_tier: number;
}

export interface BuildRec {
  build_slug: string;
  mastery: string;
  damage_types: string[];
  archetype: string;
  source_url: string;
  uniques: UniqueRec[];
  bases: BaseRec[];
  idol_affixes: IdolAffixRec[];
}

export interface BuildRecommendations {
  generated_at: string;
  builds: Record<string, BuildRec>;
}
