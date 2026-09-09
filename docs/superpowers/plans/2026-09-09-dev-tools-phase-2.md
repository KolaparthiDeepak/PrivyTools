# Developer Tools Suite — Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Prerequisite:** Phase 1 plan (`2026-09-09-dev-tools-phase-1.md`) is merged — `dev` category, `Tool.kind`, `CodeEditor`, `SplitTool`, `useDevTransform` all exist.

**Goal:** Add 7 developer tools that need non-split layouts: Slugify, Case Converter, Unix Timestamp, Cron Explainer (FieldTool); JWT Decoder (JwtTool); Text Diff (DiffTool); Sort/Dedupe Lines (LinesTool).

**Architecture:** Three new layout components (`FieldTool`, `JwtTool`, `DiffTool`, `LinesTool`) built on `CodeEditor` + `src/components/ui` primitives, each fed by pure functions in `src/services/dev/`. Same registry + router wiring as Phase 1.

**Tech Stack:** As Phase 1, plus `diff` (jsdiff), `cronstrue`, `cron-parser`.

## Global Constraints

- All constraints from the Phase 1 plan's Global Constraints section apply verbatim (on-device only, no CDN, throw-`Error`-with-message contract, deps via the route's lazy chunk, colours in `tokens.css`, strict TS, Geist Mono, textarea-fallback tests).
- **Timestamp tool must take an explicit `now` argument** in its pure function — no `Date.now()` inside testable logic. (spec §3.2)
- **JWT decoder does NOT verify signatures.** UI states this explicitly. (spec §3.3)

---

## File Structure

**Created:**
- `src/components/dev/FieldTool.tsx` + `.test.tsx` — input region → labelled result rows, each copyable
- `src/components/dev/JwtTool.tsx` + `.test.tsx` — token input → 3 read-only panes
- `src/components/dev/DiffTool.tsx` + `.test.tsx` — two inputs → diff view
- `src/components/dev/LinesTool.tsx` + `.test.tsx` — one editor + options bar
- `src/services/dev/slugify.ts`, `case-convert.ts`, `timestamp.ts`, `cron-explain.ts`, `jwt.ts`, `text-diff.ts`, `lines.ts` (+ `.test.ts` each)
- `src/routes/dev/Slugify.tsx`, `CaseConvert.tsx`, `Timestamp.tsx`, `Cron.tsx`, `Jwt.tsx`, `Diff.tsx`, `Lines.tsx`

**Modified:**
- `src/tools/registry.ts`, `src/tools/registry.test.ts`, `src/app/routes.tsx` — 7 entries + routes
- `src/a11y.test.tsx` — add one `dev` route assertion
- `package.json` — `diff`, `cronstrue`, `cron-parser`
- `README.md` — tool table

---

## Task 1: `FieldTool` layout component

**Files:**
- Create: `src/components/dev/FieldTool.tsx`, `src/components/dev/FieldTool.test.tsx`

**Interfaces:**
- Consumes: `useDevTransform` (Phase 1), `CodeEditor`, `Button` from `src/components/ui`.
- Produces:
  ```ts
  interface FieldRow { label: string; value: string }
  interface FieldToolProps {
    compute: (input: string) => FieldRow[];   // throws Error on bad input
    inputLabel: string;
    placeholder?: string;
    multiline?: boolean;                       // true → CodeEditor, false → <input>
  }
  function FieldTool(props: FieldToolProps): JSX.Element;
  ```
  - Runs `compute` via `useDevTransform`.
  - Renders each returned row as `label` + monospace `value` + a copy button.
  - Error → `role="alert"` banner; last good rows stay shown.

- [ ] **Step 1: Failing test** — `src/components/dev/FieldTool.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FieldTool } from './FieldTool';

const compute = (s: string) => {
  if (s === 'bad') throw new Error('no good');
  return [{ label: 'Upper', value: s.toUpperCase() }, { label: 'Length', value: String(s.length) }];
};

test('renders computed rows', async () => {
  render(<FieldTool compute={compute} inputLabel="Text" />);
  await userEvent.type(screen.getByLabelText('Text'), 'ab');
  expect(await screen.findByText('AB')).toBeInTheDocument();
  expect(screen.getByText('2')).toBeInTheDocument();
});

test('shows error, keeps prior rows', async () => {
  render(<FieldTool compute={compute} inputLabel="Text" />);
  const input = screen.getByLabelText('Text');
  await userEvent.type(input, 'ok');
  await screen.findByText('OK');
  await userEvent.clear(input);
  await userEvent.type(input, 'bad');
  expect(await screen.findByRole('alert')).toHaveTextContent('no good');
  expect(screen.getByText('OK')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run, verify fail.** `npm test -- src/components/dev/FieldTool.test.tsx`

- [ ] **Step 3: Implement** — `src/components/dev/FieldTool.tsx`:

```tsx
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
  const rows = output ?? [];

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
```

- [ ] **Step 4: Run, verify pass.**

- [ ] **Step 5: Commit**

```bash
git add src/components/dev/FieldTool.tsx src/components/dev/FieldTool.test.tsx
git commit -m "feat(dev): add FieldTool layout"
```

---

## Task 2: Slugify tool

**Files:** `src/services/dev/slugify.ts` + `.test.ts`, `src/routes/dev/Slugify.tsx`, registry, registry test, routes.

**Interfaces:**
```ts
export function slugify(input: string): string;   // "Héllo World!" → "hello-world"
```
Never throws (empty handled upstream). Diacritics stripped via `normalize('NFKD')`.

- [ ] **Step 1: Failing test** — `src/services/dev/slugify.test.ts`:

```ts
import { slugify } from './slugify';

