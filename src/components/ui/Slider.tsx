import { cn } from '../../lib/cn';

interface Props {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (n: number) => void;
  leftLabel?: string;
  rightLabel?: string;
  'aria-label'?: string;
  className?: string;
}

export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  leftLabel,
  rightLabel,
  className,
  ...aria
}: Props) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 w-full cursor-pointer appearance-none rounded-full bg-track accent-[hsl(var(--accent))]"
        {...aria}
      />
      {(leftLabel || rightLabel) && (
        <div className="flex justify-between font-mono text-[10px] text-dim">
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </div>
      )}
    </div>
  );
}
