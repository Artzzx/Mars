import { useState } from 'react';
import { X } from 'lucide-react';
import { StepNavigator } from '../components/generator/StepNavigator';
import { LivePreviewPanel } from '../components/generator/LivePreviewPanel';
import { GeneratorFooter } from '../components/generator/GeneratorFooter';
import { ClassStep } from '../components/generator/steps/ClassStep';
import { MasteryStep } from '../components/generator/steps/MasteryStep';
import { DamageTypeStep } from '../components/generator/steps/DamageTypeStep';
import { ProgressStep } from '../components/generator/steps/ProgressStep';
import { OptionsStep } from '../components/generator/steps/OptionsStep';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { SkeletonCard } from '../components/common/SkeletonCard';
import { useGeneratorStore } from '../store/generatorStore';
import { useGenerator } from '../hooks/useGenerator';
import { useCompiler } from '../hooks/useCompiler';
import type { StepId } from '../types/generator';

// ─── Step content renderer ──────────────────────────────────────────────────

function StepContent({
  stepId,
  onAutoAdvance,
  onGenerate,
}: {
  stepId: StepId;
  onAutoAdvance: () => void;
  onGenerate: () => void;
}) {
  switch (stepId) {
    case 'class':    return <ClassStep    onAutoAdvance={onAutoAdvance} />;
    case 'mastery':  return <MasteryStep  onAutoAdvance={onAutoAdvance} />;
    case 'damage':   return <DamageTypeStep />;
    case 'progress': return <ProgressStep onAutoAdvance={onAutoAdvance} />;
    case 'options':  return <OptionsStep  onGenerate={onGenerate} />;
  }
}

// ─── Mobile dots progress bar ───────────────────────────────────────────────

import { STEP_ORDER, STEPS } from '../types/generator';

function MobileDotBar({ currentStep }: { currentStep: StepId }) {
  const currentIdx = STEP_ORDER.indexOf(currentStep);
  return (
    <div className="flex items-center justify-center gap-2 py-3">
      {STEPS.map((step, idx) => (
        <div
          key={step.id}
          title={step.label}
          className={
            idx < currentIdx
              ? 'w-2 h-2 rounded-full bg-step-complete'
              : idx === currentIdx
              ? 'w-3 h-3 rounded-full bg-step-active'
              : 'w-2 h-2 rounded-full bg-step-upcoming'
          }
        />
      ))}
    </div>
  );
}

// ─── GeneratorPage ───────────────────────────────────────────────────────────

export function GeneratorPage() {
  const {
    currentStep,
    completedSteps,
    canGoNext,
    canGoBack,
    goNext,
    goBack,
    goToStep,
    isLastStep,
  } = useGenerator();

  const { compile, isGenerating } = useCompiler();
  const buildUserInput = useGeneratorStore((s) => s.buildUserInput);

  // Mobile preview drawer state
  const [previewOpen, setPreviewOpen] = useState(false);

  // Store values for LivePreviewPanel
  const selectedClass       = useGeneratorStore((s) => s.selectedClass);
  const selectedMastery     = useGeneratorStore((s) => s.selectedMastery);
  const selectedDamageTypes = useGeneratorStore((s) => s.selectedDamageTypes);
  const selectedProgress    = useGeneratorStore((s) => s.selectedProgress);
  const selectedArchetype   = useGeneratorStore((s) => s.selectedArchetype);
  const resistancesCapped   = useGeneratorStore((s) => s.resistancesCapped);
  const showCrossClassItems = useGeneratorStore((s) => s.showCrossClassItems);

  async function handleGenerate() {
    const input = buildUserInput();
    if (!input) return;
    await compile(input);
  }

  function handleAutoAdvance() {
    if (!isLastStep) goNext();
  }

  const stepTitles: Record<StepId, string> = {
    class:    'Step 1 of 5',
    mastery:  'Step 2 of 5',
    damage:   'Step 3 of 5',
    progress: 'Step 4 of 5',
    options:  'Step 5 of 5',
  };

  const previewProps = {
    selectedClass,
    selectedMastery,
    selectedDamageTypes,
    selectedProgress,
    selectedArchetype,
    resistancesCapped,
    showCrossClass: showCrossClassItems,
    isGenerating,
  };

  return (
    <div className="min-h-screen bg-le-dark flex flex-col">
      {/* ── Desktop layout (≥ 1200px): 3 columns ── */}
      <div className="flex-1 flex min-h-0 xl:grid xl:grid-cols-[240px_1fr_320px]">

        {/* LEFT — StepNavigator (hidden on mobile/tablet, shown ≥ xl) */}
        <aside className="hidden xl:flex flex-col p-6 border-r border-le-border bg-le-darker sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
          <StepNavigator
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={goToStep}
          />
        </aside>

        {/* TABLET — 2-column navigator (shown md–xl) */}
        <aside className="hidden md:flex xl:hidden flex-col p-4 border-r border-le-border bg-le-darker w-[200px] flex-shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
          <StepNavigator
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={goToStep}
          />
        </aside>

        {/* CENTER — step content */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Mobile dots bar */}
          <div className="md:hidden border-b border-le-border bg-le-darker">
            <MobileDotBar currentStep={currentStep} />
          </div>

          {/* Page title bar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-le-border bg-le-darker/50">
            <span className="text-sm text-gray-500">{stepTitles[currentStep]}</span>
            {/* Mobile preview badge */}
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="xl:hidden text-xs text-le-accent border border-le-accent/30 px-2 py-1 rounded-lg hover:bg-le-accent/10 transition-colors"
            >
              Preview
            </button>
          </div>

          {/* Scrollable step content */}
          <div className="flex-1 overflow-y-auto p-6 relative">
            <div className="max-w-2xl">
              <ErrorBoundary>
                <StepContent
                  stepId={currentStep}
                  onAutoAdvance={handleAutoAdvance}
                  onGenerate={handleGenerate}
                />
              </ErrorBoundary>
            </div>

            {/* Loading overlay — shown while compiler runs */}
            {isGenerating && (
              <div className="absolute inset-0 bg-le-dark/80 backdrop-blur-sm flex flex-col gap-4 p-6 pointer-events-none">
                <SkeletonCard lines={2} />
                <SkeletonCard lines={3} />
                <SkeletonCard lines={2} />
                <p className="text-center text-sm text-gray-400 animate-pulse mt-2">
                  Compiling your filter…
                </p>
              </div>
            )}
          </div>

          {/* Sticky footer nav */}
          <GeneratorFooter
            canGoBack={canGoBack}
            canGoNext={canGoNext}
            isLastStep={isLastStep}
            isGenerating={isGenerating}
            onBack={goBack}
            onNext={goNext}
            onGenerate={handleGenerate}
          />
        </div>

        {/* RIGHT — LivePreviewPanel (desktop ≥ xl only) */}
        <aside className="hidden xl:flex flex-col p-6 border-l border-le-border bg-le-darker sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
          <LivePreviewPanel {...previewProps} />
        </aside>
      </div>

      {/* ── Mobile preview drawer ── */}
      {previewOpen && (
        <div className="xl:hidden fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setPreviewOpen(false)}
          />
          {/* Drawer */}
          <div className="relative z-10 w-80 max-w-full bg-le-darker border-l border-le-border h-full p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-400">Build Preview</h3>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="text-gray-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <LivePreviewPanel {...previewProps} />
          </div>
        </div>
      )}
    </div>
  );
}
