import { useMemo, useState } from 'react';
import { CodeEditor } from './CodeEditor';
import type { DiffLine } from '../../services/dev/text-diff';
import { cn } from '../../lib/cn';
import { useTrackToolUsage } from '../../hooks/useTrackToolUsage';

export function DiffTool({ toolId, diff }: { toolId: string; diff: (a: string, b: string) => DiffLine[] }) {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const lines = useMemo(() => (a === '' && b === '' ? [] : diff(a, b)), [a, b, diff]);
  const added = lines.filter((l) => l.kind === 'add').length;
  const removed = lines.filter((l) => l.kind === 'remove').length;

  useTrackToolUsage(toolId, lines.length > 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <CodeEditor label="Original" value={a} onChange={setA} placeholder="paste the original" />
        <CodeEditor label="Changed" value={b} onChange={setB} placeholder="paste the changed version" />
      </div>
      <div className="flex items-center gap-3 font-mono text-[11px] text-dim">
        <span className="text-[hsl(var(--diff-add))]">+{added}</span>
        <span className="text-[hsl(var(--diff-remove))]">−{removed}</span>
      </div>
      <pre
        data-testid="diff-output"
        className="overflow-x-auto rounded-md border border-border bg-sunken p-3 font-mono text-[12.5px] leading-relaxed"
      >
        {lines.map((l, i) => (
          <div
            key={i}
            className={cn(
              'whitespace-pre',
              l.kind === 'add' && 'bg-[hsl(var(--diff-add)/0.12)] text-[hsl(var(--diff-add))]',
              l.kind === 'remove' && 'bg-[hsl(var(--diff-remove)/0.12)] text-[hsl(var(--diff-remove))]',
              l.kind === 'context' && 'text-dim',
            )}
          >
            {l.kind === 'add' ? '+ ' : l.kind === 'remove' ? '- ' : '  '}
            {l.text}
          </div>
        ))}
      </pre>
    </div>
  );
}
