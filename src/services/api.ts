/**
 * API Service Layer
 *
 * Centralized service for all backend API calls.
 * Provides type-safe methods for filter generation and analysis.
 */

import type { ItemFilter } from '@/lib/filters/types';
import type { CharacterClass, DamageType, StrictnessLevel } from '@/lib/filters/types';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_TIMEOUT = 30000; // 30 seconds

// ============================================================================
// Types
// ============================================================================

export interface FilterRequest {
  character_class: string;
  level: number;
  strictness: string;
  damage_types: string[];
  priority_stats: Record<string, string[]>;
  weapon_types: string[];
  hide_normal: boolean;
  hide_magic: boolean;
  min_legendary_potential: number;
  min_weavers_will: number;
  build_id?: string;
}

export interface BuildAnalysisRequest {
  character_class: string;
  damage_types: string[];
  build_id?: string;
}

export interface AffixRecommendation {
  id: number;
  name: string;
  score: number;
  category: string;
  sources: string[];
}

export interface AnalysisResponse {
  recommended_affixes: AffixRecommendation[];
  build_profile: Record<string, unknown> | null;
  strictness_config: Record<string, unknown>;
  rule_preview: Array<{ pattern: string; type: string; usage: string }>;
}

export interface FilterPreview {
  total_rules: number;
  rule_breakdown: Record<string, number>;
  strictness: string;
  build_profile: string | null;
  top_affixes: Array<{ id: number; name: string }>;
  color_scheme: Record<string, number>;
}

export interface FilterResponse {
  xml: string;
  metadata: {
    name: string;
    filterIcon: number;
    filterIconColor: number;
    description: string;
    lastModifiedInVersion: string;
    lootFilterVersion: number;
  };
  rule_count: number;
  warnings: string[];
}

export interface StrictnessLevel {
  id: string;
  name: string;
  description: string;
  order: number;
  minLegendaryPotential: number;
  minWeaversWill: number;
  showRarities: string[];
  hideRarities: string[];
}

export interface BuildProfile {
  id: string;
  name: string;
  display_name: string;
  character_class: string;
  ascendancy: string;
  damage_types: string[];
  valued_affixes: {
    essential: number[];
    high: number[];
    medium: number[];
    low: number[];
  };
}

export interface HealthStatus {
  status: string;
  version: string;
  database_connected: boolean;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ============================================================================
// API Client
// ============================================================================

class ApiClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = API_BASE_URL, timeout: number = API_TIMEOUT) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.detail || `API error: ${response.status}`,
          response.status,
          errorData
        );
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ApiError('Request timeout', 408);
        }
        throw new ApiError(error.message, 0);
      }

      throw new ApiError('Unknown error occurred', 0);
    }
  }

  private async requestBlob(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Blob> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.detail || `API error: ${response.status}`,
          response.status,
          errorData
        );
      }

      return response.blob();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ApiError('Request timeout', 408);
        }
        throw new ApiError(error.message, 0);
      }

      throw new ApiError('Unknown error occurred', 0);
    }
  }

  // ==========================================================================
  // Health Check
  // ==========================================================================

  async checkHealth(): Promise<HealthStatus> {
    return this.request<HealthStatus>('/health');
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.checkHealth();
      return true;
    } catch {
      return false;
    }
  }

  // ==========================================================================
  // Filter Generation
  // ==========================================================================

  async generateFilter(request: FilterRequest): Promise<Blob> {
    return this.requestBlob('/api/generate-filter', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async generateFilterJson(request: FilterRequest): Promise<FilterResponse> {
    return this.request<FilterResponse>('/api/generate-filter/json', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async previewFilter(request: FilterRequest): Promise<FilterPreview> {
    return this.request<FilterPreview>('/api/preview-filter', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // ==========================================================================
  // Build Analysis
  // ==========================================================================

  async analyzeBuild(request: BuildAnalysisRequest): Promise<AnalysisResponse> {
    return this.request<AnalysisResponse>('/api/analyze-build', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getRecommendedAffixes(
    characterClass: string,
    damageTypes: string[] = [],
    limit: number = 20
  ): Promise<{ affixes: AffixRecommendation[] }> {
    const params = new URLSearchParams({
      character_class: characterClass,
      limit: limit.toString(),
    });
    damageTypes.forEach((dt) => params.append('damage_types', dt));

    return this.request(`/api/recommended-affixes?${params}`);
  }

  // ==========================================================================
  // Configuration
  // ==========================================================================

  async getStrictnessLevels(): Promise<{ levels: StrictnessLevel[] }> {
    return this.request('/api/strictness-levels');
  }

  async getStrictnessConfig(strictnessId: string): Promise<StrictnessLevel> {
    return this.request(`/api/strictness/${strictnessId}`);
  }

  async getCharacterClasses(): Promise<{ classes: Array<{ id: string; name: string }> }> {
    return this.request('/api/classes');
  }

  async getDamageTypes(): Promise<{ damage_types: Array<{ id: string; name: string }> }> {
    return this.request('/api/damage-types');
  }

  // ==========================================================================
  // Build Profiles
  // ==========================================================================

  async getBuildProfiles(): Promise<{ builds: BuildProfile[] }> {
    return this.request('/api/builds');
  }

  async getBuildProfile(buildId: string): Promise<BuildProfile> {
    return this.request(`/api/builds/${buildId}`);
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const api = new ApiClient();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a filter request from frontend state
 */
export function createFilterRequest(
  characterClass: string,
  strictness: string,
  options: {
    level?: number;
    damageTypes?: string[];
    priorityStats?: Record<string, string[]>;
    weaponTypes?: string[];
    hideNormal?: boolean;
    hideMagic?: boolean;
    minLegendaryPotential?: number;
    minWeaversWill?: number;
    buildId?: string;
  } = {}
): FilterRequest {
  return {
    character_class: characterClass,
    level: options.level ?? 75,
    strictness: strictness,
    damage_types: options.damageTypes ?? [],
    priority_stats: options.priorityStats ?? {},
    weapon_types: options.weaponTypes ?? [],
    hide_normal: options.hideNormal ?? false,
    hide_magic: options.hideMagic ?? false,
    min_legendary_potential: options.minLegendaryPotential ?? 0,
    min_weavers_will: options.minWeaversWill ?? 0,
    build_id: options.buildId,
  };
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default api;