test('lowercases, strips accents, hyphenates', () => {
  expect(slugify('Héllo, World!')).toBe('hello-world');
});
test('collapses separators and trims', () => {
  expect(slugify('  a __ b -- c  ')).toBe('a-b-c');
});
test('keeps numbers', () => {
  expect(slugify('Top 10 Tips')).toBe('top-10-tips');
});
```

- [ ] **Step 2: Run, verify fail.**

- [ ] **Step 3: Implement** — `src/services/dev/slugify.ts`:

```ts
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
```

- [ ] **Step 4: Run, verify pass.**

- [ ] **Step 5: Route** — `src/routes/dev/Slugify.tsx`:

```tsx
import { getTool } from '../../tools/registry';
import { ToolHeader } from '../../components/tool/ToolHeader';
import { FieldTool } from '../../components/dev/FieldTool';
import { slugify } from '../../services/dev/slugify';

const tool = getTool('dev-slug')!;

export default function Slugify() {
  return (
    <main role="main" className="mx-auto flex max-w-3xl flex-col gap-8 p-6 sm:p-10">
      <ToolHeader tool={tool} title="Slugify text." subtitle="URL-safe slugs: lowercase, no accents, hyphenated." />
      <FieldTool
        inputLabel="Text to slugify"
        placeholder="Hello, World!"
        compute={(s) => [{ label: 'Slug', value: slugify(s) }]}
      />
    </main>
  );
}
```

- [ ] **Step 6: Register + route** — `id: 'dev-slug'`, `name: 'Slugify'`, `description: 'Make URL-safe slugs from text'`, `route: '/dev/slug'`, `icon: Type`, `kind: 'text'`, `accept: []`. `exact tool set` += `'dev-slug'`. routes.tsx: `const DevSlugify = lazy(() => import('../routes/dev/Slugify'));` + `{ path: 'dev/slug', element: page(<DevSlugify />) },`

- [ ] **Step 7: Run** `npm test -- src/services/dev/slugify.test.ts src/tools/registry.test.ts src/app/routes.test.tsx` → PASS; `npm run typecheck` clean.

- [ ] **Step 8: Commit**

```bash
git add src/services/dev/slugify.ts src/services/dev/slugify.test.ts src/routes/dev/Slugify.tsx src/tools/registry.ts src/tools/registry.test.ts src/app/routes.tsx
git commit -m "feat(dev): add Slugify tool"
```

---

## Task 3: Case Converter tool

**Files:** `src/services/dev/case-convert.ts` + `.test.ts`, `src/routes/dev/CaseConvert.tsx`, registry, registry test, routes.

**Interfaces:**
```ts
export function convertCases(input: string): {
  camel: string; pascal: string; snake: string; kebab: string; constant: string; title: string; sentence: string;
};
```
Tokenises on non-alphanumerics and camelCase humps. Never throws.

- [ ] **Step 1: Failing test** — `src/services/dev/case-convert.test.ts`:

```ts
import { convertCases } from './case-convert';

