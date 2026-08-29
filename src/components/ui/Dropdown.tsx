import { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/cn';

interface Props {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'start' | 'end';
  className?: string;
}

export function Dropdown({ trigger, children, align = 'end', className }: Props) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
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
  return (
    <div ref={root} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          onClick={() => setOpen(false)}
          className={cn(
            'absolute top-full z-40 mt-1 min-w-40 rounded-md border border-border bg-surface p-1 shadow-1',
            align === 'end' ? 'right-0' : 'left-0',
            className,
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}
