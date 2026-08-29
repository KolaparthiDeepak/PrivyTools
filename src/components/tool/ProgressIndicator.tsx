import { cn } from '../../lib/cn';

export function ProgressIndicator({ ratio, label }: { ratio?: number; label: string }) {
  const pct = ratio != null ? Math.round(ratio * 100) : undefined;
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-center justify-between font-mono text-[11px] text-dim">
        <span aria-live="polite">{label}</span>
        {pct != null && <span>{pct}%</span>}
      </div>
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-[3px] w-full overflow-hidden rounded-full bg-track"
      >
        <div
          className={cn(
            'h-full rounded-full bg-accent transition-[width] duration-300 ease-expo',
            pct == null && 'w-1/3 animate-pulse',
          )}
          style={pct != null ? { width: `${pct}%` } : undefined}
        />
      </div>
    </div>
  );
}
