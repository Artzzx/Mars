# Last Epoch Filter Engine — Frontend Architecture v2.0

> **Stack:** React 18 · TypeScript · Vite · Tailwind CSS · Zustand · React Router v6  
> **Deployment:** SaaS / Cloud — Vercel or Cloudflare Pages  
> **Companion diagram:** `FRONTEND_ARCHITECTURE.mermaid`

---

## Table of Contents

1. [Guiding Principles](#1-guiding-principles)
2. [Directory Structure](#2-directory-structure)
3. [Routing Map](#3-routing-map)
4. [State Architecture](#4-state-architecture)
5. [Design Tokens](#5-design-tokens)
6. [Component Catalog](#6-component-catalog)
7. [Generator Page — Step Spec](#7-generator-page--step-spec)
8. [Results Page — Component Spec](#8-results-page--component-spec)
9. [Editor Layer](#9-editor-layer)
10. [Data Flow: UserInput → CompileResult → UI](#10-data-flow-userinput--compileresult--ui)
11. [Error States](#11-error-states)
12. [Migration Checklist](#12-migration-checklist)

---

## 1. Guiding Principles

| Principle | Implementation |
|---|---|
| **The engine is the product** | Generator is a full-page route, never a modal. Users arrive to generate, not to edit rules. |
| **Answer 3 questions, get a filter** | Class → Mastery → Damage Type → Progress → (optional) Options. Never more cognitive load than needed. |
| **Confidence is a feature** | `CompileResult.confidence`, `specificityScore`, and `matchedBuilds` are surfaced prominently, not hidden. |
| **Advanced is opt-in** | Manual rule editor (`/editor`) is accessible but never the default destination. |
| **SaaS 2026 standards** | Full-page flows, sticky headers, skeleton loading, toasts, keyboard navigation, WCAG AA minimum. |

---

## 2. Directory Structure

```
filter-site/src/
│
├── pages/
│   ├── HomePage.tsx                  ← / — Marketing landing, primary CTA → /generate
│   ├── GeneratorPage.tsx             ← /generate — Full 5-step wizard (REPLACES modal)
│   ├── ResultsPage.tsx               ← /results — Post-generation: confidence, download, preview
│   ├── editor/
│   │   ├── EditorLayout.tsx          ← /editor — Layout wrapper with Tabs
│   │   ├── OverviewPage.tsx          ← /editor/overview — Filter metadata + CompileResult stats
│   │   ├── CustomizePage.tsx         ← /editor/customize — RuleList + RuleEditor (KEEP)
│   │   ├── ThemesPage.tsx            ← /editor/themes — Color presets (KEEP)
│   │   └── AdvancedPage.tsx          ← /editor/advanced — Raw XML import/export (KEEP)
│   └── index.ts
│
├── components/
│   ├── layout/
│   │   ├── Header.tsx                ← Global sticky header (KEEP, minor update)
│   │   ├── EditorTabs.tsx            ← Editor-only tab nav (RENAME from Tabs.tsx)
│   │   └── index.ts
│   │
│   ├── generator/
│   │   ├── StepNavigator.tsx         ← Left sidebar: vertical step list with states
│   │   ├── LivePreviewPanel.tsx      ← Right column: live build summary card
│   │   ├── GeneratorFooter.tsx       ← Sticky Back / Next / Generate footer
│   │   └── steps/
│   │       ├── ClassStep.tsx         ← Step 1: 5 class cards
│   │       ├── MasteryStep.tsx       ← Step 2: 3 mastery cards (filtered by class)
│   │       ├── DamageTypeStep.tsx    ← Step 3: 7 damage type chips, multi-select
│   │       ├── ProgressStep.tsx      ← Step 4: 4 progress cards + strictness preview
│   │       └── OptionsStep.tsx       ← Step 5: archetype pills + toggles + strictness override
│   │
│   ├── results/
│   │   ├── ConfidenceHero.tsx        ← Full-width confidence banner with specificity gauge
│   │   ├── StatsRow.tsx              ← 4 stat cards: rules / budget / dropped / sources
│   │   ├── DownloadSection.tsx       ← Primary download CTA + secondary actions
│   │   ├── BuildSummaryCard.tsx      ← Recap of all UserInput parameters
│   │   └── FilterPreviewAccordion.tsx← Collapsible rule section list
│   │
│   ├── editor/
│   │   ├── RuleList.tsx              ← (KEEP)
│   │   ├── RuleEditor.tsx            ← (KEEP)
│   │   ├── ConditionEditor.tsx       ← (KEEP)
│   │   ├── AffixSearch.tsx           ← (KEEP)
│   │   └── index.ts
│   │
│   └── common/
│       ├── DamageTypeChip.tsx        ← Colored pill: icon + label, active/inactive states
│       ├── ConfidenceBadge.tsx       ← Inline badge: High / Medium / Low
│       ├── SpecificityGauge.tsx      ← Horizontal progress bar 0.0–1.0
│       ├── ClassCard.tsx             ← Reusable class selection card
│       ├── MasteryCard.tsx           ← Mastery card with damage type tag strip
│       ├── ProgressCard.tsx          ← Game progress selection card
│       ├── StrictnessBadge.tsx       ← Inline strictness indicator
│       ├── ToastProvider.tsx         ← Global toast notifications (sonner)
│       ├── ErrorBoundary.tsx         ← Page-level error boundary with retry
│       ├── SkeletonCard.tsx          ← Reusable loading skeleton
│       ├── QuickActions.tsx          ← (KEEP)
│       ├── ImportExport.tsx          ← (KEEP)
│       ├── LegacyFilterNotice.tsx    ← (KEEP)
│       └── FilterValidation.tsx      ← (KEEP)
│
├── store/
│   ├── filterStore.ts                ← (KEEP + add populateFromCompileResult action)
│   ├── generatorStore.ts             ← NEW: UserInput, CompileResult, isGenerating, error
│   └── index.ts
│
├── hooks/
│   ├── useCompiler.ts                ← Calls compileFilterFull(), manages async state
│   ├── useGenerator.ts               ← Step navigation logic, validation, UserInput builder
│   ├── useDownload.ts                ← Triggers .filter file download from XML string
│   ├── useAffixDatabase.ts           ← (KEEP)
│   └── useFilterHistory.ts           ← (KEEP)
│
├── lib/
│   ├── compiler/
│   │   └── client.ts                 ← Thin wrapper: calls filter-compiler compileFilterFull()
│   ├── filters/
│   │   └── types.ts                  ← (KEEP — do not modify)
│   ├── templates/                    ← (KEEP — legacy engine, used by editor only)
│   ├── xml/                          ← (KEEP — do not modify)
│   └── sharing.ts                    ← (KEEP)
│
├── types/
│   ├── generator.ts                  ← GeneratorStep, StepState, StepId enums/types
│   └── index.ts
│
├── App.tsx                           ← Route definitions (UPDATE: add /generate, /results)
├── index.css                         ← (KEEP + add damage-type color utilities)
└── main.tsx                          ← (KEEP)
```

---

## 3. Routing Map

```
/                         → HomePage
/generate                 → GeneratorPage
/results                  → ResultsPage (requires generatorStore.compileResult, else redirect /generate)
/editor                   → EditorLayout (redirect → /editor/overview)
/editor/overview          → OverviewPage
/editor/customize         → CustomizePage
/editor/themes            → ThemesPage
/editor/advanced          → AdvancedPage
*                         → redirect /
```

### Route Guards

```typescript
// ResultsPage guard — no result means no access
function RequireResult({ children }: { children: ReactNode }) {
  const result = useGeneratorStore(s => s.compileResult);
  return result ? <>{children}</> : <Navigate to="/generate" replace />;
}
```

### Updated App.tsx

```tsx
<Routes>
  <Route path="/"         element={<HomePage />} />
  <Route path="/generate" element={<GeneratorPage />} />
  <Route path="/results"  element={<RequireResult><ResultsPage /></RequireResult>} />
  <Route path="/editor"   element={<EditorLayout />}>
    <Route index          element={<Navigate to="overview" replace />} />
    <Route path="overview"  element={<OverviewPage />} />
    <Route path="customize" element={<CustomizePage />} />
    <Route path="themes"    element={<ThemesPage />} />
    <Route path="advanced"  element={<AdvancedPage />} />
  </Route>
  <Route path="*"         element={<Navigate to="/" replace />} />
</Routes>
```

---

## 4. State Architecture

### 4.1 generatorStore.ts — NEW

```typescript
import { create } from 'zustand';
import type { UserInput } from 'filter-compiler/src/types/build-context';
import type { CompileResult } from 'filter-compiler/src/types/resolved-profile';

// ── Step navigation ────────────────────────────────────────────────────────
export type StepId = 'class' | 'mastery' | 'damage' | 'progress' | 'options';
export const STEP_ORDER: StepId[] = ['class', 'mastery', 'damage', 'progress', 'options'];

interface GeneratorState {
  // Form state — mirrors UserInput fields one-to-one
  selectedClass:     string | null;           // e.g. "sentinel"
  selectedMastery:   string | null;           // e.g. "void_knight"
  selectedDamageTypes: string[];              // e.g. ["physical", "void"]
  selectedProgress:  UserInput['gameProgress'] | null;
  selectedArchetype: UserInput['archetype'];
  resistancesCapped: boolean;
  showCrossClassItems: boolean;
  crossClassWeightThreshold: number;
  strictnessOverride: string | null;          // null = use auto-recommended

  // Step navigation
  currentStep:  StepId;
  completedSteps: Set<StepId>;

  // Compilation
  compileResult: CompileResult | null;
  isGenerating:  boolean;
  error:         string | null;

  // Derived helper — builds UserInput for the compiler
  buildUserInput: () => UserInput | null;

  // Actions
  setClass:          (cls: string) => void;
  setMastery:        (mastery: string) => void;
  toggleDamageType:  (dt: string) => void;
  setProgress:       (p: UserInput['gameProgress']) => void;
  setArchetype:      (a: UserInput['archetype']) => void;
  setResistancesCapped: (v: boolean) => void;
  setShowCrossClass: (v: boolean) => void;
  setCrossClassThreshold: (v: number) => void;
  setStrictnessOverride:  (id: string | null) => void;
  goToStep:          (step: StepId) => void;
  goNext:            () => void;
  goBack:            () => void;
  setCompileResult:  (result: CompileResult) => void;
  setGenerating:     (v: boolean) => void;
  setError:          (msg: string | null) => void;
  reset:             () => void;
}
```

### 4.2 filterStore.ts — EXTEND ONLY

Add one new action to the existing store:

```typescript
// Add to existing FilterState interface:
populateFromCompileResult: (result: CompileResult) => void;

// Implementation:
populateFromCompileResult: (result) =>
  set({
    filter: result.filter,
    hasUnsavedChanges: false,
    changeCount: 0,
    selectedRuleId: null,
  }),
```

### 4.3 State Flow Diagram (text)

```
User fills GeneratorPage steps
          │
          ▼
  generatorStore (form state)
          │
  [Generate clicked]
          │
          ▼
  useCompiler.ts → compileFilterFull(userInput)
          │
          ├── success →  generatorStore.setCompileResult(result)
          │              filterStore.populateFromCompileResult(result)
          │              navigate('/results')
          │
          └── error   →  generatorStore.setError(msg)
                         toast.error(msg)

ResultsPage reads generatorStore.compileResult
EditorLayout reads filterStore.filter (unchanged)
```

---

## 5. Design Tokens

### 5.1 Existing Tailwind Config Tokens (keep all)

```javascript
// tailwind.config.js — existing (DO NOT REMOVE)
'le-dark':         '#0d0d0f'
'le-darker':       '#080809'
'le-card':         '#1a1a1f'
'le-border':       '#2a2a35'
'le-accent':       '#00d4d4'   // teal — primary interactive color
'le-accent-hover': '#00e5e5'
'le-gold':         '#d4a017'
'le-purple':       '#8b5cf6'
'le-red':          '#ef4444'
'le-green':        '#22c55e'
'le-blue':         '#3b82f6'
'le-orange':       '#f97316'
```

### 5.2 New Tokens to Add

```javascript
// tailwind.config.js — ADD to theme.extend.colors
// Damage type system
'damage-physical':  '#9ca3af'   // neutral gray
'damage-fire':      '#f97316'   // orange
'damage-cold':      '#60a5fa'   // sky blue
'damage-lightning': '#fbbf24'   // amber
'damage-void':      '#a78bfa'   // purple (distinct from le-purple)
'damage-necrotic':  '#34d399'   // emerald green
'damage-poison':    '#a3e635'   // lime green

// Confidence states
'confidence-high':   '#22c55e'  // same as le-green
'confidence-medium': '#f59e0b'  // amber
'confidence-low':    '#6b7280'  // gray

// Step states
'step-upcoming':    '#374151'   // dark gray
'step-active':      '#00d4d4'   // le-accent
'step-complete':    '#22c55e'   // le-green

// Class colors
'class-sentinel':   '#f59e0b'   // amber
'class-mage':       '#3b82f6'   // blue
'class-primalist':  '#22c55e'   // green
'class-rogue':      '#a78bfa'   // purple
'class-acolyte':    '#ef4444'   // red
```

### 5.3 New CSS Utilities (index.css additions)

```css
/* Damage type chip active states */
.chip-physical   { @apply border-damage-physical text-damage-physical bg-damage-physical/10; }
.chip-fire       { @apply border-damage-fire text-damage-fire bg-damage-fire/10; }
.chip-cold       { @apply border-damage-cold text-damage-cold bg-damage-cold/10; }
.chip-lightning  { @apply border-damage-lightning text-damage-lightning bg-damage-lightning/10; }
.chip-void       { @apply border-damage-void text-damage-void bg-damage-void/10; }
.chip-necrotic   { @apply border-damage-necrotic text-damage-necrotic bg-damage-necrotic/10; }
.chip-poison     { @apply border-damage-poison text-damage-poison bg-damage-poison/10; }

/* Step states */
.step-circle-upcoming { @apply w-8 h-8 rounded-full border-2 border-step-upcoming text-step-upcoming; }
.step-circle-active   { @apply w-8 h-8 rounded-full border-2 border-step-active bg-step-active text-le-dark; }
.step-circle-complete { @apply w-8 h-8 rounded-full border-2 border-step-complete bg-step-complete text-le-dark; }

/* Confidence hero variants */
.hero-high   { @apply bg-confidence-high/10 border border-confidence-high/30; }
.hero-medium { @apply bg-confidence-medium/10 border border-confidence-medium/30; }
.hero-low    { @apply bg-step-upcoming/30 border border-le-border; }

/* Card selection states */
.selection-card {
  @apply p-4 rounded-xl border-2 border-le-border cursor-pointer transition-all duration-150
         hover:border-le-accent/50 hover:bg-le-card;
}
.selection-card.selected {
  @apply border-le-accent bg-le-accent/10;
}
```

---

## 6. Component Catalog

### 6.1 New Components — Signatures

#### `DamageTypeChip`
```tsx
interface DamageTypeChipProps {
  type: 'physical' | 'fire' | 'cold' | 'lightning' | 'void' | 'necrotic' | 'poison';
  selected: boolean;
  onClick: () => void;
  size?: 'sm' | 'md';    // default 'md'
  readonly?: boolean;     // display-only, no hover/click
}
```
Renders a `rounded-full` pill with the damage icon SVG + label. Active state applies `.chip-{type}`. Inactive: `border-le-border text-gray-500`.

---

#### `ConfidenceBadge`
```tsx
interface ConfidenceBadgeProps {
  confidence: 'high' | 'medium' | 'low';
  size?: 'sm' | 'md';
}
```
Inline badge. `high` → green checkmark. `medium` → amber warning. `low` → gray info icon. Label: "High Confidence" / "Medium Confidence" / "Generic Filter".

---

#### `SpecificityGauge`
```tsx
interface SpecificityGaugeProps {
  score: number;           // 0.0 – 1.0
  showLabel?: boolean;     // default true
}
```
Horizontal bar with three zones: 0–0.4 red, 0.4–0.7 amber, 0.7–1.0 green. Animated fill on mount (500ms ease-out). Label: "Specificity: 85%".

---

#### `StepNavigator`
```tsx
interface StepNavigatorProps {
  steps: { id: StepId; label: string; description: string }[];
  currentStep: StepId;
  completedSteps: Set<StepId>;
  onStepClick: (id: StepId) => void;   // only for completed steps
}
```
Vertical list. Each row: circle badge (upcoming/active/complete states) + label + description. Completed steps are clickable to go back. Connector line between steps.

---

#### `LivePreviewPanel`
```tsx
interface LivePreviewPanelProps {
  selectedClass:      string | null;
  selectedMastery:    string | null;
  selectedDamageTypes: string[];
  selectedProgress:   string | null;
  selectedArchetype:  string | null;
  resistancesCapped:  boolean;
  showCrossClass:     boolean;
  isGenerating:       boolean;
  estimatedRules?:    number;
}
```
Renders a summary card. Each field renders as a row with a label and a value (or a placeholder dash if not yet filled). When `isGenerating`, the card shows a pulsing skeleton overlay.

---

#### `ConfidenceHero`
```tsx
interface ConfidenceHeroProps {
  confidence:       'high' | 'medium' | 'low';
  specificityScore: number;
  matchedBuilds:    string[];
  mastery:          string;
}
```
Full-width banner. Content: large confidence icon, headline message, specificity gauge right-aligned. See §8.1 for exact copy per confidence level.

---

#### `StatsRow`
```tsx
interface StatsRowProps {
  rulesGenerated: number;
  affixesDropped: number;
  matchedBuilds:  number;   // matchedBuilds.length
  budgetUsed:     number;   // rulesGenerated (budget is always 75)
}
```
4 `StatCard` sub-components in a `grid grid-cols-4 gap-4`. Each card: label (uppercase sm), large number, optional sub-label.

---

#### `DownloadSection`
```tsx
interface DownloadSectionProps {
  xml:            string;
  filterName:     string;
  mastery:        string;
  damageTypes:    string[];
  progress:       string;
  onOpenEditor:   () => void;    // navigates to /editor/customize
  onRegenerate:   () => void;    // navigates to /generate (pre-fills UserInput)
}
```

---

### 6.2 Hooks — Signatures

#### `useCompiler`
```typescript
function useCompiler(): {
  compile: (input: UserInput) => Promise<void>;
  isGenerating: boolean;
  error: string | null;
}
```
Calls `compileFilterFull(input)`. On success: writes to `generatorStore` and `filterStore`, navigates to `/results`. On error: sets `generatorStore.error`, shows toast.

---

#### `useGenerator`
```typescript
function useGenerator(): {
  currentStep:       StepId;
  completedSteps:    Set<StepId>;
  canGoNext:         boolean;
  canGoBack:         boolean;
  goNext:            () => void;
  goBack:            () => void;
  goToStep:          (id: StepId) => void;
  isLastStep:        boolean;        // true when currentStep === 'options'
  userInput:         Partial<UserInput>;
}
```

Validation logic per step:
- `class` → complete when `selectedClass !== null`
- `mastery` → complete when `selectedMastery !== null`
- `damage` → complete when `selectedDamageTypes.length >= 1`
- `progress` → complete when `selectedProgress !== null`
- `options` → always completable (all fields have defaults)

---

#### `useDownload`
```typescript
function useDownload(): {
  downloadFilter: (xml: string, filename: string) => void;
  copyToClipboard: (xml: string) => Promise<void>;
}
```
`downloadFilter`: creates `Blob('text/plain')`, `URL.createObjectURL`, synthetic `<a>` click, revoke URL.  
Filename convention: `{mastery}-{damageTypes.join('-')}-{progress}.filter` (all lowercase, spaces as hyphens).

---

## 7. Generator Page — Step Spec

### Layout (desktop ≥ 1200px)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  HEADER (56px, sticky, full-width)                                          │
├──────────────────┬──────────────────────────────────┬───────────────────────┤
│                  │  PAGE TITLE BAR (48px)             │                       │
│  STEP            ├──────────────────────────────────┤  LIVE PREVIEW         │
│  NAVIGATOR       │                                  │  PANEL                │
│  (240px fixed)   │  ACTIVE STEP CONTENT             │  (320px fixed)        │
│                  │  (flex-1, scrollable)             │                       │
│                  │                                  │                       │
│                  │                                  │                       │
│                  ├──────────────────────────────────┤                       │
│                  │  FOOTER NAV (64px, sticky)        │                       │
└──────────────────┴──────────────────────────────────┴───────────────────────┘
```

### Layout (tablet 768–1199px)
Two columns: left navigator (200px) + main content. Preview hidden. Preview accessible via a "Preview" icon button in the page title bar that opens a drawer from the right.

### Layout (mobile < 768px)
Single column. Step navigator collapses to a horizontal progress dots bar at the top. Footer nav becomes full-width sticky bottom bar. Preview accessible via a floating badge button.

---

### Step 1 — Class (`ClassStep`)

```
Title:    "Choose Your Class"
Subtitle: "Your class determines which items the filter focuses on."

Layout:   2-column grid (Tailwind: grid-cols-2 gap-4), 5 cards
          → card 5 (Acolyte) is centered in a 1-col row if odd

Each ClassCard:
  - 80px icon area (class SVG icon, colored with class-{name})
  - Class name (font-semibold text-lg)
  - Mastery count chip ("3 masteries")
  - Border color on select: class-{name} token
  
Behavior:
  - Single select only
  - Selecting a class auto-navigates to Step 2 after 300ms (visual confirm pause)
  - Selecting a new class resets mastery (Step 2) and damage type (Step 3) if they depended on class
```

---

### Step 2 — Mastery (`MasteryStep`)

```
Title:    "Pick Your Mastery"
Subtitle: "Masteries refine your build identity. {ClassName} has 3 options."

Layout:   3 MasteryCard components in a row (grid-cols-3 gap-4)
          + 1 "Base class / No mastery yet" option at bottom (full-width, subdued)

Each MasteryCard:
  - Mastery name (font-semibold)
  - 1-line description of the mastery's role
  - Tag strip: 2–3 DamageTypeChip components (size='sm', readonly=true)
    showing the mastery's typical damage types (informational only)
  - Selected state: le-accent border

"Base class" option:
  - Italic label "I haven't chosen a mastery yet"
  - Maps to selectedMastery = baseClass (e.g. "sentinel")
  - Compiler falls back to ClassProfile layer

Behavior:
  - Selecting auto-advances to Step 3 after 300ms
```

**Mastery data map** (static, hardcoded in `MasteryStep.tsx`):

```typescript
const MASTERIES: Record<string, { id: string; name: string; description: string; damageTypes: string[] }[]> = {
  sentinel:  [
    { id: 'void_knight',  name: 'Void Knight',  description: 'Melee void damage, time echoes', damageTypes: ['void', 'physical'] },
    { id: 'paladin',      name: 'Paladin',       description: 'Holy fire, healing auras',       damageTypes: ['fire', 'physical'] },
    { id: 'forge_guard',  name: 'Forge Guard',   description: 'Forged weapons, minion army',    damageTypes: ['physical'] },
  ],
  mage: [
    { id: 'sorcerer',     name: 'Sorcerer',      description: 'Elemental spell damage',         damageTypes: ['fire', 'cold', 'lightning'] },
    { id: 'runemaster',   name: 'Runemaster',    description: 'Rune magic, area spells',        damageTypes: ['lightning', 'cold'] },
    { id: 'spellblade',   name: 'Spellblade',    description: 'Melee spells, close-range burst',damageTypes: ['fire', 'cold'] },
  ],
  primalist: [
    { id: 'druid',        name: 'Druid',         description: 'Shapeshifting, nature damage',   damageTypes: ['physical', 'poison'] },
    { id: 'beastmaster',  name: 'Beastmaster',   description: 'Companion army, physical',       damageTypes: ['physical'] },
    { id: 'shaman',       name: 'Shaman',        description: 'Totems, cold & lightning',       damageTypes: ['cold', 'lightning'] },
  ],
  rogue: [
    { id: 'bladedancer',  name: 'Bladedancer',   description: 'Fast melee, shadow strikes',     damageTypes: ['physical', 'void'] },
    { id: 'marksman',     name: 'Marksman',      description: 'Bow skills, poison & fire',      damageTypes: ['physical', 'poison', 'fire'] },
    { id: 'falconer',     name: 'Falconer',      description: 'Falcon companion, physical',     damageTypes: ['physical'] },
  ],
  acolyte: [
    { id: 'lich',         name: 'Lich',          description: 'Death seal, necrotic & void',    damageTypes: ['necrotic', 'void'] },
    { id: 'necromancer',  name: 'Necromancer',   description: 'Minion army, necrotic',          damageTypes: ['necrotic', 'physical'] },
    { id: 'warlock',      name: 'Warlock',       description: 'Curses, poison & necrotic DoT',  damageTypes: ['necrotic', 'poison'] },
  ],
};
```

---

### Step 3 — Damage Type (`DamageTypeStep`)

```
Title:    "Select Your Damage Type(s)"
Subtitle: "Choose what your build deals. Hybrid builds can pick multiple."

Layout:   Wrapping flex row of 7 DamageTypeChip components (size='md')
          Displayed order: Physical · Fire · Cold · Lightning · Void · Necrotic · Poison

Damage icon set (Lucide or custom SVGs):
  physical   → Sword icon
  fire       → Flame icon
  cold       → Snowflake icon
  lightning  → Zap icon (already in codebase)
  void       → Circle with hole / Aperture
  necrotic   → Skull icon
  poison     → Droplet icon (colored)

Hint text below chips:
  "Hybrid builds like Void Knight use Physical + Void."
  
Validation:
  - At least 1 chip must be selected to enable Next
  - No maximum — all 7 can be selected (unusual but valid)

Pre-fill behavior:
  - When mastery has damageTypes hints, pre-select those chips silently
  - User can deselect and change freely
```

---

### Step 4 — Progress (`ProgressStep`)

```
Title:    "How Far Are You?"
Subtitle: "This determines filter strictness and affix tier thresholds."

Layout:   4 ProgressCard components (grid-cols-2 gap-4 on desktop, grid-cols-1 on mobile)

Each ProgressCard:
  - Icon (level range visual, e.g. "1–75", "75+", "100+", "300+")
  - Title: "Still Leveling", "Early Monolith", "Empowered Monoliths", "High Corruption"
  - Description: 1 line explaining the stage
  - Recommended Strictness badge: shown inline, e.g. "Regular" / "Strict" / "Very Strict" / "Uber Strict"

Inline strictness preview (appears after a card is hovered or selected):
  "Based on your progress, your filter will use: [StrictnessBadge]"
  "You can override this in the next step."

gameProgress values:
  "Still Leveling"      → campaign           → regular
  "Early Monolith"      → early_monolith     → strict
  "Empowered Monoliths" → empowered_monolith → very-strict
  "High Corruption"     → high_corruption    → uber-strict

Behavior:
  - Selecting auto-advances to Step 5 after 300ms
```

---

### Step 5 — Options (`OptionsStep`)

```
Title:    "Final Options"
Subtitle: "Optional. All fields have smart defaults — you can skip this step."

Generate button:  Large, full-width at bottom of this step.
                  Label: "Generate My Filter →"
                  Shows spinner when isGenerating = true.
                  Disabled when isGenerating = true.

Fields:

  [Archetype]
  Label: "Build Archetype"
  Sub:   "Helps us filter melee-only vs spell-only affixes."
  UI:    Row of 6 pill buttons: Melee · Spell · DoT · Minion · Ranged · Not Sure
  Default: "Not Sure" (maps to archetype: null)
  
  [Resistances Capped]
  Label: "My resistances are capped"
  Sub:   "Hides resistance-boosting affixes since you don't need them."
  UI:    Toggle switch, right-aligned
  Default: false
  
  [Cross-Class Items]
  Label: "Show cross-class items"
  Sub:   "Include high-value items from other classes if they score above the threshold."
  UI:    Toggle switch, right-aligned
  Default: false
  
  [Cross-Class Threshold] — only visible when cross-class toggle is ON
  Label: "Minimum weight threshold"
  Sub:   "Only show cross-class items scoring above this value (0–100)"
  UI:    Horizontal slider with numeric readout
  Default: 75
  
  [Strictness Override]
  Label: "Strictness override"
  Sub:   "Leave as Auto to use our recommendation based on your progress."
  UI:    Dropdown: Auto (Recommended) · Regular · Strict · Very Strict · Uber Strict
  Default: Auto (null, uses PROGRESS_TO_STRICTNESS mapping)
  Note:  When "Auto" is selected, show the recommended value in gray text:
         "Auto → Very Strict (from Empowered Monoliths)"
```

---

## 8. Results Page — Component Spec

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│  HEADER (56px, sticky)                                      │
├─────────────────────────────────────────────────────────────┤
│  ConfidenceHero (full-width, ~120px)                        │
├─────────────────────────────────────────────────────────────┤
│  StatsRow (full-width, 4 cards)                             │
├───────────────────────────────┬─────────────────────────────┤
│  DownloadSection (left ~60%)  │  BuildSummaryCard (right ~40%) │
├───────────────────────────────┴─────────────────────────────┤
│  FilterPreviewAccordion (full-width, collapsed by default)  │
└─────────────────────────────────────────────────────────────┘
```

### 8.1 ConfidenceHero — Copy Per Confidence Level

| Level | Headline | Sub-text |
|---|---|---|
| `high` | "Excellent match — your filter is build-specific." | "We found {n} community-validated builds for {mastery} ({damageTypes}). Specificity: {score}%" |
| `medium` | "Good match — class-level data applied." | "We matched your class and damage type but have limited data for {mastery} specifically. The filter is still valid." |
| `low` | "Generic filter applied." | "We didn't find build-specific data for this combination. A general {baseClass} filter was used. Consider contributing build data." |

### 8.2 StatsRow — StatCard definitions

| Card | Value | Sub-label | Color accent |
|---|---|---|---|
| Rules Generated | `rulesGenerated` | `out of 75 rule budget` | le-accent |
| Affixes Dropped | `affixesDropped` | `low-priority affixes cut` | `affixesDropped > 0 ? le-gold : le-green` |
| Data Sources | `matchedBuilds.length` | `community builds matched` | le-accent |
| Specificity | `(specificityScore * 100).toFixed(0) + '%'` | `profile match quality` | based on score |

### 8.3 DownloadSection — Actions

```
PRIMARY:   [Download .filter file]  ← downloads compileResult.xml as {filename}.filter
SECONDARY: [Copy XML to clipboard]  ← copies compileResult.xml, shows toast
SECONDARY: [Open in Advanced Editor]← filterStore.populateFromCompileResult(result) + navigate('/editor/customize')
SECONDARY: [Regenerate]             ← navigate('/generate') — UserInput already in generatorStore, steps pre-filled
```

Installation instructions (collapsible `<details>` element):
```
Place your filter file here:
  Windows:  %APPDATA%\Last Epoch\Filters\
  macOS:    ~/Library/Application Support/Last Epoch/Filters/
  Linux:    ~/.config/unity3d/Eleventh Hour Games/Last Epoch/Filters/

Then in Last Epoch: Options → Gameplay → Loot Filter → Reload Filters
```

---

## 9. Editor Layer

### 9.1 EditorLayout — Changes

```tsx
// Add back-navigation context
function EditorLayout() {
  const hasResult = useGeneratorStore(s => s.compileResult !== null);
  
  return (
    <div className="min-h-screen bg-le-dark flex flex-col">
      <Header />
      {/* NEW: context banner when accessed from results */}
      {hasResult && (
        <div className="bg-le-card border-b border-le-border px-6 py-2 flex items-center gap-3">
          <span className="text-xs text-gray-400">Advanced Editor</span>
          <span className="text-xs text-le-border">·</span>
          <button onClick={() => navigate('/results')} className="text-xs text-le-accent hover:underline">
            ← Back to results
          </button>
        </div>
      )}
      <EditorTabs />
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
```

### 9.2 EditorTabs — Changes

Remove `SIMULATE` tab (or wrap in `{process.env.VITE_ENABLE_SIMULATE === 'true' && ...}` feature flag).

```typescript
// Updated tab list
const TABS = [
  { path: 'overview',   label: 'OVERVIEW' },
  { path: 'customize',  label: 'CUSTOMIZE' },
  // { path: 'simulate', label: 'SIMULATE' },   ← DEFERRED
  { path: 'themes',     label: 'THEMES' },
  { path: 'advanced',   label: 'ADVANCED' },
];
```

### 9.3 OverviewPage — Additions

Below the existing "FILTER DETAILS" section, add a new "GENERATION METADATA" section that renders only when `generatorStore.compileResult !== null`:

```tsx
{compileResult && (
  <div className="card p-4 mt-4">
    <h2 className="text-sm font-semibold text-gray-400 mb-3">GENERATION METADATA</h2>
    <div className="grid grid-cols-2 gap-4">
      <ConfidenceBadge confidence={compileResult.confidence} size="md" />
      <SpecificityGauge score={compileResult.specificityScore} />
    </div>
    <div className="mt-3 text-sm text-gray-400">
      {compileResult.affixesDropped > 0 && (
        <span className="text-le-gold">{compileResult.affixesDropped} affixes dropped to fit rule budget.</span>
      )}
    </div>
    <details className="mt-3">
      <summary className="text-xs text-gray-500 cursor-pointer">Matched builds ({compileResult.matchedBuilds.length})</summary>
      <ul className="mt-2 space-y-1">
        {compileResult.matchedBuilds.map(b => <li key={b} className="text-xs text-gray-400 font-mono">{b}</li>)}
      </ul>
    </details>
    <button onClick={() => navigate('/generate')} className="btn-secondary text-sm mt-3">
      Regenerate with different options
    </button>
  </div>
)}
```

---

## 10. Data Flow: UserInput → CompileResult → UI

```
GeneratorPage (form state in generatorStore)
  │
  │  [User clicks "Generate My Filter"]
  ▼
useCompiler.compile(userInput: UserInput)
  │
  │  calls → compileFilterFull(userInput)
  │           from filter-compiler/src/compiler/index.ts
  ▼
CompileResult {
  filter:          ItemFilter        → filterStore.populateFromCompileResult()
  xml:             string            → generatorStore.compileResult.xml
  confidence:      'high'|'medium'|'low'
  specificityScore: number (0–1)
  matchedBuilds:   string[]
  rulesGenerated:  number
  affixesDropped:  number
}
  │
  ├── filterStore.filter  ←─────────── EditorLayout reads this
  │                                    RuleList / RuleEditor / ThemesPage all read this
  │
  └── generatorStore.compileResult ←── ResultsPage reads this
                                       OverviewPage reads this (metadata section)
```

### useCompiler implementation

```typescript
// hooks/useCompiler.ts
export function useCompiler() {
  const setGenerating   = useGeneratorStore(s => s.setGenerating);
  const setCompileResult = useGeneratorStore(s => s.setCompileResult);
  const setError        = useGeneratorStore(s => s.setError);
  const populateFilter  = useFilterStore(s => s.populateFromCompileResult);
  const navigate        = useNavigate();

  const compile = useCallback(async (input: UserInput) => {
    setGenerating(true);
    setError(null);
    try {
      const result = await Promise.resolve(compileFilterFull(input));
      setCompileResult(result);
      populateFilter(result);
      navigate('/results');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Compilation failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  }, []);

  return { compile, isGenerating: useGeneratorStore(s => s.isGenerating), error: useGeneratorStore(s => s.error) };
}
```

---

## 11. Error States

| Scenario | Where it shows | Component | Recovery action |
|---|---|---|---|
| `knowledge-base.json` missing | GeneratorPage after Generate click | Toast + inline error below Generate button | "Run the data pipeline first. See README." |
| Unknown mastery | same | same | "Invalid mastery. This is a bug — please report it." |
| `build-recommendations.json` missing | ResultsPage | Amber warning banner below StatsRow | "Unique item rules disabled — recommendations file not found." Filter still downloads. |
| Rule count overflow (compiler drops affixes) | ResultsPage StatsRow | `affixesDropped` card highlighted amber | Informational only. |
| Network error (if compiler is remote API) | GeneratorPage | Toast + retry button | "Retry" re-triggers compile |
| No result on `/results` load | Route guard | Redirect to `/generate` | — |
| Invalid XML import in AdvancedPage | AdvancedPage inline | Existing `setError` display | (no change from current) |

---

## 12. Migration Checklist

Tasks in order. Each item is independently completable.

### Phase 1 — Foundation
- [ ] Create `src/store/generatorStore.ts` with full interface
- [ ] Add `populateFromCompileResult` action to `filterStore.ts`
- [ ] Create `src/hooks/useCompiler.ts`
- [ ] Create `src/hooks/useGenerator.ts`
- [ ] Create `src/hooks/useDownload.ts`
- [ ] Create `src/lib/compiler/client.ts` wrapper
- [ ] Create `src/types/generator.ts`
- [ ] Create `src/components/common/DamageTypeChip.tsx`
- [ ] Create `src/components/common/ConfidenceBadge.tsx`
- [ ] Create `src/components/common/SpecificityGauge.tsx`
- [ ] Add damage-type and confidence tokens to `tailwind.config.js`
- [ ] Add CSS utilities to `index.css`
- [ ] Add `/generate` and `/results` routes to `App.tsx`
- [ ] Install `sonner` for toasts: `npm install sonner` + add `<Toaster />` to `App.tsx`

### Phase 2 — Generator Page
- [ ] Create `StepNavigator.tsx`
- [ ] Create `LivePreviewPanel.tsx`
- [ ] Create `GeneratorFooter.tsx`
- [ ] Create `ClassStep.tsx` with 5 class cards
- [ ] Create `MasteryStep.tsx` with mastery data map
- [ ] Create `DamageTypeStep.tsx` with 7 chips
- [ ] Create `ProgressStep.tsx` with 4 progress cards
- [ ] Create `OptionsStep.tsx` with all optional fields
- [ ] Create `GeneratorPage.tsx` — 3-column layout wiring all steps
- [ ] Implement mobile responsive layout (<768px, 768–1199px, ≥1200px)

### Phase 3 — Results Page
- [ ] Create `ConfidenceHero.tsx`
- [ ] Create `StatsRow.tsx`
- [ ] Create `DownloadSection.tsx` with file download + clipboard + navigation
- [ ] Create `BuildSummaryCard.tsx`
- [ ] Create `FilterPreviewAccordion.tsx`
- [ ] Create `ResultsPage.tsx` — wired to `generatorStore.compileResult`
- [ ] Add `RequireResult` route guard

### Phase 4 — Editor Updates
- [ ] Rename `Tabs.tsx` → `EditorTabs.tsx`, update imports
- [ ] Remove or feature-flag SIMULATE tab in `EditorTabs.tsx`
- [ ] Add generation metadata section to `OverviewPage.tsx`
- [ ] Add "Advanced Editor" context banner to `EditorLayout.tsx`

### Phase 5 — Landing Page + Cleanup
- [ ] Update `HomePage.tsx` CTAs: single primary → `/generate`, two secondary
- [ ] Remove quick-start static template buttons
- [ ] Add "How it works" 3-step explainer
- [ ] Delete `src/components/common/TemplateGenerator.tsx`
- [ ] Remove `TemplateGenerator` import from any files
- [ ] Run full E2E smoke test: `/` → `/generate` → compile → `/results` → download → `/editor`
- [ ] Audit `pages/index.ts` exports

### Phase 6 — Polish
- [ ] Add class SVG icons (public/icons/classes/)
- [ ] Add damage type SVG icons (public/icons/damage/)
- [ ] Add `ErrorBoundary.tsx` to `GeneratorPage` and `ResultsPage`
- [ ] Add `SkeletonCard.tsx` for loading states
- [ ] Keyboard navigation audit (Tab order, Enter to select cards)
- [ ] WCAG AA contrast check on all new tokens
- [ ] Mobile viewport testing on all new pages

---

*Document version: 2.0 — March 2026*  
*Companion: `FRONTEND_ARCHITECTURE.mermaid`*
