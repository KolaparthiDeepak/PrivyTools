import { usePrefs } from '../store/prefs.store';

export function useRecent() {
  const recent = usePrefs((s) => s.recent);
  const push = usePrefs((s) => s.pushRecent);
  return { recent, push };
}
