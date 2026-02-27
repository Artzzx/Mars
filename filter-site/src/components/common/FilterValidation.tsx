import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import type { ItemFilter } from '../../lib/filters/types';
import { clsx } from 'clsx';

interface ValidationResult {
  type: 'error' | 'warning' | 'info';
  message: string;
}

export function validateFilter(filter: ItemFilter): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Check if filter has a name
  if (!filter.name || filter.name.trim() === '') {
    results.push({
      type: 'warning',
      message: 'Filter has no name. Consider adding one for identification.',
    });
  }

  // Check if filter has any rules
  if (filter.rules.length === 0) {
    results.push({
      type: 'warning',
      message: 'Filter has no rules. All items will use default visibility.',
    });
  }

  // Check for rules without conditions (catch-all)
  const catchAllRules = filter.rules.filter((r) => r.conditions.length === 0);
  if (catchAllRules.length > 1) {
    results.push({
      type: 'warning',
      message: `${catchAllRules.length} rules have no conditions (catch-all). Only the first one will apply.`,
    });
  }

  // Check for disabled rules
  const disabledRules = filter.rules.filter((r) => !r.isEnabled);
  if (disabledRules.length > 0) {
    results.push({
      type: 'info',
      message: `${disabledRules.length} rule(s) are disabled and won't affect gameplay.`,
    });
  }

  // Check for empty rarity conditions
  filter.rules.forEach((rule, index) => {
    rule.conditions.forEach((cond) => {
      if (cond.type === 'RarityCondition' && cond.rarity.length === 0) {
        results.push({
          type: 'warning',
          message: `Rule ${index + 1} has a Rarity condition with no rarities selected.`,
        });
      }
      if (cond.type === 'SubTypeCondition' && cond.equipmentTypes.length === 0) {
        results.push({
          type: 'warning',
          message: `Rule ${index + 1} has an Item Type condition with no types selected.`,
        });
      }
      if (cond.type === 'AffixCondition' && cond.affixes.length === 0) {
        results.push({
          type: 'warning',
          message: `Rule ${index + 1} has an Affix condition with no affixes selected.`,
        });
      }
      if (cond.type === 'ClassCondition' && cond.classes.length === 0) {
        results.push({
          type: 'warning',
          message: `Rule ${index + 1} has a Class condition with no classes selected.`,
        });
      }
    });
  });

  // Check for HIDE rules at start (might hide everything)
  if (filter.rules.length > 0 && filter.rules[0].type === 'HIDE' && filter.rules[0].conditions.length === 0) {
    results.push({
      type: 'error',
      message: 'First rule is a catch-all HIDE. This will hide all items!',
    });
  }

  // If no issues found
  if (results.length === 0) {
    results.push({
      type: 'info',
      message: 'No issues found. Filter looks good!',
    });
  }

  return results;
}

interface FilterValidationProps {
  filter: ItemFilter;
  className?: string;
}

export function FilterValidation({ filter, className }: FilterValidationProps) {
  const results = validateFilter(filter);
  const hasErrors = results.some((r) => r.type === 'error');
  const hasWarnings = results.some((r) => r.type === 'warning');

  const getIcon = (type: ValidationResult['type']) => {
    switch (type) {
      case 'error':
        return <XCircle size={16} className="text-red-400" />;
      case 'warning':
        return <AlertTriangle size={16} className="text-yellow-400" />;
      case 'info':
        return <Info size={16} className="text-blue-400" />;
    }
  };

  return (
    <div className={clsx('space-y-2', className)}>
      <div className="flex items-center gap-2 mb-2">
        {hasErrors ? (
          <XCircle size={18} className="text-red-400" />
        ) : hasWarnings ? (
          <AlertTriangle size={18} className="text-yellow-400" />
        ) : (
          <CheckCircle size={18} className="text-green-400" />
        )}
        <span className="text-sm font-medium">
          {hasErrors ? 'Issues Found' : hasWarnings ? 'Warnings' : 'Valid Filter'}
        </span>
      </div>
      <div className="space-y-1">
        {results.map((result, index) => (
          <div
            key={index}
            className={clsx(
              'flex items-start gap-2 text-xs p-2 rounded',
              result.type === 'error' && 'bg-red-500/10',
              result.type === 'warning' && 'bg-yellow-500/10',
              result.type === 'info' && 'bg-blue-500/10'
            )}
          >
            {getIcon(result.type)}
            <span className="text-gray-300">{result.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
