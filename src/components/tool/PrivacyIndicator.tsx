import { Lock } from 'lucide-react';
import { PRIVACY_COPY, type ProcessingMode } from '../../lib/privacyCopy';
import { cn } from '../../lib/cn';

export function PrivacyIndicator({
  mode,
  compact,
  className,
}: {
  mode: ProcessingMode;
  compact?: boolean;
  className?: string;
}) {
  const copy = PRIVACY_COPY[mode];
  if (compact) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 font-mono text-[10.5px] tracking-wide',
          mode === 'local' ? 'text-[hsl(var(--accent-privacy))]' : 'text-dim',
          className,
        )}
      >
        <Lock className="size-3" />
        {copy.short}
      </span>
    );
  }
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-md border border-border bg-surface-hi p-3 text-xs',
        className,
      )}
    >
      <span className="inline-flex items-center gap-1.5 font-medium text-text">
        <Lock className="size-3.5" /> Privacy
      </span>
      <p className="text-dim">{copy.long}</p>
    </div>
  );
}
