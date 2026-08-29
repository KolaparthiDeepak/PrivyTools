import { forwardRef } from 'react';
import { cn } from '../../lib/cn';

type Props = React.InputHTMLAttributes<HTMLInputElement> & { trailing?: React.ReactNode };

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ trailing, className, ...rest }, ref) => (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md border border-border bg-surface-hi px-3',
        'focus-within:border-border-hi',
        className,
      )}
    >
      <input
        ref={ref}
        className="h-10 flex-1 bg-transparent font-mono text-sm text-text outline-none placeholder:text-dim"
        {...rest}
      />
      {trailing}
    </div>
  ),
);
Input.displayName = 'Input';
