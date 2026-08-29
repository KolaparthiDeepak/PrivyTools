import { useRef, useState } from 'react';
import { ChevronsLeftRight } from 'lucide-react';
import { cn } from '../../lib/cn';

interface Props {
  before: React.ReactNode;
  after: React.ReactNode;
  beforeLabel?: string;
  afterLabel?: string;
  initial?: number;
  className?: string;
}

export function BeforeAfterComparison({
  before,
  after,
  beforeLabel,
  afterLabel,
  initial = 0.5,
  className,
}: Props) {
  const [split, setSplit] = useState(clamp(initial));
  const box = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const fromClientX = (x: number) => {
    const r = box.current?.getBoundingClientRect();
    if (!r || !r.width) return;
    setSplit(clamp((x - r.left) / r.width));
  };

  return (
    <div
      ref={box}
      className={cn('relative h-40 select-none overflow-hidden rounded-md border border-border', className)}
      onPointerDown={(e) => {
        dragging.current = true;
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        fromClientX(e.clientX);
      }}
      onPointerMove={(e) => dragging.current && fromClientX(e.clientX)}
      onPointerUp={() => (dragging.current = false)}
    >
      <div className="absolute inset-0">{before}</div>
      <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${split * 100}%)` }}>
        {after}
      </div>
      {beforeLabel && (
        <span className="absolute left-2 top-2 rounded bg-black/50 px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-white">
          {beforeLabel}
        </span>
      )}
      {afterLabel && (
        <span className="absolute right-2 top-2 rounded bg-black/50 px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-white">
          {afterLabel}
        </span>
      )}
      <div
        role="slider"
        tabIndex={0}
        aria-label="Comparison position"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(split * 100)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') setSplit((s) => clamp(s + 0.02));
          if (e.key === 'ArrowLeft') setSplit((s) => clamp(s - 0.02));
        }}
        className="absolute top-1/2 z-10 grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-text text-bg"
        style={{ left: `${split * 100}%` }}
      >
        <ChevronsLeftRight className="size-3" />
      </div>
      <div className="pointer-events-none absolute inset-y-0 w-px bg-border-hi" style={{ left: `${split * 100}%` }} />
    </div>
  );
}

function clamp(n: number) {
  return Math.min(1, Math.max(0, n));
}
