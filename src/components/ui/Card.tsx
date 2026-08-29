import { cn } from '../../lib/cn';

type Props<T extends 'div' | 'a' | 'button'> = {
  as?: T;
  interactive?: boolean;
  className?: string;
} & Omit<React.ComponentPropsWithoutRef<T>, 'className'>;

export function Card<T extends 'div' | 'a' | 'button' = 'div'>({
  as,
  interactive,
  className,
  ...rest
}: Props<T>) {
  const Tag = (as ?? 'div') as React.ElementType;
  return (
    <Tag
      className={cn(
        'rounded-lg border border-border bg-surface-hi',
        interactive &&
          'transition-[transform,border-color] duration-200 ease-expo hover:-translate-y-0.5 hover:border-border-hi',
        className,
      )}
      {...rest}
    />
  );
}
