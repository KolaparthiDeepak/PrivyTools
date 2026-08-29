import { cn } from '../../lib/cn';

interface Props<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  'aria-label': string;
  className?: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  ...aria
}: Props<T>) {
  const move = (dir: 1 | -1) => {
    const i = options.findIndex((o) => o.value === value);
    const next = options[(i + dir + options.length) % options.length];
    onChange(next.value);
  };
  return (
    <div
      role="radiogroup"
      aria-label={aria['aria-label']}
      className={cn(
        'inline-flex gap-1 rounded-md border border-border bg-surface-hi p-1',
        className,
      )}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          move(1);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          move(-1);
        }
      }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={cn(
              'rounded px-3 py-1.5 text-xs font-medium transition-colors',
              active ? 'bg-raise text-text shadow-[inset_0_0_0_1px_var(--border)]' : 'text-dim',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
