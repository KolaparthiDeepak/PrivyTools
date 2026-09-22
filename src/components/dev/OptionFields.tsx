import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../lib/cn';

const LABEL = 'font-mono text-[10px] uppercase tracking-widest text-dim/70';
const CONTROL =
  'h-10 w-full rounded-md border border-border bg-sunken px-3 font-mono text-[13px] text-text outline-none placeholder:text-dim focus:border-border-hi disabled:opacity-50';

interface FieldProps {
  label: string;
  className?: string;
  children: React.ReactNode;
}

function Field({ label, className, children }: FieldProps) {
  return (
    <label className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <span className={LABEL}>{label}</span>
      {children}
    </label>
  );
}

interface SelectFieldProps<T extends string> {
  label: string;
  value: T;
  options: readonly (T | { value: T; label: string })[];
  onChange: (v: T) => void;
  className?: string;
}

export function SelectField<T extends string>({ label, value, options, onChange, className }: SelectFieldProps<T>) {
  return (
    <Field label={label} className={className}>
      <select className={CONTROL} value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => {
          const opt = typeof o === 'string' ? { value: o, label: o } : o;
          return <option key={opt.value} value={opt.value}>{opt.label}</option>;
        })}
      </select>
    </Field>
  );
}

interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  onChange: (v: string) => void;
  secret?: boolean;
  trailing?: React.ReactNode;
}

export function TextField({ label, onChange, secret = false, trailing, className, type, ...rest }: TextFieldProps) {
  const [shown, setShown] = useState(false);
  return (
    <Field label={label} className={className}>
      <div className="relative flex items-center">
        <input
          {...rest}
          type={secret && !shown ? 'password' : (type ?? 'text')}
          spellCheck={false}
          autoComplete="off"
          onChange={(e) => onChange(e.target.value)}
          className={cn(CONTROL, (secret || trailing) && 'pr-10')}
        />
        <span className="absolute right-2 flex items-center gap-1">
          {trailing}
          {secret && (
            <button
              type="button"
              aria-label={shown ? `Hide ${label}` : `Show ${label}`}
              className="text-dim hover:text-text"
              onClick={(e) => { e.preventDefault(); setShown((s) => !s); }}
            >
              {shown ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
          )}
        </span>
      </div>
    </Field>
  );
}

export function CheckField({ label, checked, onChange, disabled }: {
  label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <label className={cn('flex items-center gap-1.5 text-xs text-dim', disabled && 'opacity-50')}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
