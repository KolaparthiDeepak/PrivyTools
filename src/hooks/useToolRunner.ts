import { useCallback, useRef, useState } from 'react';
import type { FileResult, Progress, ToolService } from '../services/types';
import { ToolError } from '../services/types';
import { useTrackToolUsage } from './useTrackToolUsage';

type Step = 'select' | 'configure' | 'process' | 'result' | 'error';

export function useToolRunner<C>(service: ToolService<C>, initialConfig: C, toolId?: string) {
  const [step, setStep] = useState<Step>('select');
  const [files, setFiles] = useState<File[]>([]);
  const [config, setConfigState] = useState<C>(initialConfig);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [result, setResult] = useState<FileResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const setConfig = useCallback((partial: Partial<C>) => {
    setConfigState((c) => ({ ...c, ...partial }));
  }, []);

  const selectFile = useCallback((f: File | File[]) => {
    setFiles(Array.isArray(f) ? f : [f]);
    setError(null);
    setResult(null);
    setStep('configure');
  }, []);

  const run = useCallback(async () => {
    if (!files.length) return;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setStep('process');
    setProgress({ phase: 'Starting' });
    setError(null);
    try {
      const input = files.length === 1 ? files[0] : files;
      const res = await service.process(input, config, setProgress, ac.signal);
      if (ac.signal.aborted) return;
      setResult(res);
      setStep('result');
    } catch (e) {
      if (ac.signal.aborted) return;
      const msg = e instanceof ToolError ? e.userMessage : "We couldn't process this file.";
      if (import.meta.env.DEV) console.warn('[tool]', (e as Error).message);
      setError(msg);
      setStep('error');
    }
  }, [files, config, service]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setStep(files.length ? 'configure' : 'select');
  }, [files.length]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setFiles([]);
    setProgress(null);
    setResult(null);
    setError(null);
    setStep('select');
  }, []);

  useTrackToolUsage(toolId, step === 'result');

  return {
    step,
    file: files[0] ?? null,
    files,
    config,
    setConfig,
    progress,
    result,
    error,
    selectFile,
    run,
    cancel,
    reset,
  };
}
