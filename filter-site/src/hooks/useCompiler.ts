import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { compileFilterFull } from '../lib/compiler/client';
import type { UserInput } from '../lib/compiler/client';
import { useGeneratorStore } from '../store/generatorStore';
import { useFilterStore } from '../store/filterStore';

export function useCompiler() {
  const setGenerating    = useGeneratorStore((s) => s.setGenerating);
  const setCompileResult = useGeneratorStore((s) => s.setCompileResult);
  const setError         = useGeneratorStore((s) => s.setError);
  const populateFilter   = useFilterStore((s) => s.populateFromCompileResult);
  const navigate         = useNavigate();

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
  }, [setGenerating, setError, setCompileResult, populateFilter, navigate]);

  const isGenerating = useGeneratorStore((s) => s.isGenerating);
  const error        = useGeneratorStore((s) => s.error);

  return { compile, isGenerating, error };
}
