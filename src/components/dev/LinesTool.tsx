import { useMemo, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Segmented } from '../ui';
import { CodeEditor } from './CodeEditor';
import { processLines, type LineOptions } from '../../services/dev/lines';

const DEFAULTS: LineOptions = {
  sort: 'none', unique: false, trim: false, caseInsensitive: false, removeBlank: false, reverse: false,
};

const TOGGLES: { key: keyof LineOptions; label: string }[] = [
  { key: 'unique', label: 'Unique' },
  { key: 'trim', label: 'Trim' },
  { key: 'removeBlank', label: 'Remove blank lines' },
  { key: 'caseInsensitive', label: 'Ignore case' },
  { key: 'reverse', label: 'Reverse' },
];

export function LinesTool() {
  const [input, setInput] = useState('');
  const [opts, setOpts] = useState<LineOptions>(DEFAULTS);
  const [copied, setCopied] = useState(false);
  const output = useMemo(() => (input === '' ? '' : processLines(input, opts)), [input, opts]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output);
    } catch {
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented<LineOptions['sort']>
          aria-label="Sort order"
          options={[
            { value: 'none', label: 'Original' },
            { value: 'asc', label: 'A→Z' },
            { value: 'desc', label: 'Z→A' },
          ]}
          value={opts.sort}
          onChange={(v) => setOpts((o) => ({ ...o, sort: v }))}
        />
        {TOGGLES.map((t) => (
          <label key={t.key} className="flex items-center gap-1.5 text-xs text-dim">
            <input
              type="checkbox"
              aria-label={t.label}
              checked={opts[t.key] as boolean}
              onChange={(e) => setOpts((o) => ({ ...o, [t.key]: e.target.checked }))}
            />
            {t.label}
          </label>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CodeEditor label="Input" value={input} onChange={setInput} placeholder="one item per line" />
        <div className="flex flex-col gap-2">
          <button
            type="button"
            aria-label="Copy output"
            className="self-end text-dim hover:text-text"
            onClick={copy}
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          </button>
          <CodeEditor label="Output" value={output} readOnly />
        </div>
      </div>
    </div>
  );
}
