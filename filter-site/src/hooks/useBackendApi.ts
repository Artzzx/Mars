/**
 * Backend API Hooks
 *
 * Custom React hooks for interacting with the backend API.
 * Provides loading states, error handling, and caching.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import api, {
  FilterRequest,
  BuildAnalysisRequest,
  AnalysisResponse,
  FilterPreview,
  FilterResponse,
  StrictnessLevel,
  BuildProfile,
  AffixRecommendation,
  ApiError,
  createFilterRequest,
  downloadBlob,
} from '@/services/api';

// ============================================================================
// Types
// ============================================================================

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiResult<T> extends ApiState<T> {
  refetch: () => Promise<void>;
  reset: () => void;
}

// ============================================================================
// Backend Availability Hook
// ============================================================================

let backendAvailable: boolean | null = null;
let checkPromise: Promise<boolean> | null = null;

export function useBackendAvailable(): {
  available: boolean | null;
  checking: boolean;
  check: () => Promise<boolean>;
} {
  const [available, setAvailable] = useState<boolean | null>(backendAvailable);
  const [checking, setChecking] = useState(false);

  const check = useCallback(async () => {
    if (checkPromise) {
      return checkPromise;
    }

    setChecking(true);
    checkPromise = api.isAvailable();

    try {
      const result = await checkPromise;
      backendAvailable = result;
      setAvailable(result);
      return result;
    } finally {
      setChecking(false);
      checkPromise = null;
    }
  }, []);

  useEffect(() => {
    if (backendAvailable === null) {
      check();
    }
  }, [check]);

  return { available, checking, check };
}

// ============================================================================
// Filter Generation Hook
// ============================================================================

export function useFilterGeneration(): {
  generateFilter: (request: FilterRequest) => Promise<void>;
  generateFilterJson: (request: FilterRequest) => Promise<FilterResponse | null>;
  previewFilter: (request: FilterRequest) => Promise<FilterPreview | null>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
} {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateFilter = useCallback(async (request: FilterRequest) => {
    setLoading(true);
    setError(null);

    try {
      const blob = await api.generateFilter(request);
      const filename = `${request.build_id || request.character_class}_${request.strictness}_filter.xml`;
      downloadBlob(blob, filename);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to generate filter';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const generateFilterJson = useCallback(async (request: FilterRequest) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.generateFilterJson(request);
      return response;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to generate filter';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const previewFilter = useCallback(async (request: FilterRequest) => {
    setLoading(true);
    setError(null);

    try {
      const preview = await api.previewFilter(request);
      return preview;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to preview filter';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    generateFilter,
    generateFilterJson,
    previewFilter,
    loading,
    error,
    clearError,
  };
}

// ============================================================================
// Build Analysis Hook
// ============================================================================

export function useBuildAnalysis(): {
  analyze: (request: BuildAnalysisRequest) => Promise<AnalysisResponse | null>;
  analysis: AnalysisResponse | null;
  loading: boolean;
  error: string | null;
  clearAnalysis: () => void;
} {
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (request: BuildAnalysisRequest) => {
    setLoading(true);
    setError(null);

    try {
      const result = await api.analyzeBuild(request);
      setAnalysis(result);
      return result;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to analyze build';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearAnalysis = useCallback(() => {
    setAnalysis(null);
    setError(null);
  }, []);

  return { analyze, analysis, loading, error, clearAnalysis };
}

// ============================================================================
// Affix Recommendations Hook
// ============================================================================

export function useAffixRecommendations(
  characterClass: string | null,
  damageTypes: string[] = []
): UseApiResult<AffixRecommendation[]> {
  const [state, setState] = useState<ApiState<AffixRecommendation[]>>({
    data: null,
    loading: false,
    error: null,
  });

  const prevClassRef = useRef<string | null>(null);
  const prevTypesRef = useRef<string[]>([]);

  const fetch = useCallback(async () => {
    if (!characterClass) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const result = await api.getRecommendedAffixes(characterClass, damageTypes);
      setState({ data: result.affixes, loading: false, error: null });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch recommendations';
      setState((prev) => ({ ...prev, loading: false, error: message }));
    }
  }, [characterClass, damageTypes]);

  useEffect(() => {
    const typesChanged =
      damageTypes.length !== prevTypesRef.current.length ||
      damageTypes.some((t, i) => t !== prevTypesRef.current[i]);

    if (characterClass !== prevClassRef.current || typesChanged) {
      prevClassRef.current = characterClass;
      prevTypesRef.current = damageTypes;
      fetch();
    }
  }, [characterClass, damageTypes, fetch]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, refetch: fetch, reset };
}

// ============================================================================
// Strictness Levels Hook
// ============================================================================

let cachedStrictnessLevels: StrictnessLevel[] | null = null;

export function useStrictnessLevels(): UseApiResult<StrictnessLevel[]> {
  const [state, setState] = useState<ApiState<StrictnessLevel[]>>({
    data: cachedStrictnessLevels,
    loading: cachedStrictnessLevels === null,
    error: null,
  });

  const fetch = useCallback(async () => {
    if (cachedStrictnessLevels) {
      setState({ data: cachedStrictnessLevels, loading: false, error: null });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const result = await api.getStrictnessLevels();
      cachedStrictnessLevels = result.levels;
      setState({ data: result.levels, loading: false, error: null });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch strictness levels';
      setState((prev) => ({ ...prev, loading: false, error: message }));
    }
  }, []);

  useEffect(() => {
    if (!cachedStrictnessLevels) {
      fetch();
    }
  }, [fetch]);

  const reset = useCallback(() => {
    cachedStrictnessLevels = null;
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, refetch: fetch, reset };
}

// ============================================================================
// Build Profiles Hook
// ============================================================================

let cachedBuildProfiles: BuildProfile[] | null = null;

export function useBuildProfiles(): UseApiResult<BuildProfile[]> {
  const [state, setState] = useState<ApiState<BuildProfile[]>>({
    data: cachedBuildProfiles,
    loading: cachedBuildProfiles === null,
    error: null,
  });

  const fetch = useCallback(async () => {
    if (cachedBuildProfiles) {
      setState({ data: cachedBuildProfiles, loading: false, error: null });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const result = await api.getBuildProfiles();
      cachedBuildProfiles = result.builds;
      setState({ data: result.builds, loading: false, error: null });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch build profiles';
      setState((prev) => ({ ...prev, loading: false, error: message }));
    }
  }, []);

  useEffect(() => {
    if (!cachedBuildProfiles) {
      fetch();
    }
  }, [fetch]);

  const reset = useCallback(() => {
    cachedBuildProfiles = null;
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, refetch: fetch, reset };
}

// ============================================================================
// Combined Generation Hook (with fallback)
// ============================================================================

export function useFilterGenerationWithFallback(
  localGenerator: (options: {
    strictnessId: string;
    buildId?: string;
    selectedClasses: string[];
  }) => unknown
): {
  generate: (
    request: FilterRequest,
    localOptions: {
      strictnessId: string;
      buildId?: string;
      selectedClasses: string[];
    }
  ) => Promise<unknown>;
  loading: boolean;
  error: string | null;
  usedBackend: boolean;
} {
  const { available } = useBackendAvailable();
  const { generateFilterJson, loading, error } = useFilterGeneration();
  const [usedBackend, setUsedBackend] = useState(false);

  const generate = useCallback(
    async (
      request: FilterRequest,
      localOptions: {
        strictnessId: string;
        buildId?: string;
        selectedClasses: string[];
      }
    ) => {
      // Try backend first if available
      if (available && import.meta.env.VITE_ENABLE_BACKEND === 'true') {
        const result = await generateFilterJson(request);
        if (result) {
          setUsedBackend(true);
          return result;
        }
      }

      // Fallback to local generation
      setUsedBackend(false);
      return localGenerator(localOptions);
    },
    [available, generateFilterJson, localGenerator]
  );

  return { generate, loading, error, usedBackend };
}

// ============================================================================
// Export helper
// ============================================================================

export { createFilterRequest };
