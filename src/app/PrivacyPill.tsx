import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Lock, Check } from 'lucide-react';
import { TOOLS } from '../tools/registry';
import { PRIVACY_COPY } from '../lib/privacyCopy';
import { cn } from '../lib/cn';

const POINTS = ['No file upload', 'No cloud storage', 'No account required', 'File contents are not tracked'];

export function PrivacyPill() {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  const tool = TOOLS.find((t) => t.route === pathname);
  const mode = tool?.processing ?? 'local';
  const copy = PRIVACY_COPY[mode];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <div ref={root} className="fixed bottom-4 left-4 z-40">
      {open && (
        <div className="mb-2 w-72 rounded-lg border border-border-hi bg-surface p-4 text-xs shadow-1">
          <p className="font-mono text-[10px] uppercase tracking-widest text-dim">Your file is private</p>
          <p className="mt-2 text-dim">{copy.long}</p>
          <ul className="mt-3 flex flex-col gap-1.5">
            {POINTS.map((p) => (
              <li key={p} className="flex items-center gap-2 text-text">
                <Check className="size-3.5 text-[hsl(var(--accent-privacy))]" /> {p}
              </li>
            ))}
          </ul>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={cn(
          'inline-flex items-center gap-2 rounded-full border border-border bg-surface-hi/90 px-3 py-1.5',
          'font-mono text-[11px] tracking-wide backdrop-blur',
          mode === 'local' ? 'text-[hsl(var(--accent-privacy))]' : 'text-dim',
        )}
      >
        <Lock className="size-3" />
        {mode === 'local' ? 'Local processing' : copy.short}
      </button>
    </div>
  );
}
