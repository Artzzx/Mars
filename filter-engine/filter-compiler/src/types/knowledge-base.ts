// TypeScript types mirroring knowledge-base.json schema
// Produced by the Python knowledge pipeline (packages/knowledge-pipeline)

export interface AffixWeight {
  id: number;
  weight: number;            // 0-100
  category: 'essential' | 'strong' | 'useful' | 'filler';
  min_tier: number | null;
  consensus_spread: number;  // 0.0-1.0
  confidence: number;        // 0.0-1.0
}

export interface PhaseData {
  affixes: AffixWeight[];
}

export interface BuildEntry {
  mastery: string;
  // The knowledge pipeline emits damage_types as a string array, e.g. ["Physical", "Necrotic"]
  damage_types: string[];
  archetype?: string;
  specificity_score: number;  // 0.0-1.0
  source_count: number;
  confidence: 'high' | 'medium' | 'low';
  data_source_layer: string;  // "specific" | "mastery" | "class" | "baseline"
  phases: {
    starter?: PhaseData;
    endgame?: PhaseData;
    aspirational?: PhaseData;
  };
}

export interface KnowledgeBase {
  version: string;
  generated_at: string;      // ISO 8601
  patch_version: string;
  builds: Record<string, BuildEntry>;
}
