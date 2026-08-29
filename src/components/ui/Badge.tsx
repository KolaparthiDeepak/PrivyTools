import { cn } from '../../lib/cn';

type Tone = 'neutral' | 'accent' | 'warn';
const TONE: Record<Tone, string> = {
  neutral: 'bg-surface-hi text-dim border-border',
  accent: 'text-accent border-accent/30',
  warn: 'text-amber-500 border-amber-500/30',
};

export function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-2.5 py-1 font-mono text-[11px]',
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
