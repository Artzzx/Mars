// Output shapes for lookup, budget, and compilation stages

import type { AffixWeight } from './knowledge-base.js';
import type { UniqueRec, BaseRec, IdolAffixRec } from './recommendations.js';
import type { ItemFilter } from '@filter-site/lib/filters/types';

export type { AffixWeight };

// Profile returned by lookupKnowledgeProfile()
export interface ResolvedProfile {
  specificityScore: number;            // 0.0-1.0
  dataSourceLayer: string;             // "specific" | "mastery" | "class" | "baseline"
  confidence: 'high' | 'medium' | 'low';
  phaseAffixes: AffixWeight[];         // merged + phase-selected affix list
  recommendedUniques: UniqueRec[];
  recommendedBases: BaseRec[];
  idolAffixes: IdolAffixRec[];
  matchedBuilds: string[];             // build slugs that contributed (for debugging)
}

// Budget section descriptor (generators are lazy — not called until generateRules())
export interface RuleSection {
  name: string;
  priority: number;
  estimatedRules: number;
}

// Output of allocateRuleBudget()
export interface RuleSchedule {
  sections: RuleSection[];
  totalEstimated: number;    // must be <= 75
  budgetUsed: number;
  affixesIncluded: number;
  affixesDropped: number;    // weight>0 affixes that didn't fit budget
  essentialAffixes: AffixWeight[];  // weight >= 75
  strongAffixes: AffixWeight[];     // weight 50-74
  usefulAffixes: AffixWeight[];     // weight 25-49
}

// Full result returned by compileFilterFull()
export interface CompileResult {
  filter: ItemFilter;
  xml: string;
  confidence: 'high' | 'medium' | 'low';
  specificityScore: number;
  matchedBuilds: string[];    // for debug display
  rulesGenerated: number;
  affixesDropped: number;
}
