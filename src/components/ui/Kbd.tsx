import { cn } from '../../lib/cn';

export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex items-center rounded border border-border px-1.5 py-0.5',
        'font-mono text-[10px] text-dim',
        className,
      )}
    >
      {children}
    </kbd>
  );
}