test('converts from mixed input', () => {
  const r = convertCases('hello world-example_string');
  expect(r.camel).toBe('helloWorldExampleString');
  expect(r.pascal).toBe('HelloWorldExampleString');
  expect(r.snake).toBe('hello_world_example_string');
  expect(r.kebab).toBe('hello-world-example-string');
  expect(r.constant).toBe('HELLO_WORLD_EXAMPLE_STRING');
  expect(r.title).toBe('Hello World Example String');
});
test('splits camelCase humps', () => {
  expect(convertCases('getHTTPResponseCode').snake).toBe('get_http_response_code');
});
```

- [ ] **Step 2: Run, verify fail.**

- [ ] **Step 3: Implement** — `src/services/dev/case-convert.ts`:

```ts
function tokens(input: string): string[] {
  return input
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((t) => t.toLowerCase());
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function convertCases(input: string) {
  const t = tokens(input);
  return {
    camel: t.map((w, i) => (i ? cap(w) : w)).join(''),
    pascal: t.map(cap).join(''),
    snake: t.join('_'),
    kebab: t.join('-'),
    constant: t.join('_').toUpperCase(),
    title: t.map(cap).join(' '),
    sentence: t.length ? cap(t.join(' ')) : '',
  };
}
```

- [ ] **Step 4: Run, verify pass.**

- [ ] **Step 5: Route** — `src/routes/dev/CaseConvert.tsx`, `FieldTool` with:
```tsx
compute={(s) => {
  const r = convertCases(s);
  return [
    { label: 'camelCase', value: r.camel },
    { label: 'PascalCase', value: r.pascal },
    { label: 'snake_case', value: r.snake },
    { label: 'kebab-case', value: r.kebab },
    { label: 'CONSTANT_CASE', value: r.constant },
    { label: 'Title Case', value: r.title },
    { label: 'Sentence case', value: r.sentence },
  ];
}}
```
`inputLabel="Text to convert"`, `placeholder="helloWorld example"`. Title `"Convert text case."`.

- [ ] **Step 6: Register + route** — `id: 'dev-case'`, `name: 'Case Converter'`, `description: 'camelCase, snake_case, kebab-case and more'`, `route: '/dev/case'`, `icon: CaseSensitive`, `kind: 'text'`. `exact tool set` += id. routes.tsx lazy + `dev/case`.

- [ ] **Step 7: Run** relevant tests + typecheck.

- [ ] **Step 8: Commit**

```bash
git add src/services/dev/case-convert.ts src/services/dev/case-convert.test.ts src/routes/dev/CaseConvert.tsx src/tools/registry.ts src/tools/registry.test.ts src/app/routes.tsx
git commit -m "feat(dev): add Case Converter tool"
```

---

## Task 4: Unix Timestamp Converter tool

**Files:** `src/services/dev/timestamp.ts` + `.test.ts`, `src/routes/dev/Timestamp.tsx`, registry, registry test, routes.

**Interfaces:**
```ts
export interface TimestampInfo {
  unixSeconds: string; unixMillis: string; iso: string; utc: string; local: string; relative: string;
}
// `now` is injected for testability. Accepts: all-digits (s or ms epoch) OR any Date-parseable string.
export function describeTimestamp(input: string, now: Date): TimestampInfo;
```
Throws `Error('Not a recognisable date or timestamp')` if unparseable.

- [ ] **Step 1: Failing test** — `src/services/dev/timestamp.test.ts`:

```ts
import { describeTimestamp } from './timestamp';

const now = new Date('2026-01-01T00:00:00Z');

test('parses second epoch', () => {
  const r = describeTimestamp('1735689600', now);
  expect(r.iso).toBe('2025-01-01T00:00:00.000Z');
  expect(r.unixMillis).toBe('1735689600000');
});
test('parses millisecond epoch', () => {
  expect(describeTimestamp('1735689600000', now).unixSeconds).toBe('1735689600');
});
test('parses ISO string', () => {
  expect(describeTimestamp('2026-01-01T00:00:00Z', now).unixSeconds).toBe('1767225600');
});
test('relative for one hour ago', () => {
  expect(describeTimestamp('2025-12-31T23:00:00Z', now).relative).toMatch(/hour/);
});
test('throws on garbage', () => {
  expect(() => describeTimestamp('not a date', now)).toThrow(/recognisable/);
});
```

- [ ] **Step 2: Run, verify fail.**

- [ ] **Step 3: Implement** — `src/services/dev/timestamp.ts`:

```ts
export interface TimestampInfo {
  unixSeconds: string; unixMillis: string; iso: string; utc: string; local: string; relative: string;
}

function relative(from: Date, to: Date): string {
  const secs = Math.round((from.getTime() - to.getTime()) / 1000);
  const abs = Math.abs(secs);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536000], ['month', 2592000], ['day', 86400],
    ['hour', 3600], ['minute', 60], ['second', 1],
  ];
  for (const [unit, size] of units) {
    if (abs >= size || unit === 'second') return rtf.format(Math.round(secs / size), unit);
  }
  return 'now';
}

export function describeTimestamp(input: string, now: Date): TimestampInfo {
  const trimmed = input.trim();
  let date: Date;
  if (/^-?\d+$/.test(trimmed)) {
    const n = Number(trimmed);
    date = new Date(trimmed.length > 11 ? n : n * 1000);
  } else {
    date = new Date(trimmed);
  }
  if (Number.isNaN(date.getTime())) {
    throw new Error('Not a recognisable date or timestamp');
  }
  return {
    unixSeconds: String(Math.floor(date.getTime() / 1000)),
    unixMillis: String(date.getTime()),
    iso: date.toISOString(),
    utc: date.toUTCString(),
    local: date.toString(),
    relative: relative(date, now),
  };
}
```

- [ ] **Step 4: Run, verify pass.** (Adjust `local` expectations out of tests — it is TZ-dependent; the test above does not assert on it.)

- [ ] **Step 5: Route** — `src/routes/dev/Timestamp.tsx`. Because `describeTimestamp` needs `now`, wrap it in the route:

```tsx
import { getTool } from '../../tools/registry';
import { ToolHeader } from '../../components/tool/ToolHeader';
import { FieldTool } from '../../components/dev/FieldTool';
import { describeTimestamp } from '../../services/dev/timestamp';

const tool = getTool('dev-timestamp')!;

export default function Timestamp() {
  return (
    <main role="main" className="mx-auto flex max-w-3xl flex-col gap-8 p-6 sm:p-10">
      <ToolHeader tool={tool} title="Convert Unix timestamps." subtitle="Epoch seconds or millis, or any date string." />
      <FieldTool
        inputLabel="Timestamp or date"
        placeholder="1735689600 or 2026-01-01"
        compute={(s) => {
          const r = describeTimestamp(s, new Date());
          return [
            { label: 'Unix (s)', value: r.unixSeconds },
            { label: 'Unix (ms)', value: r.unixMillis },
            { label: 'ISO 8601', value: r.iso },
            { label: 'UTC', value: r.utc },
            { label: 'Local', value: r.local },
            { label: 'Relative', value: r.relative },
          ];
        }}
      />
    </main>
  );
}
```

- [ ] **Step 6: Register + route** — `id: 'dev-timestamp'`, `name: 'Timestamp Converter'`, `description: 'Unix epoch to human dates and back'`, `route: '/dev/timestamp'`, `icon: Clock`, `kind: 'text'`. `exact tool set` += id. routes.tsx lazy + `dev/timestamp`.

- [ ] **Step 7: Run** relevant tests + typecheck.

- [ ] **Step 8: Commit**

```bash
git add src/services/dev/timestamp.ts src/services/dev/timestamp.test.ts src/routes/dev/Timestamp.tsx src/tools/registry.ts src/tools/registry.test.ts src/app/routes.tsx
git commit -m "feat(dev): add Unix Timestamp Converter tool"
```

---

## Task 5: Cron Explainer tool

**Files:** `src/services/dev/cron-explain.ts` + `.test.ts`, `src/routes/dev/Cron.tsx`, registry, registry test, routes, `package.json`.

**Interfaces:**
```ts
export interface CronInfo { description: string; nextRuns: string[] }   // nextRuns: 5 ISO strings, UTC
export function explainCron(input: string, from: Date): CronInfo;
```
Throws `Error(<parser message>)` on an invalid expression.

- [ ] **Step 1: Install deps**

```bash
npm install cronstrue@^2 cron-parser@^4
```

- [ ] **Step 2: Failing test** — `src/services/dev/cron-explain.test.ts`:

```ts
import { explainCron } from './cron-explain';

