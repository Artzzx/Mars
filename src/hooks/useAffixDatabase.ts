import { useState, useEffect, useMemo } from 'react';
import type { Affix, AffixDatabase } from '../lib/filters/affixTypes';
import { searchAffixes } from '../lib/filters/affixTypes';

interface UseAffixDatabaseResult {
  affixes: Affix[];
  loading: boolean;
  error: string | null;
  search: (
    query: string,
    filters?: {
      type?: number;
      classSpecificity?: number;
      minTier?: number;
      maxLevelReq?: number;
    }
  ) => Affix[];
  getAffixById: (id: number) => Affix | undefined;
  getAffixesByIds: (ids: number[]) => Affix[];
}

let cachedAffixes: Affix[] | null = null;

export function useAffixDatabase(): UseAffixDatabaseResult {
  const [affixes, setAffixes] = useState<Affix[]>(cachedAffixes || []);
  const [loading, setLoading] = useState(!cachedAffixes);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedAffixes) {
      setAffixes(cachedAffixes);
      setLoading(false);
      return;
    }

    const loadAffixes = async () => {
      try {
        const response = await fetch('/affixes.json');
        if (!response.ok) {
          throw new Error(`Failed to load affixes: ${response.status}`);
        }
        const data: AffixDatabase = await response.json();
        cachedAffixes = data.merged;
        setAffixes(data.merged);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load affix database');
        setLoading(false);
      }
    };

    loadAffixes();
  }, []);

  const affixMap = useMemo(() => {
    const map = new Map<number, Affix>();
    affixes.forEach((affix) => map.set(affix.affixId, affix));
    return map;
  }, [affixes]);

  const search = (
    query: string,
    filters?: {
      type?: number;
      classSpecificity?: number;
      minTier?: number;
      maxLevelReq?: number;
    }
  ) => {
    return searchAffixes(affixes, query, filters);
  };

  const getAffixById = (id: number) => {
    return affixMap.get(id);
  };

  const getAffixesByIds = (ids: number[]) => {
    return ids.map((id) => affixMap.get(id)).filter((a): a is Affix => a !== undefined);
  };

  return {
    affixes,
    loading,
    error,
    search,
    getAffixById,
    getAffixesByIds,
  };
}
