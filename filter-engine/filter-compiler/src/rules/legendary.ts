/**
 * legendary.ts — Legendary item rule generator.
 *
 * Single SHOW rule. Always present regardless of strictness or build.
 * Delegates directly to the existing generator in rule-builder.ts to
 * avoid duplicating the rule definition.
 */

export { generateLegendaryRules } from '@filter-site/lib/templates/core/rule-builder.js';
