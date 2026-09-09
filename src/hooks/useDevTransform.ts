import { useEffect, useRef, useState } from 'react';

interface Result<T> {
  output: T | null;
  error: string | null;
  pending: boolean;
}

export function useDevTransform<T>(
  fn: (input: string) => T,
  input: string,
  opts: { debounceMs?: number } = {},
): Result<T> {
  const debounceMs = opts.debounceMs ?? 150;
  const [state, setState] = useState<Result<T>>({ output: null, error: null, pending: false });
  const lastGood = useRef<T | null>(null);

  useEffect(() => {
    if (input.trim() === '') {
      setState({ output: null, error: null, pending: false });
      return;
    }
    setState((s) => ({ ...s, pending: true }));
    const id = setTimeout(() => {
      try {
        const out = fn(input);
        lastGood.current = out;
        setState({ output: out, error: null, pending: false });
      } catch (e) {
        setState({
          output: lastGood.current,
          error: e instanceof Error ? e.message : String(e),
          pending: false,
        });
      }
    }, debounceMs);
    return () => clearTimeout(id);
  }, [fn, input, debounceMs]);

  return state;
}