const from = new Date('2026-01-01T00:00:00Z');

test('describes a simple expression', () => {
  expect(explainCron('*/5 * * * *', from).description.toLowerCase()).toContain('every 5 minutes');
});
test('lists 5 upcoming runs', () => {
  const r = explainCron('0 0 * * *', from);
  expect(r.nextRuns).toHaveLength(5);
  expect(r.nextRuns[0]).toBe('2026-01-02T00:00:00.000Z');
});
test('throws on invalid', () => {
  expect(() => explainCron('not valid', from)).toThrow();
});
```

- [ ] **Step 3: Run, verify fail.**

- [ ] **Step 4: Implement** — `src/services/dev/cron-explain.ts`:

```ts
import cronstrue from 'cronstrue';
import parser from 'cron-parser';

export interface CronInfo { description: string; nextRuns: string[] }

export function explainCron(input: string, from: Date): CronInfo {
  const expr = input.trim();
  let description: string;
  try {
    description = cronstrue.toString(expr, { throwExceptionOnParseError: true });
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : 'Invalid cron expression');
  }
  const it = parser.parseExpression(expr, { currentDate: from, utc: true });
  const nextRuns: string[] = [];
  for (let i = 0; i < 5; i++) nextRuns.push(it.next().toDate().toISOString());
  return { description, nextRuns };
}
```

> If `cron-parser` v5 is installed instead of v4, the import is `import { CronExpressionParser } from 'cron-parser';` and the call is `CronExpressionParser.parse(expr, { currentDate: from, tz: 'UTC' })`. Pin v4 in Step 1 to match the code above.

- [ ] **Step 5: Run, verify pass.**

- [ ] **Step 6: Route** — `src/routes/dev/Cron.tsx`, `FieldTool`:

```tsx
compute={(s) => {
  const r = explainCron(s, new Date());
  return [
    { label: 'Means', value: r.description },
    ...r.nextRuns.map((run, i) => ({ label: `Next ${i + 1}`, value: run })),
  ];
}}
```
`inputLabel="Cron expression"`, `placeholder="*/5 * * * *"`. Title `"Explain cron expressions."` subtitle `"Plain English plus the next five runs (UTC)."`.

- [ ] **Step 7: Register + route** — `id: 'dev-cron'`, `name: 'Cron Explainer'`, `description: 'Read a cron expression in plain English'`, `route: '/dev/cron'`, `icon: CalendarClock`, `kind: 'text'`. `exact tool set` += id. routes.tsx lazy + `dev/cron`.

- [ ] **Step 8: Run** relevant tests + typecheck.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json src/services/dev/cron-explain.ts src/services/dev/cron-explain.test.ts src/routes/dev/Cron.tsx src/tools/registry.ts src/tools/registry.test.ts src/app/routes.tsx
git commit -m "feat(dev): add Cron Explainer tool"
```

---

## Task 6: JWT Decoder (service + `JwtTool` layout)

**Files:**
- Create: `src/services/dev/jwt.ts` + `.test.ts`
- Create: `src/components/dev/JwtTool.tsx` + `.test.tsx`
- Create: `src/routes/dev/Jwt.tsx`
- Modify: registry, registry test, routes

**Interfaces:**
- Produces:
  ```ts
  export interface DecodedJwt {
    header: unknown;
    payload: unknown;
    signature: string;      // raw base64url segment, not verified
    claims: { label: string; value: string }[];   // human-decoded exp/iat/nbf if present
  }
  export function decodeJwt(token: string): DecodedJwt;
  ```
  Throws:
  - `Error('Not a JWT (expected 3 dot-separated parts)')` if `split('.').length !== 3`
  - `Error('JWT header is not valid Base64URL JSON')` / `'JWT payload is not valid Base64URL JSON'`
- `JwtTool`:
  ```ts
  function JwtTool(props: { decode: (token: string) => DecodedJwt }): JSX.Element;
  ```
  Token `<input>` at top → three read-only `CodeEditor`s (Header, Payload, Signature, JSON-pretty for the first two) → claims rows below the payload → a static "Signature is not verified." note. Error → `role="alert"`.

- [ ] **Step 1: Failing test (service)** — `src/services/dev/jwt.test.ts`:

```ts
import { decodeJwt } from './jwt';

// header {"alg":"HS256","typ":"JWT"}  payload {"sub":"123","name":"Ada","iat":1700000000}
const TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiQWRhIiwiaWF0IjoxNzAwMDAwMDAwfQ.abc123';

test('decodes header and payload', () => {
  const d = decodeJwt(TOKEN);
  expect(d.header).toEqual({ alg: 'HS256', typ: 'JWT' });
  expect(d.payload).toEqual({ sub: '123', name: 'Ada', iat: 1700000000 });
  expect(d.signature).toBe('abc123');
});
test('humanises iat claim', () => {
  expect(decodeJwt(TOKEN).claims.find((c) => c.label === 'Issued at')?.value).toContain('2023');
});
test('rejects non-JWT', () => {
  expect(() => decodeJwt('a.b')).toThrow(/expected 3/);
});
test('rejects bad base64 json', () => {
  expect(() => decodeJwt('!!!.!!!.sig')).toThrow(/Base64URL JSON/);
});
```

