import { useEffect, useRef } from 'react';
import { usePrefs } from '../store/prefs.store';
import { useUsage } from '../store/usage.store';

export function useTrackToolUsage(toolId: string | undefined, succeeded: boolean): void {
  const telemetry = usePrefs((s) => s.telemetry);
  const increment = useUsage((s) => s.increment);
  const wasSucceeded = useRef(false);

  useEffect(() => {
    const isRisingEdge = succeeded && !wasSucceeded.current;
    wasSucceeded.current = succeeded;
    if (telemetry && toolId && isRisingEdge) {
      increment(toolId);
    }
  }, [telemetry, toolId, succeeded, increment]);
}
