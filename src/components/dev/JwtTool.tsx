import { useMemo, useState } from 'react';
import { CodeEditor } from './CodeEditor';
import type { DecodedJwt } from '../../services/dev/jwt';

export function JwtTool({ decode }: { decode: (token: string) => DecodedJwt }) {
  const [token, setToken] = useState('');
  const result = useMemo<{ data: DecodedJwt | null; error: string | null }>(() => {
    if (token.trim() === '') return { data: null, error: null };
    try {
      return { data: decode(token), error: null };
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : String(e) };
    }
  }, [token, decode]);

  const d = result.data;
  const pretty = (v: unknown) => (v === undefined ? '' : JSON.stringify(v, null, 2));

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[10px] uppercase tracking-widest text-dim/70">JWT token</span>
        <input
          aria-label="JWT token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="eyJhbGci…"
          spellCheck={false}
          className="h-11 w-full rounded-md border border-border bg-sunken px-3 font-mono text-[13px] text-text outline-none placeholder:text-dim"
        />
      </label>

      {result.error && (
        <p
          role="alert"
          className="rounded-md border border-border bg-sunken px-3 py-2 text-xs text-[hsl(var(--danger))]"
        >
          {result.error}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <CodeEditor label="Header" value={pretty(d?.header)} readOnly language="json" />
        <CodeEditor label="Payload" value={pretty(d?.payload)} readOnly language="json" />
      </div>
      <CodeEditor label="Signature" value={d?.signature ?? ''} readOnly className="min-h-[8vh]" />

      {d && d.claims.length > 0 && (
        <div className="flex flex-col gap-2">
          {d.claims.map((c) => (
            <div
              key={c.label}
              className="flex items-center justify-between rounded-md border border-border bg-sunken px-3 py-2"
            >
              <span className="font-mono text-[10px] uppercase tracking-widest text-dim/70">{c.label}</span>
              <span className="font-mono text-[13px] text-text">{c.value}</span>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-dim">Signature is not verified. This tool only decodes.</p>
    </div>
  );
}
