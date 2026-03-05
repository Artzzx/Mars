// Thin wrapper re-exporting the filter compiler's public API.
// Using a relative path since the compiler is not a published npm package.
export {
  compileFilter,
  compileFilterXML,
  compileFilterFull,
} from '../../../../filter-engine/filter-compiler/src/compiler/index.js';

export type { UserInput, GameProgress, Archetype } from '../../../../filter-engine/filter-compiler/src/types/build-context.js';
export type { CompileResult } from '../../../../filter-engine/filter-compiler/src/types/resolved-profile.js';
