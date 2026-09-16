import { useEffect, useRef } from 'react';
import { usePrefs } from '../store/prefs.store';
import { useUsage } from '../store/usage.store';

export function useTrackToolUsage(toolId: string | undefined, succeeded: boolean): void {
  const telemetry = usePrefs((s) => s.telemetry);
  const increment = useUsage((s) => s.increment);
  const counted = useRef(false);

  useEffect(() => {
    if (!telemetry || !toolId || !succeeded || counted.current) return;
    counted.current = true;
    increment(toolId);
  }, [telemetry, toolId, succeeded, increment]);
}