- [ ] **Step 2: Run, verify fail.**

- [ ] **Step 3: Implement** — `src/services/dev/jwt.ts`:

```ts
export interface DecodedJwt {
  header: unknown;
  payload: unknown;
  signature: string;
  claims: { label: string; value: string }[];
}

function b64urlToJson(seg: string, which: string): unknown {
  try {
    const b64 = seg.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(seg.length / 4) * 4, '=');
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))));
  } catch {
    throw new Error(`JWT ${which} is not valid Base64URL JSON`);
  }
}

const CLAIM_LABELS: Record<string, string> = { exp: 'Expires', iat: 'Issued at', nbf: 'Not before' };

export function decodeJwt(token: string): DecodedJwt {
  const parts = token.trim().split('.');
  if (parts.length !== 3) throw new Error('Not a JWT (expected 3 dot-separated parts)');
  const header = b64urlToJson(parts[0], 'header');
  const payload = b64urlToJson(parts[1], 'payload');

  const claims: { label: string; value: string }[] = [];
  if (payload && typeof payload === 'object') {
    for (const [key, label] of Object.entries(CLAIM_LABELS)) {
      const v = (payload as Record<string, unknown>)[key];
      if (typeof v === 'number') claims.push({ label, value: new Date(v * 1000).toISOString() });
    }
  }
  return { header, payload, signature: parts[2], claims };
}
```

- [ ] **Step 4: Run, verify pass.**

- [ ] **Step 5: Failing test (layout)** — `src/components/dev/JwtTool.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JwtTool } from './JwtTool';
import { decodeJwt } from '../../services/dev/jwt';

const TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiQWRhIiwiaWF0IjoxNzAwMDAwMDAwfQ.abc123';

test('fills the three panes from a token', async () => {
  render(<JwtTool decode={decodeJwt} />);
  await userEvent.type(screen.getByLabelText(/token/i), TOKEN);
  expect(await screen.findByLabelText(/header/i)).toHaveValue(expect.stringContaining('"alg": "HS256"'));
  expect(screen.getByLabelText(/payload/i)).toHaveValue(expect.stringContaining('"name": "Ada"'));
  expect(screen.getByLabelText(/signature/i)).toHaveValue('abc123');
});

test('shows an error for a bad token', async () => {
  render(<JwtTool decode={decodeJwt} />);
  await userEvent.type(screen.getByLabelText(/token/i), 'a.b');
  expect(await screen.findByRole('alert')).toHaveTextContent(/expected 3/);
});
```

> `toHaveValue(expect.stringContaining(...))` is not supported; instead assert with `expect(screen.getByLabelText(/header/i)).toHaveValue(JSON.stringify({ alg: 'HS256', typ: 'JWT' }, null, 2))`. Use exact expected strings in the real test.

- [ ] **Step 6: Run, verify fail.**

- [ ] **Step 7: Implement** — `src/components/dev/JwtTool.tsx`:

```tsx
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
        <p role="alert" className="rounded-md border border-border bg-sunken px-3 py-2 text-xs text-[hsl(var(--danger))]">
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
            <div key={c.label} className="flex items-center justify-between rounded-md border border-border bg-sunken px-3 py-2">
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
```

> `CodeEditor` currently has a fixed `min-h-[40vh]`; add a `className` merge (already in props) and for `Signature` a shorter min-height. If `CodeEditor`'s root `min-h` can't be overridden by the passed `className` due to class order, change its root to `min-h-[40vh]` → keep, and rely on `cn()` last-wins (tailwind-merge is already a dep — `cn` uses it). Verify in `src/lib/cn.ts`.

- [ ] **Step 8: Run, verify pass (both test files).**

- [ ] **Step 9: Route** — `src/routes/dev/Jwt.tsx`:

```tsx
import { getTool } from '../../tools/registry';
import { ToolHeader } from '../../components/tool/ToolHeader';
import { JwtTool } from '../../components/dev/JwtTool';
import { decodeJwt } from '../../services/dev/jwt';

const tool = getTool('dev-jwt')!;

export default function Jwt() {
  return (
    <main role="main" className="mx-auto flex max-w-5xl flex-col gap-8 p-6 sm:p-10">
      <ToolHeader tool={tool} title="Decode a JWT." subtitle="Header, payload, and claims. Nothing leaves your device; the signature is not checked." />
      <JwtTool decode={decodeJwt} />
    </main>
  );
}
```

- [ ] **Step 10: Register + route** — `id: 'dev-jwt'`, `name: 'JWT Decoder'`, `description: 'Inspect a JWT without verifying it'`, `route: '/dev/jwt'`, `icon: KeyRound`, `kind: 'text'`. `exact tool set` += id. routes.tsx lazy + `dev/jwt`.

- [ ] **Step 11: Run** `npm test -- src/services/dev/jwt.test.ts src/components/dev/JwtTool.test.tsx src/tools/registry.test.ts src/app/routes.test.tsx` → PASS; `npm run typecheck` clean.

- [ ] **Step 12: Commit**

