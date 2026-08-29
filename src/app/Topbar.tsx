import { Link } from 'react-router-dom';
import { Search, Settings, Monitor, Sun, Moon } from 'lucide-react';
import { usePrefs } from '../store/prefs.store';
import { Dropdown, Kbd } from '../components/ui';

const THEMES = [
  { v: 'system', label: 'System', Icon: Monitor },
  { v: 'light', label: 'Light', Icon: Sun },
  { v: 'dark', label: 'Dark', Icon: Moon },
] as const;

export function Topbar({ onOpenPalette }: { onOpenPalette: () => void }) {
  const theme = usePrefs((s) => s.theme);
  const setTheme = usePrefs((s) => s.setTheme);
  const Active = THEMES.find((t) => t.v === theme)!.Icon;
  return (
    <div className="flex h-full items-center gap-3 px-4">
      <button
        type="button"
        onClick={onOpenPalette}
        className="flex max-w-sm flex-1 items-center gap-2.5 rounded-md border border-border bg-surface-hi px-3 py-2 text-sm text-dim"
      >
        <Search className="size-3.5" />
        <span>What do you want to do?</span>
        <Kbd className="ml-auto">⌘K</Kbd>
      </button>
      <div className="ml-auto flex items-center gap-2">
        <Dropdown
          label="Theme"
          trigger={
            <span className="grid size-9 place-items-center rounded-md border border-border bg-surface-hi text-dim">
              <Active className="size-4" />
            </span>
          }
        >
          {THEMES.map((t) => (
            <button
              key={t.v}
              type="button"
              onClick={() => setTheme(t.v)}
              className="flex w-full items-center gap-2.5 rounded px-2.5 py-1.5 text-sm text-dim hover:bg-surface-hi hover:text-text aria-[current=true]:text-text"
              aria-current={theme === t.v}
            >
              <t.Icon className="size-3.5" /> {t.label}
            </button>
          ))}
        </Dropdown>
        <Link
          to="/privacy#preferences"
          aria-label="Settings"
          className="grid size-9 place-items-center rounded-md border border-border bg-surface-hi text-dim hover:text-text"
        >
          <Settings className="size-4" />
        </Link>
      </div>
    </div>
  );
}
