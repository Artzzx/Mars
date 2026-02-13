import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ItemFilter,
  Rule,
  StrictnessLevel,
  FilterModule,
} from '../lib/filters/types';
import { createEmptyFilter, createEmptyRule } from '../lib/filters/types';
import { parseFilterXml } from '../lib/xml';

interface FilterState {
  // Current filter being edited
  filter: ItemFilter;

  // UI State
  selectedRuleId: string | null;
  strictness: StrictnessLevel;
  hasUnsavedChanges: boolean;
  changeCount: number;

  // Modules
  enabledModules: string[];

  // Template
  selectedTemplate: string | null;

  // Actions
  setFilter: (filter: ItemFilter) => void;
  updateFilterMetadata: (metadata: Partial<ItemFilter>) => void;
  setStrictness: (level: StrictnessLevel) => void;
  setSelectedTemplate: (templateId: string | null) => void;

  // Rule actions
  addRule: (rule?: Partial<Rule>) => void;
  updateRule: (ruleId: string, updates: Partial<Rule>) => void;
  deleteRule: (ruleId: string) => void;
  duplicateRule: (ruleId: string) => void;
  moveRule: (ruleId: string, direction: 'up' | 'down') => void;
  toggleRuleEnabled: (ruleId: string) => void;
  selectRule: (ruleId: string | null) => void;

  // Bulk rule actions
  enableAllRules: () => void;
  disableAllRules: () => void;
  deleteDisabledRules: () => void;

  // Module actions
  toggleModule: (moduleId: string) => void;
  applyModules: (modules: FilterModule[]) => void;

  // Import/Export
  importFilter: (xmlString: string) => void;
  resetFilter: () => void;