```bash
git add src/services/dev/jwt.ts src/services/dev/jwt.test.ts src/components/dev/JwtTool.tsx src/components/dev/JwtTool.test.tsx src/routes/dev/Jwt.tsx src/tools/registry.ts src/tools/registry.test.ts src/app/routes.tsx
git commit -m "feat(dev): add JWT Decoder tool"
```

---

## Task 7: Text Diff (service + `DiffTool` layout)

**Files:**
- Create: `src/services/dev/text-diff.ts` + `.test.ts`
- Create: `src/components/dev/DiffTool.tsx` + `.test.tsx`
- Create: `src/routes/dev/Diff.tsx`
- Modify: registry, registry test, routes, `package.json`

**Interfaces:**
- Produces:
  ```ts
  export interface DiffLine { kind: 'add' | 'remove' | 'context'; text: string }
  export function diffText(a: string, b: string): DiffLine[];
  ```
  Never throws.
- `DiffTool`:
  ```ts
  function DiffTool(props: { diff: (a: string, b: string) => DiffLine[] }): JSX.Element;
  ```
  Two input `CodeEditor`s (Original / Changed) side by side → a diff panel below; add lines tinted with `--accent-privacy` hue-ish green token, remove lines red. A summary line "`+N −M`".

- [ ] **Step 1: Install diff**

```bash
npm install diff@^5 && npm install -D @types/diff@^5
```

- [ ] **Step 2: Failing test (service)** — `src/services/dev/text-diff.test.ts`:

```ts
import { diffText } from './text-diff';

test('marks added and removed lines', () => {
  const lines = diffText('a\nb\nc\n', 'a\nB\nc\n');
  const kinds = lines.map((l) => `${l.kind}:${l.text}`);
  expect(kinds).toContain('remove:b');
  expect(kinds).toContain('add:B');
  expect(kinds).toContain('context:a');
});
test('identical input is all context', () => {
  expect(diffText('x\ny\n', 'x\ny\n').every((l) => l.kind === 'context')).toBe(true);
});
```

- [ ] **Step 3: Run, verify fail.**

- [ ] **Step 4: Implement** — `src/services/dev/text-diff.ts`:

```ts
import { diffLines } from 'diff';

export interface DiffLine { kind: 'add' | 'remove' | 'context'; text: string }

export function diffText(a: string, b: string): DiffLine[] {
  const out: DiffLine[] = [];
  for (const part of diffLines(a, b)) {
    const kind: DiffLine['kind'] = part.added ? 'add' : part.removed ? 'remove' : 'context';
    for (const line of part.value.replace(/\n$/, '').split('\n')) {
      out.push({ kind, text: line });
    }
  }
  return out;
}
```

- [ ] **Step 5: Run, verify pass.**

- [ ] **Step 6: Failing test (layout)** — `src/components/dev/DiffTool.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DiffTool } from './DiffTool';
import { diffText } from '../../services/dev/text-diff';

test('shows a changed line in the diff panel', async () => {
  render(<DiffTool diff={diffText} />);
  await userEvent.type(screen.getByLabelText(/original/i), 'hello');
  await userEvent.type(screen.getByLabelText(/changed/i), 'world');
  const panel = await screen.findByTestId('diff-output');
  expect(panel).toHaveTextContent('hello');
  expect(panel).toHaveTextContent('world');
});
```

- [ ] **Step 7: Run, verify fail.**

- [ ] **Step 8: Implement** — `src/components/dev/DiffTool.tsx`:

```tsx
import { useMemo, useState } from 'react';
import { CodeEditor } from './CodeEditor';
import type { DiffLine } from '../../services/dev/text-diff';
import { cn } from '../../lib/cn';

export function DiffTool({ diff }: { diff: (a: string, b: string) => DiffLine[] }) {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const lines = useMemo(() => (a === '' && b === '' ? [] : diff(a, b)), [a, b, diff]);
  const added = lines.filter((l) => l.kind === 'add').length;
  const removed = lines.filter((l) => l.kind === 'remove').length;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <CodeEditor label="Original" value={a} onChange={setA} placeholder="paste the original" />
        <CodeEditor label="Changed" value={b} onChange={setB} placeholder="paste the changed version" />
      </div>
      <div className="flex items-center gap-3 font-mono text-[11px] text-dim">
        <span className="text-[hsl(150_45%_40%)]">+{added}</span>
        <span className="text-[hsl(var(--danger))]">−{removed}</span>
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
              l.kind === 'add' && 'bg-[hsl(150_45%_40%/0.12)] text-[hsl(150_45%_35%)]',
              l.kind === 'remove' && 'bg-[hsl(0_60%_50%/0.12)] text-[hsl(0_60%_45%)]',
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
```

> The inline `hsl(...)` colour literals here violate the "colours in tokens.css" constraint. Before committing, add `--diff-add` / `--diff-remove` (fg + bg) tokens to `tokens.css` (light + dark) and reference them via `text-[hsl(var(--diff-add))]` etc., matching how the codebase does accent colours. Keep the diff readable in both themes.

- [ ] **Step 9: Run, verify pass.**

- [ ] **Step 10: Route** — `src/routes/dev/Diff.tsx`, `DiffTool diff={diffText}`, title `"Compare two texts."` subtitle `"Line-by-line diff, entirely in the browser."` max-width `max-w-5xl`.

- [ ] **Step 11: Register + route** — `id: 'dev-diff'`, `name: 'Text Diff'`, `description: 'Line-by-line comparison of two texts'`, `route: '/dev/diff'`, `icon: GitCompareArrows`, `kind: 'text'`. `exact tool set` += id. routes.tsx lazy + `dev/diff`.

