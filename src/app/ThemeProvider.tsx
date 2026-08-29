import { useEffect } from 'react';
import { usePrefs } from '../store/prefs.store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = usePrefs((s) => s.theme);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const mode = theme === 'system' ? (mq.matches ? 'dark' : 'light') : theme;
      document.documentElement.dataset.mode = mode;
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);
  return <>{children}</>;
}
