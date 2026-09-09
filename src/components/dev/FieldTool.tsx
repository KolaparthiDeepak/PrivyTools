import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { CodeEditor } from './CodeEditor';
import { useDevTransform } from '../../hooks/useDevTransform';

export interface FieldRow { label: string; value: string }

interface FieldToolProps {
  compute: (input: string) => FieldRow[];
  inputLabel: string;
  placeholder?: string;
  multiline?: boolean;
}

function Row({ row }: { row: FieldRow }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-sunken px-3 py-2">
      <span className="font-mono text-[10px] uppercase tracking-widest text-dim/70">{row.label}</span>
      <span className="flex-1 truncate text-right font-mono text-[13px] text-text">{row.value}</span>
      <button
        type="button"
        aria-label={`Copy ${row.label}`}
        className="text-dim hover:text-text"
        onClick={async () => {
          await navigator.clipboard.writeText(row.value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        }}
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </button>
    </div>
  );
}

export function FieldTool({ compute, inputLabel, placeholder, multiline = false }: FieldToolProps) {
  const [input, setInput] = useState('');
  const { output, error } = useDevTransform(compute, input);
  // Keep the last good rows so they survive a transient error (useDevTransform
  // drops its own lastGood ref when the input is cleared).
  const [lastRows, setLastRows] = useState<FieldRow[]>([]);
  if (output != null && output !== lastRows) setLastRows(output);
  const rows = output ?? (error ? lastRows : []);

  return (
    <div className="flex flex-col gap-4">
      {multiline ? (
        <CodeEditor label={inputLabel} value={input} onChange={setInput} placeholder={placeholder} />
      ) : (
        <label className="flex flex-col gap-1.5">
          <span className="sr-only">{inputLabel}</span>
          <input
            aria-label={inputLabel}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            spellCheck={false}
            className="h-11 w-full rounded-md border border-border bg-sunken px-3 font-mono text-[13px] text-text outline-none placeholder:text-dim"
          />
        </label>
      )}
      {error && (
        <p role="alert" className="rounded-md border border-border bg-sunken px-3 py-2 text-xs text-[hsl(var(--danger))]">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-2">
        {rows.map((r) => <Row key={r.label} row={r} />)}
      </div>
    </div>
  );
}