- [ ] **Step 12: Run** all touched test files + typecheck.

- [ ] **Step 13: Commit**

```bash
git add package.json package-lock.json src/services/dev/text-diff.ts src/services/dev/text-diff.test.ts src/components/dev/DiffTool.tsx src/components/dev/DiffTool.test.tsx src/routes/dev/Diff.tsx src/design/tokens.css src/tools/registry.ts src/tools/registry.test.ts src/app/routes.tsx
git commit -m "feat(dev): add Text Diff tool"
```

---

## Task 8: Sort / Dedupe Lines (service + `LinesTool` layout)

**Files:**
- Create: `src/services/dev/lines.ts` + `.test.ts`
- Create: `src/components/dev/LinesTool.tsx` + `.test.tsx`
- Create: `src/routes/dev/Lines.tsx`
- Modify: registry, registry test, routes

**Interfaces:**
- Produces:
  ```ts
  export interface LineOptions {
    sort: 'none' | 'asc' | 'desc';
    unique: boolean;
    trim: boolean;
    caseInsensitive: boolean;
    removeBlank: boolean;
    reverse: boolean;
  }
  export function processLines(input: string, opts: LineOptions): string;
  ```
  Never throws. Order of ops: trim → removeBlank → unique → sort → reverse.
- `LinesTool`:
  ```ts
  function LinesTool(): JSX.Element;
  ```
  One input `CodeEditor` + an options bar (`Segmented` for sort, checkboxes for the booleans) → output `CodeEditor` (read-only) + Copy. Live.

- [ ] **Step 1: Failing test (service)** — `src/services/dev/lines.test.ts`:

```ts
import { processLines, type LineOptions } from './lines';

const base: LineOptions = { sort: 'none', unique: false, trim: false, caseInsensitive: false, removeBlank: false, reverse: false };

test('sorts ascending', () => {
  expect(processLines('b\na\nc', { ...base, sort: 'asc' })).toBe('a\nb\nc');
});
test('dedupes preserving first occurrence', () => {
  expect(processLines('a\nb\na', { ...base, unique: true })).toBe('a\nb');
});
test('case-insensitive unique', () => {
  expect(processLines('a\nA', { ...base, unique: true, caseInsensitive: true })).toBe('a');
});
test('removeBlank and trim', () => {
  expect(processLines('  a  \n\n b ', { ...base, trim: true, removeBlank: true })).toBe('a\nb');
});
test('reverse', () => {
  expect(processLines('a\nb\nc', { ...base, reverse: true })).toBe('c\nb\na');
});
```

- [ ] **Step 2: Run, verify fail.**

- [ ] **Step 3: Implement** — `src/services/dev/lines.ts`:

```ts
export interface LineOptions {
  sort: 'none' | 'asc' | 'desc';
  unique: boolean;
  trim: boolean;
  caseInsensitive: boolean;
  removeBlank: boolean;
  reverse: boolean;
}

export function processLines(input: string, opts: LineOptions): string {
  let lines = input.split('\n');
  if (opts.trim) lines = lines.map((l) => l.trim());
  if (opts.removeBlank) lines = lines.filter((l) => l !== '');

  if (opts.unique) {
    const seen = new Set<string>();
    lines = lines.filter((l) => {
      const key = opts.caseInsensitive ? l.toLowerCase() : l;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  if (opts.sort !== 'none') {
    const cmp = (a: string, b: string) => {
      const x = opts.caseInsensitive ? a.toLowerCase() : a;
      const y = opts.caseInsensitive ? b.toLowerCase() : b;
      return x < y ? -1 : x > y ? 1 : 0;
    };
    lines.sort(opts.sort === 'asc' ? cmp : (a, b) => cmp(b, a));
  }

  if (opts.reverse) lines.reverse();
  return lines.join('\n');
}
```

- [ ] **Step 4: Run, verify pass.**

- [ ] **Step 5: Failing test (layout)** — `src/components/dev/LinesTool.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LinesTool } from './LinesTool';

test('applies sort option live', async () => {
  render(<LinesTool />);
  await userEvent.type(screen.getByLabelText(/input/i), 'c\na\nb');
  await userEvent.click(screen.getByRole('button', { name: /^A→Z$/i }));
  expect(await screen.findByLabelText(/output/i)).toHaveValue('a\nb\nc');
});

test('unique checkbox dedupes', async () => {
  render(<LinesTool />);
  await userEvent.type(screen.getByLabelText(/input/i), 'a\na\nb');
  await userEvent.click(screen.getByRole('checkbox', { name: /unique/i }));
  expect(await screen.findByLabelText(/output/i)).toHaveValue('a\nb');
});
```

- [ ] **Step 6: Run, verify fail.**

- [ ] **Step 7: Implement** — `src/components/dev/LinesTool.tsx`:

