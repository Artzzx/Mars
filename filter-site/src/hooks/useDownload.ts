import { useCallback } from 'react';
import { toast } from 'sonner';

export function useDownload() {
  const downloadFilter = useCallback((xml: string, filename: string) => {
    const blob = new Blob([xml], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename.endsWith('.filter') ? filename : `${filename}.filter`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const copyToClipboard = useCallback(async (xml: string) => {
    try {
      await navigator.clipboard.writeText(xml);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  }, []);

  return { downloadFilter, copyToClipboard };
}

/**
 * Builds the download filename from filter parameters.
 * Convention: {mastery}-{damageTypes.join('-')}-{progress}.filter
 * All lowercase, spaces replaced with hyphens.
 */
export function buildFilterFilename(mastery: string, damageTypes: string[], progress: string): string {
  const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, '-');
  const parts = [
    normalize(mastery),
    damageTypes.map(normalize).join('-'),
    normalize(progress),
  ];
  return `${parts.join('-')}.filter`;
}
