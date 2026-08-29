import { forwardRef } from 'react';
import { cn } from '../../lib/cn';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'subtle';
  size?: 'sm' | 'md';
};

const V = {
  primary: 'bg-text text-bg hover:opacity-90',
  ghost: 'bg-transparent hover:bg-surface-hi text-text',
  subtle: 'bg-surface-hi border border-border hover:border-border-hi text-text',
};
const S = { sm: 'h-8 px-3 text-sm', md: 'h-10 px-4 text-sm' };

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ variant = 'subtle', size = 'md', className, disabled, ...rest }, ref) => (
    <button
      ref={ref}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium',
        'transition-[background,border-color,opacity,transform] duration-200 ease-expo',
        'disabled:opacity-40 disabled:pointer-events-none',
        V[variant],
        S[size],
        className,
      )}
      {...rest}
    />
  ),
);
Button.displayName = 'Button';