```tsx
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          options={[
            { value: 'none', label: 'Original' },
            { value: 'asc', label: 'A→Z' },
            { value: 'desc', label: 'Z→A' },
          ]}
          value={opts.sort}
          onChange={(v) => setOpts((o) => ({ ...o, sort: v as LineOptions['sort'] }))}
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
            onClick={async () => {
              await navigator.clipboard.writeText(output);
              setCopied(true);
              setTimeout(() => setCopied(false), 1400);
            }}
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          </button>
          <CodeEditor label="Output" value={output} readOnly />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Run, verify pass.** (Adapt `Segmented` call to its real prop shape.)

- [ ] **Step 9: Route** — `src/routes/dev/Lines.tsx`, renders `<LinesTool />`, title `"Sort and dedupe lines."` subtitle `"Sort, unique, trim, filter — live."` max-width `max-w-5xl`.

- [ ] **Step 10: Register + route** — `id: 'dev-lines'`, `name: 'Sort / Dedupe Lines'`, `description: 'Sort, dedupe, and clean up a list'`, `route: '/dev/lines'`, `icon: ArrowDownUp`, `kind: 'text'`. `exact tool set` += id. routes.tsx lazy + `dev/lines`.

- [ ] **Step 11: Run** all touched test files + typecheck.

- [ ] **Step 12: Commit**

```bash
git add src/services/dev/lines.ts src/services/dev/lines.test.ts src/components/dev/LinesTool.tsx src/components/dev/LinesTool.test.tsx src/routes/dev/Lines.tsx src/tools/registry.ts src/tools/registry.test.ts src/app/routes.tsx
git commit -m "feat(dev): add Sort / Dedupe Lines tool"
```

---

## Task 9: Phase 2 checkpoint + a11y + README

**Files:**
- Modify: `src/a11y.test.tsx`
- Modify: `README.md`
- Verify: full suite

**Interfaces:**
- Consumes: all Phase 2 routes registered.

- [ ] **Step 1: Extend the a11y test**

`src/a11y.test.tsx` — add:

```tsx
test('a dev tool route has one h1, a main, and named buttons', async () => {
  render(<RouterProvider router={makeTestRouter(['/dev/case'])} />);
  await screen.findByRole('main');
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  for (const b of screen.getAllByRole('button')) {
    expect(b).toHaveAccessibleName();
  }
});
```

- [ ] **Step 2: Run it**

Run: `npm test -- src/a11y.test.tsx`
Expected: PASS. If a `FieldTool` copy button lacks a name, fix the `aria-label` (it is `Copy ${row.label}` — should already pass).

- [ ] **Step 3: Full checkpoint**

```bash
npm run typecheck
npm run lint
npm test
npm run build
```
All clean. In the build output confirm each `dev/*` route is its own chunk and `diff` / `cronstrue` / `cron-parser` are only in the diff/cron chunks.

- [ ] **Step 4: Update README**

`README.md` — add the 7 Phase 2 tools to the tool table (route + engine note). Update the intro line's tool count if it names one.

- [ ] **Step 5: Commit**

```bash
git add src/a11y.test.tsx README.md
git commit -m "test(dev): a11y coverage for a dev route; docs: list Phase 2 tools"
```

- [ ] **Step 6: Final registry sanity test**

Add to `src/tools/registry.test.ts`:

```ts
test('all dev tools are text kind, live, local, and route under /dev', () => {
  const dev = TOOLS.filter((t) => t.category === 'dev');
  expect(dev.length).toBe(15);
  for (const t of dev) {
    expect(t.kind).toBe('text');
    expect(t.status).toBe('live');
    expect(t.processing).toBe('local');
    expect(t.route.startsWith('/dev/')).toBe(true);
  }
});
```

Run: `npm test -- src/tools/registry.test.ts` → PASS. Commit:

```bash
git add src/tools/registry.test.ts
git commit -m "test(dev): assert the full 15-tool dev suite invariants"
```

---

## Self-Review

**Spec coverage:**
- §2 Phase 2 tools (7): JWT → Task 6, Diff → Task 7, Timestamp → Task 4, Cron → Task 5, Case → Task 3, Lines → Task 8, Slugify → Task 2. ✓
- §3.3 `JwtTool` → Task 6, `DiffTool` → Task 7, `FieldTool` → Task 1, `LinesTool` → Task 8. ✓
- §3.2 pure functions, `now`/`from` injection for timestamp & cron → Tasks 4, 5. ✓
- §3.3 "signature not verified" note → Task 6 Step 7 (`<p>` note) + Step 1 tests decode only. ✓
- §5 error handling: every service throws; `FieldTool`/`JwtTool`/`DiffTool` render `role="alert"`; `LinesTool` service never throws so no banner needed. ✓
- §6 testing: service tests, layout tests, a11y extension (Task 9), route smoke via `routes.test.tsx` `TOOLS` loop, registry invariants (Task 9 Step 6). ✓
- §7 deps: `diff` (Task 7), `cronstrue` + `cron-parser` (Task 5). ✓

**Placeholder scan:** Route components for Slug/Case/Timestamp/Cron give the full `compute` prop literal and header text; JWT/Diff/Lines routes are 10-line wrappers shown in full. No bare "same as Task N".

**Type consistency:** `FieldRow`/`FieldToolProps`, `DecodedJwt`, `DiffLine`, `LineOptions` each defined once in their service/component and imported everywhere else. `explainCron(input, from)` and `describeTimestamp(input, now)` signatures match their route call sites. `Segmented` prop adaptation flagged in Tasks 8 & 1.

**Cross-plan consistency:** `exact tool set` in `registry.test.ts` grows by one id per tool task across both plans; Task 9 Step 6 replaces ad-hoc list checks with the `dev.length === 15` assertion once all are in.

**Constraint watch:** inline `hsl(...)` literals in `DiffTool` (Task 7 Step 8) and the error-banner red (`text-[hsl(var(--danger))]`) used across Phase 1 & 2 violate "colours in tokens.css". Task 7 Step 8 note requires adding `--diff-add`/`--diff-remove` tokens; **additionally** add a `--danger` token in the Phase 1 work or the first Phase 2 task and replace the banner literal. If not done in Phase 1, do it in Task 1 here.
