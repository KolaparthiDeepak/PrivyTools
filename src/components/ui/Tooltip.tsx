import { useId, useState } from 'react';
import { cn } from '../../lib/cn';

export function Tooltip({
  content,
  children,
  className,
}: {
  content: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [show, setShow] = useState(false);
  const id = useId();
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
      aria-describedby={show ? id : undefined}
    >
      {children}
      {show && (
        <span
          role="tooltip"
          id={id}
          className={cn(
            'pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap',
            'rounded-md border border-border-hi bg-surface px-2 py-1 text-xs text-text shadow-1',
            className,
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}