  // Change tracking
  markSaved: () => void;
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set, get) => ({
      // Initial state
      filter: createEmptyFilter(),
      selectedRuleId: null,
      strictness: 'regular',
      hasUnsavedChanges: false,
      changeCount: 0,
      enabledModules: [],
      selectedTemplate: null,

      // Setters
      setFilter: (filter) =>
        set({
          filter,
          hasUnsavedChanges: true,
          changeCount: get().changeCount + 1,
        }),

      updateFilterMetadata: (metadata) =>
        set((state) => ({
          filter: { ...state.filter, ...metadata },
          hasUnsavedChanges: true,
          changeCount: state.changeCount + 1,
        })),

      setStrictness: (level) =>
        set({
          strictness: level,
          hasUnsavedChanges: true,
          changeCount: get().changeCount + 1,
        }),

      setSelectedTemplate: (templateId) =>
        set({
          selectedTemplate: templateId,
          hasUnsavedChanges: true,
          changeCount: get().changeCount + 1,
        }),

      // Rule actions
      addRule: (ruleOverrides) =>
        set((state) => {
          const newRule = { ...createEmptyRule(), ...ruleOverrides };
          return {
            filter: {
              ...state.filter,
              rules: [...state.filter.rules, newRule],
            },
            selectedRuleId: newRule.id,
            hasUnsavedChanges: true,
            changeCount: state.changeCount + 1,
          };
        }),

      updateRule: (ruleId, updates) =>
        set((state) => ({
          filter: {
            ...state.filter,
            rules: state.filter.rules.map((rule) =>
              rule.id === ruleId ? { ...rule, ...updates } : rule
            ),
          },
          hasUnsavedChanges: true,
          changeCount: state.changeCount + 1,
        })),

      deleteRule: (ruleId) =>
        set((state) => ({
          filter: {
            ...state.filter,
            rules: state.filter.rules.filter((rule) => rule.id !== ruleId),
          },
          selectedRuleId:
            state.selectedRuleId === ruleId ? null : state.selectedRuleId,
          hasUnsavedChanges: true,
          changeCount: state.changeCount + 1,
        })),

      duplicateRule: (ruleId) =>
        set((state) => {
          const ruleToDuplicate = state.filter.rules.find((r) => r.id === ruleId);
          if (!ruleToDuplicate) return state;

          const newRule = {
            ...ruleToDuplicate,
            id: crypto.randomUUID(),
            nameOverride: ruleToDuplicate.nameOverride
              ? `${ruleToDuplicate.nameOverride} (copy)`
              : '',
          };

          const ruleIndex = state.filter.rules.findIndex((r) => r.id === ruleId);
          const newRules = [...state.filter.rules];
          newRules.splice(ruleIndex + 1, 0, newRule);

          return {
            filter: { ...state.filter, rules: newRules },
            selectedRuleId: newRule.id,
            hasUnsavedChanges: true,
            changeCount: state.changeCount + 1,
          };
        }),

      moveRule: (ruleId, direction) =>
        set((state) => {
          const rules = [...state.filter.rules];
          const index = rules.findIndex((r) => r.id === ruleId);
          if (index === -1) return state;

          const newIndex = direction === 'up' ? index - 1 : index + 1;
          if (newIndex < 0 || newIndex >= rules.length) return state;

          [rules[index], rules[newIndex]] = [rules[newIndex], rules[index]];

          return {
            filter: { ...state.filter, rules },
            hasUnsavedChanges: true,
            changeCount: state.changeCount + 1,
          };
        }),

      toggleRuleEnabled: (ruleId) =>
        set((state) => ({
          filter: {
            ...state.filter,
            rules: state.filter.rules.map((rule) =>
              rule.id === ruleId ? { ...rule, isEnabled: !rule.isEnabled } : rule
            ),
          },
          hasUnsavedChanges: true,
          changeCount: state.changeCount + 1,
        })),

      selectRule: (ruleId) => set({ selectedRuleId: ruleId }),

      // Bulk rule actions
      enableAllRules: () =>
        set((state) => ({
          filter: {
            ...state.filter,
            rules: state.filter.rules.map((rule) => ({ ...rule, isEnabled: true })),
          },
          hasUnsavedChanges: true,
          changeCount: state.changeCount + 1,
        })),

      disableAllRules: () =>
        set((state) => ({
          filter: {
            ...state.filter,
            rules: state.filter.rules.map((rule) => ({ ...rule, isEnabled: false })),
          },
          hasUnsavedChanges: true,
          changeCount: state.changeCount + 1,
        })),

      deleteDisabledRules: () =>
        set((state) => ({
          filter: {
            ...state.filter,
            rules: state.filter.rules.filter((rule) => rule.isEnabled),
          },
          selectedRuleId: state.filter.rules.find((r) => r.id === state.selectedRuleId)?.isEnabled
            ? state.selectedRuleId
            : null,
          hasUnsavedChanges: true,
          changeCount: state.changeCount + 1,
        })),

      // Module actions
      toggleModule: (moduleId) =>
        set((state) => ({
          enabledModules: state.enabledModules.includes(moduleId)
            ? state.enabledModules.filter((id) => id !== moduleId)
            : [...state.enabledModules, moduleId],
          hasUnsavedChanges: true,
          changeCount: state.changeCount + 1,
        })),

      applyModules: (modules) =>
        set((state) => {
          const enabledModuleRules = modules
            .filter((m) => state.enabledModules.includes(m.id))
            .flatMap((m) => m.rules);

          return {
            filter: {
              ...state.filter,
              rules: [...state.filter.rules, ...enabledModuleRules],
            },
            hasUnsavedChanges: true,
            changeCount: state.changeCount + 1,
          };
        }),

      // Import/Export
      importFilter: (xmlString) => {
        try {
          const filter = parseFilterXml(xmlString);
          set({
            filter,
            hasUnsavedChanges: false,
            changeCount: 0,
            selectedRuleId: null,
          });
        } catch (error) {
          console.error('Failed to import filter:', error);
          throw error;
        }
      },

      resetFilter: () =>
        set({
          filter: createEmptyFilter(),
          hasUnsavedChanges: false,
          changeCount: 0,
          selectedRuleId: null,
          enabledModules: [],
          selectedTemplate: null,
        }),

      markSaved: () =>
        set({
          hasUnsavedChanges: false,
        }),
    }),
    {
      name: 'le-filter-storage',
      partialize: (state) => ({
        filter: state.filter,
        enabledModules: state.enabledModules,
        selectedTemplate: state.selectedTemplate,
        strictness: state.strictness,
      }),
    }
  )
);
