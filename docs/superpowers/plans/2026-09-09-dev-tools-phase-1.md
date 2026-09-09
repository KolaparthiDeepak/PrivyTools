# Developer Tools Suite — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `dev` tool category to PrivyTools with 8 split-editor text converters (JSON⇄YAML, JSON format, JSON⇄CSV, JSON→TS, Base64, URL, HTML entities, query-string⇄JSON), all on-device.

**Architecture:** Pure transform functions in `src/services/dev/*.ts` (no React/DOM), a lazy-loaded CodeMirror 6 `CodeEditor`, a `SplitTool` layout component driven by a `useDevTransform` debounce+try/catch hook, and thin route components registered in the existing registry + router. Heavy deps are dynamically imported inside their transform module so they land in the route chunk, not the app bundle.

**Tech Stack:** Vite, React 19, TypeScript (strict), React Router 7, Tailwind v4, Vitest + Testing Library, CodeMirror 6, js-yaml, papaparse.

## Global Constraints

- **On-device only.** No network calls, no analytics, no uploads, no CDN. Every transform runs in the browser. (spec §1)
- **No file bytes or input text in `localStorage`.** Shell already stores only favourites, recents, theme, telemetry toggle, sidebar state. (spec §4)
- **Registry-driven.** A new tool = one `registry.ts` entry + one lazy route in `src/app/routes.tsx`. (spec §1)
- **Every `services/dev` function throws `Error` with a concise human message on bad input.** Layouts render it in a banner, never a toast, never swallowed. (spec §5)
- **Heavy deps (`js-yaml`, `papaparse`) imported via dynamic `import()` inside the transform module.** (spec §3.2, §7)
- **All colour literals live in `src/design/tokens.css`.** No hard-coded colours in components. (tokens.css header)
- **TypeScript strict, `noUnusedLocals`, `noUnusedParameters`.** `npm run typecheck` must stay clean.
- **Editor font is Geist Mono** (already self-hosted via `@fontsource/geist-mono`). No new fonts.
- **Test env:** Vitest + jsdom. CodeMirror is browser-only; the `CodeEditor` fallback `<textarea>` is what tests interact with.

---

## File Structure

**Created:**
- `src/services/dev/json-format.ts` — pretty / minify / validate JSON
- `src/services/dev/json-yaml.ts` — `jsonToYaml`, `yamlToJson`
- `src/services/dev/base64.ts` — text + byte Base64
- `src/services/dev/url-encode.ts` — `encodeUrl`, `decodeUrl`
- `src/services/dev/html-entities.ts` — `encodeEntities`, `decodeEntities`
- `src/services/dev/query-json.ts` — `queryToJson`, `jsonToQuery`
- `src/services/dev/json-csv.ts` — `jsonToCsv`, `csvToJson`
- `src/services/dev/json-ts.ts` — `jsonToTs`
- `src/services/dev/*.test.ts` — one beside each service
- `src/hooks/useDevTransform.ts` + `.test.tsx`
- `src/components/dev/CodeEditor.tsx` + `.test.tsx`
- `src/components/dev/cmSetup.ts` — CodeMirror 6 factory (dynamically imported)
- `src/components/dev/SplitTool.tsx` + `.test.tsx`
- `src/routes/dev/JsonFormat.tsx`, `JsonYaml.tsx`, `Base64.tsx`, `UrlEncode.tsx`, `HtmlEntities.tsx`, `QueryJson.tsx`, `JsonCsv.tsx`, `JsonTs.tsx`

**Modified:**
- `src/tools/categories.ts` — add `dev` category
- `src/design/tokens.css` — add `--accent-dev` (light + dark) and `[data-accent='dev']`
- `src/tools/registry.ts` — add `kind` field, 8 tool entries
- `src/tools/registry.test.ts` — update `exact tool set` + `accept` invariant tests
- `src/app/routes.tsx` — 8 lazy routes
- `src/app/Sidebar.tsx` — `Developer` nav section
- `src/app/CommandPalette.tsx` — `dev` in `GROUP_ORDER`
- `package.json` — add deps (done inside the tasks that first need them)

---

## Task 1: `dev` category, accent token, registry `kind` field

**Files:**
- Modify: `src/tools/categories.ts`
- Modify: `src/design/tokens.css`
- Modify: `src/tools/registry.ts:9-19` (the `Tool` interface)
- Modify: `src/tools/registry.test.ts`
- Test: `src/tools/registry.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `Category` union now includes `'dev'`.
  - `CATEGORIES.dev = { label: 'Developer', accent: 'dev' }`.
  - `Tool` gains `kind?: 'file' | 'text'` (absent ⇒ `'file'`).

- [ ] **Step 1: Update the failing test first**

In `src/tools/registry.test.ts`, replace the `non-privacy tools declare accept types` test and the `exact tool set` test with:

```ts
test('file tools declare accept types', () => {
  TOOLS.filter((t) => (t.kind ?? 'file') === 'file' && t.id !== 'privacy-center').forEach((t) =>
    expect(t.accept.length).toBeGreaterThan(0),
  );
});
test('text tools carry kind and empty accept', () => {
  TOOLS.filter((t) => t.kind === 'text').forEach((t) => {
    expect(t.category).toBe('dev');
    expect(t.accept).toEqual([]);
  });
});
test('exact tool set', () => {
  expect(TOOLS.map((t) => t.id).sort()).toEqual(
    [
      'image-compress', 'image-to-pdf', 'image-upscale',
      'pdf-compress', 'pdf-merge', 'pdf-security', 'pdf-to-image', 'privacy-center',
    ].sort(),
  );
});
```

(The `exact tool set` list stays unchanged for now — tools are added in later tasks, each task appends its id here.)

- [ ] **Step 2: Run tests, verify they fail**

Run: `npm test -- src/tools/registry.test.ts`
Expected: FAIL — `t.kind` is not a known property (TS) / test file won't compile.

- [ ] **Step 3: Add `dev` to categories**

`src/tools/categories.ts` — full new contents:

```ts
export type Category = 'pdf' | 'image' | 'privacy' | 'ai' | 'dev';

export const CATEGORIES: Record<Category, { label: string; accent: Category }> = {
  pdf: { label: 'PDF', accent: 'pdf' },
  image: { label: 'Image', accent: 'image' },
  privacy: { label: 'Privacy', accent: 'privacy' },
  ai: { label: 'AI', accent: 'ai' },
  dev: { label: 'Developer', accent: 'dev' },
};
```

- [ ] **Step 4: Add the accent token**

`src/design/tokens.css`:

In the light `:root` block, after `--accent-ai: 270 58% 48%;` add:
```css
  --accent-dev: 28 80% 45%;
```
In the `:root[data-mode='dark']` block, after `--accent-ai: 270 80% 70%;` add:
```css
  --accent-dev: 32 90% 62%;
```
After the `[data-accent='ai']` rule add:
```css
[data-accent='dev']     { --accent: var(--accent-dev); }
```

Also add a shared danger colour (used by every error banner in the dev suite). In `:root` add `--danger: 0 60% 45%;` and in `:root[data-mode='dark']` add `--danger: 0 65% 62%;`. Components reference it as `text-[hsl(var(--danger))]` — never a raw `hsl(...)` literal.

- [ ] **Step 5: Add `kind` to the `Tool` interface**

`src/tools/registry.ts`, inside `interface Tool`, after `status: 'live' | 'demo';` add:
```ts
  kind?: 'file' | 'text';
```

- [ ] **Step 6: Run tests, verify they pass**

Run: `npm test -- src/tools/registry.test.ts` → Expected: PASS
Run: `npm run typecheck` → Expected: clean

- [ ] **Step 7: Commit**

```bash
git add src/tools/categories.ts src/design/tokens.css src/tools/registry.ts src/tools/registry.test.ts
git commit -m "feat(dev): add Developer category, accent token, Tool.kind field"
```

---

## Task 2: `useDevTransform` hook

**Files:**
- Create: `src/hooks/useDevTransform.ts`
- Test: `src/hooks/useDevTransform.test.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces:
  ```ts
  function useDevTransform<T>(
    fn: (input: string) => T,
    input: string,
    opts?: { debounceMs?: number },
  ): { output: T | null; error: string | null; pending: boolean };
  ```
  - Runs `fn` after `debounceMs` (default 150) of no input change.
  - Empty/whitespace-only `input` ⇒ `{ output: null, error: null, pending: false }`, `fn` not called.
  - `fn` throws ⇒ `error = err.message`, `output` keeps the last successful value.
  - `fn` succeeds ⇒ `error = null`, `output` updated.

- [ ] **Step 1: Write the failing test**

`src/hooks/useDevTransform.test.tsx`:

```tsx
import { renderHook, act } from '@testing-library/react';
import { useDevTransform } from './useDevTransform';

const up = (s: string) => {
  if (s === 'boom') throw new Error('bad input');
  return s.toUpperCase();
};

vi.useFakeTimers();

test('transforms after debounce', () => {
  const { result, rerender } = renderHook(({ i }) => useDevTransform(up, i, { debounceMs: 100 }), {
    initialProps: { i: 'ab' },
  });
  expect(result.current.output).toBeNull();
  act(() => vi.advanceTimersByTime(100));
  expect(result.current.output).toBe('AB');
  expect(result.current.error).toBeNull();
  rerender({ i: 'cd' });
  act(() => vi.advanceTimersByTime(100));
  expect(result.current.output).toBe('CD');
});

test('error keeps last good output', () => {
  const { result, rerender } = renderHook(({ i }) => useDevTransform(up, i, { debounceMs: 0 }), {
    initialProps: { i: 'ok' },
  });
  act(() => vi.advanceTimersByTime(0));
  expect(result.current.output).toBe('OK');
  rerender({ i: 'boom' });
  act(() => vi.advanceTimersByTime(0));
  expect(result.current.error).toBe('bad input');
  expect(result.current.output).toBe('OK');
});

test('empty input is inert', () => {
  const spy = vi.fn(up);
  const { result } = renderHook(() => useDevTransform(spy, '   ', { debounceMs: 0 }));
  act(() => vi.advanceTimersByTime(0));
  expect(spy).not.toHaveBeenCalled();
  expect(result.current).toEqual({ output: null, error: null, pending: false });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npm test -- src/hooks/useDevTransform.test.tsx`
Expected: FAIL — `Cannot find module './useDevTransform'`.

- [ ] **Step 3: Implement the hook**

`src/hooks/useDevTransform.ts`:

```ts
import { useEffect, useRef, useState } from 'react';

interface Result<T> {
  output: T | null;
  error: string | null;
  pending: boolean;
}

export function useDevTransform<T>(
  fn: (input: string) => T,
  input: string,
  opts: { debounceMs?: number } = {},
): Result<T> {
  const debounceMs = opts.debounceMs ?? 150;
  const [state, setState] = useState<Result<T>>({ output: null, error: null, pending: false });
  const lastGood = useRef<T | null>(null);

  useEffect(() => {
    if (input.trim() === '') {
      lastGood.current = null;
      setState({ output: null, error: null, pending: false });
      return;
    }
    setState((s) => ({ ...s, pending: true }));
    const id = setTimeout(() => {
      try {
        const out = fn(input);
        lastGood.current = out;
        setState({ output: out, error: null, pending: false });
      } catch (e) {
        setState({
          output: lastGood.current,
          error: e instanceof Error ? e.message : String(e),
          pending: false,
        });
      }
    }, debounceMs);
    return () => clearTimeout(id);
  }, [fn, input, debounceMs]);

  return state;
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npm test -- src/hooks/useDevTransform.test.tsx` → Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useDevTransform.ts src/hooks/useDevTransform.test.tsx
git commit -m "feat(dev): add useDevTransform debounce+try/catch hook"
```

---

## Task 3: `CodeEditor` component (textarea fallback + lazy CodeMirror)

**Files:**
- Create: `src/components/dev/cmSetup.ts`
- Create: `src/components/dev/CodeEditor.tsx`
- Test: `src/components/dev/CodeEditor.test.tsx`
- Modify: `package.json` (add CodeMirror deps)

**Interfaces:**
- Consumes: nothing.
- Produces:
  ```ts
  type EditorLanguage = 'json' | 'yaml' | 'text';
  interface CodeEditorProps {
    value: string;
    onChange?: (v: string) => void;
    language?: EditorLanguage;   // default 'text'
    readOnly?: boolean;          // default false
    placeholder?: string;
    label: string;               // visually-hidden <label>, required for a11y
    className?: string;
  }
  function CodeEditor(props: CodeEditorProps): JSX.Element;
  ```
  - Always renders a `<textarea>` (the a11y + test surface). In a real browser it additionally mounts CodeMirror over it and hides the textarea; in jsdom the textarea stays visible and interactive.
  - `onChange` fires with the new string on every edit, from whichever surface is active.

- [ ] **Step 1: Install CodeMirror**

```bash
npm install codemirror@^6 @codemirror/state@^6 @codemirror/view@^6 @codemirror/commands@^6 @codemirror/language@^6 @codemirror/lang-json@^6 @codemirror/lang-yaml@^6
```

- [ ] **Step 2: Write the failing test**

`src/components/dev/CodeEditor.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CodeEditor } from './CodeEditor';

test('renders a labelled textarea and emits changes', async () => {
  const onChange = vi.fn();
  render(<CodeEditor value="" onChange={onChange} label="Input" placeholder="paste here" />);
  const ta = screen.getByLabelText('Input');
  await userEvent.type(ta, 'hi');
  expect(onChange).toHaveBeenLastCalledWith('hi');
});

test('readOnly textarea does not accept typing', async () => {
  const onChange = vi.fn();
  render(<CodeEditor value="locked" readOnly label="Output" />);
  const ta = screen.getByLabelText('Output') as HTMLTextAreaElement;
  expect(ta).toHaveAttribute('readonly');
  await userEvent.type(ta, 'x');
  expect(onChange).not.toHaveBeenCalled();
});
```

- [ ] **Step 3: Run test, verify it fails**

Run: `npm test -- src/components/dev/CodeEditor.test.tsx`
Expected: FAIL — `Cannot find module './CodeEditor'`.

- [ ] **Step 4: Write the CodeMirror factory**

`src/components/dev/cmSetup.ts`:

```ts
// Dynamically imported — keeps CodeMirror out of the app bundle and out of jsdom.
import { EditorState, type Extension } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, placeholder } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { bracketMatching, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { json } from '@codemirror/lang-json';
import { yaml } from '@codemirror/lang-yaml';

export type EditorLanguage = 'json' | 'yaml' | 'text';

const langExt = (l: EditorLanguage): Extension[] =>
  l === 'json' ? [json()] : l === 'yaml' ? [yaml()] : [];

export function createEditor(opts: {
  parent: HTMLElement;
  doc: string;
  language: EditorLanguage;
  readOnly: boolean;
  placeholderText?: string;
  onChange: (v: string) => void;
}): EditorView {
  const state = EditorState.create({
    doc: opts.doc,
    extensions: [
      lineNumbers(),
      highlightActiveLine(),
      history(),
      bracketMatching(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      EditorView.editable.of(!opts.readOnly),
      EditorState.readOnly.of(opts.readOnly),
      EditorView.theme({
        '&': { fontFamily: 'var(--font-mono, monospace)', fontSize: '13px', backgroundColor: 'transparent' },
        '.cm-content': { padding: '12px 0' },
        '.cm-gutters': { backgroundColor: 'transparent', border: 'none', color: 'var(--text-dim)' },
      }),
      opts.placeholderText ? placeholder(opts.placeholderText) : [],
      ...langExt(opts.language),
      EditorView.updateListener.of((u) => {
        if (u.docChanged) opts.onChange(u.state.doc.toString());
      }),
    ],
  });
  return new EditorView({ state, parent: opts.parent });
}
```

- [ ] **Step 5: Write `CodeEditor`**

`src/components/dev/CodeEditor.tsx`:

```tsx
import { useEffect, useId, useRef, useState } from 'react';
import type { EditorView } from '@codemirror/view';
import type { EditorLanguage } from './cmSetup';
import { cn } from '../../lib/cn';

interface CodeEditorProps {
  value: string;
  onChange?: (v: string) => void;
  language?: EditorLanguage;
  readOnly?: boolean;
  placeholder?: string;
  label: string;
  className?: string;
}

export function CodeEditor({
  value,
  onChange,
  language = 'text',
  readOnly = false,
  placeholder,
  label,
  className,
}: CodeEditorProps) {
  const id = useId();
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const cb = useRef(onChange);
  cb.current = onChange;
  const [cmReady, setCmReady] = useState(false);

  // Mount CodeMirror in the browser only. jsdom import of cmSetup is skipped
  // because window.matchMedia-less environments still run this effect — guard on
  // a DOM API CodeMirror needs.
  useEffect(() => {
    if (typeof document === 'undefined' || !host.current) return;
    if (typeof document.createRange !== 'function') return; // jsdom guard
    let disposed = false;
    import('./cmSetup')
      .then(({ createEditor }) => {
        if (disposed || !host.current) return;
        view.current = createEditor({
          parent: host.current,
          doc: value,
          language,
          readOnly,
          placeholderText: placeholder,
          onChange: (v) => cb.current?.(v),
        });
        setCmReady(true);
      })
      .catch(() => {
        /* fall back to textarea */
      });
    return () => {
      disposed = true;
      view.current?.destroy();
      view.current = null;
    };
    // language/readOnly are fixed per tool instance
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep CodeMirror's doc in sync when `value` changes from outside (swap, reset).
  useEffect(() => {
    const v = view.current;
    if (!v) return;
    if (v.state.doc.toString() !== value) {
      v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: value } });
    }
  }, [value]);

  return (
    <div className={cn('relative min-h-[40vh] rounded-md border border-border bg-sunken px-3', className)}>
      <label htmlFor={id} className="sr-only">{label}</label>
      <div ref={host} hidden={!cmReady} className="h-full w-full" />
      <textarea
        id={id}
        hidden={cmReady}
        value={value}
        readOnly={readOnly}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        spellCheck={false}
        className="h-full min-h-[40vh] w-full resize-none bg-transparent py-3 font-mono text-[13px] text-text outline-none placeholder:text-dim"
      />
    </div>
  );
}

export type { CodeEditorProps };
```

- [ ] **Step 6: Run test, verify it passes**

Run: `npm test -- src/components/dev/CodeEditor.test.tsx` → Expected: PASS
Run: `npm run typecheck` → Expected: clean

- [ ] **Step 7: Add the `--font-mono` token**

The CM theme references `var(--font-mono)`. In `src/design/tokens.css` `:root`, near the other font/tracking vars, add:
```css
  --font-mono: 'Geist Mono', ui-monospace, monospace;
```
Confirm Geist Mono is imported (it is, in `src/main.tsx` via `@fontsource/geist-mono` — verify with `grep -n geist-mono src/main.tsx`; if absent, add `import '@fontsource/geist-mono';`).

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json src/components/dev/cmSetup.ts src/components/dev/CodeEditor.tsx src/components/dev/CodeEditor.test.tsx src/design/tokens.css src/main.tsx
git commit -m "feat(dev): add CodeEditor with lazy CodeMirror 6 and textarea fallback"
```

---

## Task 4: `SplitTool` layout component

**Files:**
- Create: `src/components/dev/SplitTool.tsx`
- Test: `src/components/dev/SplitTool.test.tsx`

**Interfaces:**
- Consumes: `useDevTransform` (Task 2), `CodeEditor` (Task 3), `Button` / `Segmented` from `src/components/ui`.
- Produces:
  ```ts
  interface Direction {
    id: string;
    label: string;              // e.g. "JSON → YAML"
    transform: (input: string) => string;
    inputLanguage: 'json' | 'yaml' | 'text';
    outputLanguage: 'json' | 'yaml' | 'text';
    downloadName: string;       // e.g. "converted.yaml"
    downloadType: string;       // e.g. "text/yaml"
  }
  interface SplitToolProps {
    directions: Direction[];    // 1 = one-way tool, 2 = bidirectional with swap
    inputPlaceholder?: string;
    acceptFile?: boolean;       // default true — show "open file" + drop
    fileAsBytes?: boolean;      // default false — pass base64 of bytes (Base64 tool)
  }
  function SplitTool(props: SplitToolProps): JSX.Element;
  ```
  - Live transforms input via `useDevTransform(dir.transform, input)`.
  - `directions.length === 2`: a `Segmented` toggle picks the active direction; a swap button moves the current output into the input and flips direction.
  - Error banner (`role="alert"`) under the input pane shows `error`; output pane shows last good value.
  - Output pane: **Copy** button (writes `navigator.clipboard`, shows "Copied") and **Download** button (`Blob` + object URL, `dir.downloadName`).
  - `acceptFile`: a button + drag-over on the input reads a dropped file as text (`file.text()`), or as base64 when `fileAsBytes`.

- [ ] **Step 1: Write the failing test**

`src/components/dev/SplitTool.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SplitTool } from './SplitTool';

const dirs = [
  {
    id: 'up', label: 'lower → UPPER',
    transform: (s: string) => { if (s === 'boom') throw new Error('nope'); return s.toUpperCase(); },
    inputLanguage: 'text' as const, outputLanguage: 'text' as const,
    downloadName: 'out.txt', downloadType: 'text/plain',
  },
  {
    id: 'down', label: 'UPPER → lower',
    transform: (s: string) => s.toLowerCase(),
    inputLanguage: 'text' as const, outputLanguage: 'text' as const,
    downloadName: 'out.txt', downloadType: 'text/plain',
  },
];

test('live transforms input to output', async () => {
  render(<SplitTool directions={dirs} />);
  await userEvent.type(screen.getByLabelText(/input/i), 'abc');
  expect(await screen.findByLabelText(/output/i)).toHaveValue('ABC');
});

test('shows error banner on bad input, keeps last output', async () => {
  render(<SplitTool directions={dirs} />);
  const input = screen.getByLabelText(/input/i);
  await userEvent.type(input, 'ok');
  expect(await screen.findByLabelText(/output/i)).toHaveValue('OK');
  await userEvent.clear(input);
  await userEvent.type(input, 'boom');
  expect(await screen.findByRole('alert')).toHaveTextContent('nope');
  expect(screen.getByLabelText(/output/i)).toHaveValue('OK');
});

test('swap moves output into input and flips direction', async () => {
  render(<SplitTool directions={dirs} />);
  await userEvent.type(screen.getByLabelText(/input/i), 'aa');
  expect(await screen.findByLabelText(/output/i)).toHaveValue('AA');
  await userEvent.click(screen.getByRole('button', { name: /swap/i }));
  expect(screen.getByLabelText(/input/i)).toHaveValue('AA');
  expect(await screen.findByLabelText(/output/i)).toHaveValue('aa');
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npm test -- src/components/dev/SplitTool.test.tsx`
Expected: FAIL — `Cannot find module './SplitTool'`.

- [ ] **Step 3: Implement `SplitTool`**

`src/components/dev/SplitTool.tsx`:

```tsx
import { useCallback, useMemo, useState } from 'react';
import { ArrowLeftRight, Copy, Check, Download, Upload } from 'lucide-react';
import { Button } from '../ui';
import { Segmented } from '../ui';
import { CodeEditor } from './CodeEditor';
import { useDevTransform } from '../../hooks/useDevTransform';

export interface Direction {
  id: string;
  label: string;
  transform: (input: string) => string;
  inputLanguage: 'json' | 'yaml' | 'text';
  outputLanguage: 'json' | 'yaml' | 'text';
  downloadName: string;
  downloadType: string;
}

interface SplitToolProps {
  directions: Direction[];
  inputPlaceholder?: string;
  acceptFile?: boolean;
  fileAsBytes?: boolean;
}

export function SplitTool({
  directions,
  inputPlaceholder,
  acceptFile = true,
  fileAsBytes = false,
}: SplitToolProps) {
  const [dirId, setDirId] = useState(directions[0].id);
  const dir = useMemo(() => directions.find((d) => d.id === dirId) ?? directions[0], [directions, dirId]);
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);

  const { output, error } = useDevTransform(dir.transform, input);
  const outStr = output ?? '';

  const swap = useCallback(() => {
    if (directions.length !== 2) return;
    const other = directions.find((d) => d.id !== dirId)!;
    setInput(outStr);
    setDirId(other.id);
  }, [directions, dirId, outStr]);

  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(outStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }, [outStr]);

  const download = useCallback(() => {
    const blob = new Blob([outStr], { type: dir.downloadType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = dir.downloadName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }, [outStr, dir]);

  const readFile = useCallback(
    async (file: File) => {
      if (fileAsBytes) {
        const buf = new Uint8Array(await file.arrayBuffer());
        let bin = '';
        buf.forEach((b) => { bin += String.fromCharCode(b); });
        setInput(btoa(bin));
      } else {
        setInput(await file.text());
      }
    },
    [fileAsBytes],
  );

  return (
    <div className="flex flex-col gap-4">
      {directions.length === 2 && (
        <div className="flex items-center gap-2">
          <Segmented
            options={directions.map((d) => ({ value: d.id, label: d.label }))}
            value={dirId}
            onChange={setDirId}
          />
          <Button variant="ghost" onClick={swap} aria-label="Swap input and output">
            <ArrowLeftRight className="size-4" />
          </Button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-dim/70">Input</span>
            {acceptFile && (
              <label className="flex cursor-pointer items-center gap-1 text-xs text-dim hover:text-text">
                <Upload className="size-3.5" /> Open file
                <input
                  type="file"
                  className="sr-only"
                  onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0])}
                />
              </label>
            )}
          </div>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) readFile(f);
            }}
          >
            <CodeEditor
              label="Input"
              value={input}
              onChange={setInput}
              language={dir.inputLanguage}
              placeholder={inputPlaceholder}
            />
          </div>
          {error && (
            <p role="alert" className="rounded-md border border-border bg-sunken px-3 py-2 text-xs text-[hsl(var(--danger))]">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-dim/70">Output</span>
            <div className="flex gap-1">
              <Button variant="ghost" onClick={copy} aria-label="Copy output">
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              </Button>
              <Button variant="ghost" onClick={download} aria-label="Download output">
                <Download className="size-3.5" />
              </Button>
            </div>
          </div>
          <CodeEditor label="Output" value={outStr} readOnly language={dir.outputLanguage} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npm test -- src/components/dev/SplitTool.test.tsx` → Expected: PASS

If `Segmented`'s prop shape differs (check `src/components/ui/Segmented.tsx`), adapt the `options`/`value`/`onChange` call to match its real signature and re-run.

- [ ] **Step 5: Add clipboard mock to test setup if missing**

If the swap/copy test errors on `navigator.clipboard`, add to `src/test/setup.ts`:
```ts
if (typeof navigator !== "undefined" && !navigator.clipboard) {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: () => Promise.resolve() },
    configurable: true,
  });
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/dev/SplitTool.tsx src/components/dev/SplitTool.test.tsx src/test/setup.ts
git commit -m "feat(dev): add SplitTool split-editor layout"
```

---

## Task 5: JSON Formatter tool

**Files:**
- Create: `src/services/dev/json-format.ts`
- Test: `src/services/dev/json-format.test.ts`
- Create: `src/routes/dev/JsonFormat.tsx`
- Modify: `src/tools/registry.ts` (add entry), `src/tools/registry.test.ts` (`exact tool set`), `src/app/routes.tsx`

**Interfaces:**
- Consumes: `SplitTool` + `Direction` (Task 4).
- Produces:
  ```ts
  export function prettyJson(input: string): string;   // 2-space indent
  export function minifyJson(input: string): string;
  ```
  Both throw `Error` with `` `Invalid JSON: ${e.message}` `` on parse failure.

- [ ] **Step 1: Write the failing test**

`src/services/dev/json-format.test.ts`:

```ts
import { prettyJson, minifyJson } from './json-format';

test('pretty-prints with 2-space indent', () => {
  expect(prettyJson('{"a":1,"b":[2,3]}')).toBe('{\n  "a": 1,\n  "b": [\n    2,\n    3\n  ]\n}');
});
test('minifies', () => {
  expect(minifyJson('{\n  "a": 1\n}')).toBe('{"a":1}');
});
test('throws a readable error on bad JSON', () => {
  expect(() => prettyJson('{bad}')).toThrow(/Invalid JSON/);
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npm test -- src/services/dev/json-format.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the service**

`src/services/dev/json-format.ts`:

```ts
function parse(input: string): unknown {
  try {
    return JSON.parse(input);
  } catch (e) {
    throw new Error(`Invalid JSON: ${e instanceof Error ? e.message : String(e)}`);
  }
}

export function prettyJson(input: string): string {
  return JSON.stringify(parse(input), null, 2);
}

export function minifyJson(input: string): string {
  return JSON.stringify(parse(input));
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npm test -- src/services/dev/json-format.test.ts` → Expected: PASS

- [ ] **Step 5: Create the route component**

`src/routes/dev/JsonFormat.tsx`:

```tsx
import { getTool } from '../../tools/registry';
import { ToolHeader } from '../../components/tool/ToolHeader';
import { SplitTool, type Direction } from '../../components/dev/SplitTool';
import { prettyJson, minifyJson } from '../../services/dev/json-format';

const tool = getTool('dev-json-format')!;

const directions: Direction[] = [
  {
    id: 'pretty', label: 'Prettify',
    transform: prettyJson,
    inputLanguage: 'json', outputLanguage: 'json',
    downloadName: 'formatted.json', downloadType: 'application/json',
  },
  {
    id: 'minify', label: 'Minify',
    transform: minifyJson,
    inputLanguage: 'json', outputLanguage: 'json',
    downloadName: 'formatted.json', downloadType: 'application/json',
  },
];

export default function JsonFormat() {
  return (
    <main role="main" className="mx-auto flex max-w-5xl flex-col gap-8 p-6 sm:p-10">
      <ToolHeader
        tool={tool}
        title="Format JSON."
        subtitle="Prettify or minify. Invalid JSON is flagged with the parser's message."
      />
      <SplitTool directions={directions} inputPlaceholder='{"paste":"json here"}' />
    </main>
  );
}
```

- [ ] **Step 6: Register the tool**

`src/tools/registry.ts` — add an `import` for an icon (`Braces`) to the lucide import list, then add to `TOOLS` (after `privacy-center` or grouped at end):

```ts
  {
    id: 'dev-json-format', name: 'JSON Formatter', description: 'Prettify or minify JSON',
    route: '/dev/json-format', category: 'dev', icon: Braces,
    processing: 'local', status: 'live', kind: 'text', accept: [],
  },
```

`src/tools/registry.test.ts` — add `'dev-json-format'` to the `exact tool set` array.

- [ ] **Step 7: Add the route**

`src/app/routes.tsx`:
- Add: `const DevJsonFormat = lazy(() => import('../routes/dev/JsonFormat'));`
- Add to `children`: `{ path: 'dev/json-format', element: page(<DevJsonFormat />) },`

- [ ] **Step 8: Run the full test file set**

Run: `npm test -- src/services/dev/json-format.test.ts src/tools/registry.test.ts src/app/routes.test.tsx`
Expected: PASS (route smoke test now covers `/dev/json-format` via the `TOOLS` loop).
Run: `npm run typecheck` → clean

- [ ] **Step 9: Commit**

```bash
git add src/services/dev/json-format.ts src/services/dev/json-format.test.ts src/routes/dev/JsonFormat.tsx src/tools/registry.ts src/tools/registry.test.ts src/app/routes.tsx
git commit -m "feat(dev): add JSON Formatter tool"
```

---

## Task 6: JSON ⇄ YAML tool

**Files:**
- Create: `src/services/dev/json-yaml.ts` + `.test.ts`
- Create: `src/routes/dev/JsonYaml.tsx`
- Modify: `src/tools/registry.ts`, `src/tools/registry.test.ts`, `src/app/routes.tsx`, `package.json`

**Interfaces:**
- Consumes: `SplitTool` + `Direction`.
- Produces:
  ```ts
  export function jsonToYaml(input: string): string;
  export function yamlToJson(input: string): string;   // 2-space pretty JSON
  ```
  `jsonToYaml` throws `Invalid JSON: …`; `yamlToJson` throws `Invalid YAML: …`.

- [ ] **Step 1: Install js-yaml**

```bash
npm install js-yaml@^4 && npm install -D @types/js-yaml@^4
```

- [ ] **Step 2: Write the failing test**

`src/services/dev/json-yaml.test.ts`:

```ts
import { jsonToYaml, yamlToJson } from './json-yaml';

test('json to yaml', async () => {
  expect(await jsonToYaml('{"a":1,"b":["x","y"]}')).toBe('a: 1\nb:\n  - x\n  - y\n');
});
test('yaml to json', async () => {
  expect(await yamlToJson('a: 1\nb:\n  - x\n')).toBe('{\n  "a": 1,\n  "b": [\n    "x"\n  ]\n}');
});
test('round-trips', async () => {
  const json = '{\n  "n": 5,\n  "list": [\n    1,\n    2\n  ]\n}';
  expect(await yamlToJson(await jsonToYaml(json))).toBe(json);
});
test('bad json throws', async () => {
  await expect(jsonToYaml('{oops')).rejects.toThrow(/Invalid JSON/);
});
test('bad yaml throws', async () => {
  await expect(yamlToJson('a:\n  - b\n - c')).rejects.toThrow(/Invalid YAML/);
});
```

> Note: transforms are declared `async` here because they dynamically import `js-yaml`. `useDevTransform`/`SplitTool` treat `transform` as sync-returning-string. **Resolution:** the service module imports `js-yaml` statically (it is small, ~30 KB, and this is the only tool that needs it — a per-route lazy chunk still isolates it because the route component is itself `lazy()`). Rewrite tests below without `async`:

```ts
import { jsonToYaml, yamlToJson } from './json-yaml';

test('json to yaml', () => {
  expect(jsonToYaml('{"a":1,"b":["x","y"]}')).toBe('a: 1\nb:\n  - x\n  - y\n');
});
test('yaml to json', () => {
  expect(yamlToJson('a: 1\nb:\n  - x\n')).toBe('{\n  "a": 1,\n  "b": [\n    "x"\n  ]\n}');
});
test('round-trips', () => {
  const json = '{\n  "n": 5,\n  "list": [\n    1,\n    2\n  ]\n}';
  expect(yamlToJson(jsonToYaml(json))).toBe(json);
});
test('bad json throws', () => {
  expect(() => jsonToYaml('{oops')).toThrow(/Invalid JSON/);
});
test('bad yaml throws', () => {
  expect(() => yamlToJson('a:\n  - b\n - c')).toThrow(/Invalid YAML/);
});
```

- [ ] **Step 3: Run test, verify it fails**

Run: `npm test -- src/services/dev/json-yaml.test.ts` → FAIL, module not found.

- [ ] **Step 4: Implement the service**

`src/services/dev/json-yaml.ts`:

```ts
import yaml from 'js-yaml';

export function jsonToYaml(input: string): string {
  let value: unknown;
  try {
    value = JSON.parse(input);
  } catch (e) {
    throw new Error(`Invalid JSON: ${e instanceof Error ? e.message : String(e)}`);
  }
  return yaml.dump(value, { indent: 2, lineWidth: -1 });
}

export function yamlToJson(input: string): string {
  let value: unknown;
  try {
    value = yaml.load(input);
  } catch (e) {
    throw new Error(`Invalid YAML: ${e instanceof Error ? e.message : String(e)}`);
  }
  return JSON.stringify(value, null, 2);
}
```

- [ ] **Step 5: Run test, verify it passes**

Run: `npm test -- src/services/dev/json-yaml.test.ts` → PASS
(If the exact YAML string differs from js-yaml's real output, copy the real output into the expectation — the behaviour, not the guessed whitespace, is what matters.)

- [ ] **Step 6: Route component**

`src/routes/dev/JsonYaml.tsx`:

```tsx
import { getTool } from '../../tools/registry';
import { ToolHeader } from '../../components/tool/ToolHeader';
import { SplitTool, type Direction } from '../../components/dev/SplitTool';
import { jsonToYaml, yamlToJson } from '../../services/dev/json-yaml';

const tool = getTool('dev-json-yaml')!;

const directions: Direction[] = [
  {
    id: 'j2y', label: 'JSON → YAML',
    transform: jsonToYaml,
    inputLanguage: 'json', outputLanguage: 'yaml',
    downloadName: 'converted.yaml', downloadType: 'text/yaml',
  },
  {
    id: 'y2j', label: 'YAML → JSON',
    transform: yamlToJson,
    inputLanguage: 'yaml', outputLanguage: 'json',
    downloadName: 'converted.json', downloadType: 'application/json',
  },
];

export default function JsonYaml() {
  return (
    <main role="main" className="mx-auto flex max-w-5xl flex-col gap-8 p-6 sm:p-10">
      <ToolHeader tool={tool} title="Convert JSON and YAML." subtitle="Both directions, live, on your device." />
      <SplitTool directions={directions} inputPlaceholder='{"paste":"json or yaml"}' />
    </main>
  );
}
```

- [ ] **Step 7: Register + route**

- `src/tools/registry.ts`: import icon `FileJson2` (or `FileJson`), add:
  ```ts
  {
    id: 'dev-json-yaml', name: 'JSON ⇄ YAML', description: 'Convert between JSON and YAML',
    route: '/dev/json-yaml', category: 'dev', icon: FileJson2,
    processing: 'local', status: 'live', kind: 'text', accept: [],
  },
  ```
- `src/tools/registry.test.ts`: add `'dev-json-yaml'` to `exact tool set`.
- `src/app/routes.tsx`: `const DevJsonYaml = lazy(() => import('../routes/dev/JsonYaml'));` + `{ path: 'dev/json-yaml', element: page(<DevJsonYaml />) },`

- [ ] **Step 8: Run tests + typecheck**

Run: `npm test -- src/services/dev/json-yaml.test.ts src/tools/registry.test.ts src/app/routes.test.tsx` → PASS
Run: `npm run typecheck` → clean

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json src/services/dev/json-yaml.ts src/services/dev/json-yaml.test.ts src/routes/dev/JsonYaml.tsx src/tools/registry.ts src/tools/registry.test.ts src/app/routes.tsx
git commit -m "feat(dev): add JSON to YAML converter"
```

---

## Task 7: Base64 tool (text + file)

**Files:**
- Create: `src/services/dev/base64.ts` + `.test.ts`
- Create: `src/routes/dev/Base64.tsx`
- Modify: registry, registry test, routes

**Interfaces:**
- Consumes: `SplitTool` (with `fileAsBytes` — see note).
- Produces:
  ```ts
  export function encodeBase64(input: string): string;   // UTF-8 text → base64
  export function decodeBase64(input: string): string;   // base64 → UTF-8 text
  ```
  `decodeBase64` throws `Error('Not valid Base64')` on failure.
  Note: the "file" path in `SplitTool` (`fileAsBytes: true`) already produces base64 of the raw bytes and puts it in the input pane; for the Base64 tool the user then switches to "decode" or just keeps the encoded text. Keep `fileAsBytes` **false** here and instead the encode direction accepts pasted text; file drop uses `file.text()` then encodes. That covers "encode a file's text". Binary-file base64 is deferred (documented below).

- [ ] **Step 1: Write the failing test**

`src/services/dev/base64.test.ts`:

```ts
import { encodeBase64, decodeBase64 } from './base64';

test('encodes unicode text', () => {
  expect(encodeBase64('héllo')).toBe('aMOpbGxv');
});
test('decodes back', () => {
  expect(decodeBase64('aMOpbGxv')).toBe('héllo');
});
test('round-trips', () => {
  const s = 'The quick brown 🦊';
  expect(decodeBase64(encodeBase64(s))).toBe(s);
});
test('rejects non-base64', () => {
  expect(() => decodeBase64('not*valid')).toThrow('Not valid Base64');
});
```

- [ ] **Step 2: Run, verify fail.** `npm test -- src/services/dev/base64.test.ts`

- [ ] **Step 3: Implement**

`src/services/dev/base64.ts`:

```ts
export function encodeBase64(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin);
}

export function decodeBase64(input: string): string {
  let bin: string;
  try {
    bin = atob(input.trim());
  } catch {
    throw new Error('Not valid Base64');
  }
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
```

- [ ] **Step 4: Run, verify pass.**

- [ ] **Step 5: Route component**

`src/routes/dev/Base64.tsx` — same shape as `JsonYaml.tsx`:
- `tool = getTool('dev-base64')!`
- directions:
  ```ts
  const directions: Direction[] = [
    { id: 'enc', label: 'Encode', transform: encodeBase64,
      inputLanguage: 'text', outputLanguage: 'text',
      downloadName: 'encoded.txt', downloadType: 'text/plain' },
    { id: 'dec', label: 'Decode', transform: decodeBase64,
      inputLanguage: 'text', outputLanguage: 'text',
      downloadName: 'decoded.txt', downloadType: 'text/plain' },
  ];
  ```
- `<ToolHeader tool={tool} title="Base64 encode and decode." subtitle="Text and text files, UTF-8 safe." />`
- `<SplitTool directions={directions} inputPlaceholder="paste text or Base64" />`

- [ ] **Step 6: Register + route**
- registry entry: `id: 'dev-base64'`, `name: 'Base64'`, `description: 'Encode or decode Base64'`, `route: '/dev/base64'`, `icon: Binary`, `kind: 'text'`, `accept: []`.
- `exact tool set` += `'dev-base64'`.
- routes.tsx: `const DevBase64 = lazy(() => import('../routes/dev/Base64'));` + `{ path: 'dev/base64', element: page(<DevBase64 />) },`

- [ ] **Step 7: Run tests + typecheck.**
Run: `npm test -- src/services/dev/base64.test.ts src/tools/registry.test.ts src/app/routes.test.tsx` → PASS

- [ ] **Step 8: Commit**

```bash
git add src/services/dev/base64.ts src/services/dev/base64.test.ts src/routes/dev/Base64.tsx src/tools/registry.ts src/tools/registry.test.ts src/app/routes.tsx
git commit -m "feat(dev): add Base64 encode/decode tool"
```

> **Deferred:** binary-file → Base64 (images, PDFs). `SplitTool.fileAsBytes` already exists for it; wiring a per-tool "file bytes" toggle is a Phase 3 follow-up. `// ponytail: text-only for now, fileAsBytes path is built but unused here`.

---

## Task 8: URL encode/decode tool

**Files:** `src/services/dev/url-encode.ts` + `.test.ts`, `src/routes/dev/UrlEncode.tsx`, registry, registry test, routes.

**Interfaces:**
```ts
export function encodeUrl(input: string): string;   // encodeURIComponent
export function decodeUrl(input: string): string;   // decodeURIComponent, throws 'Malformed URL encoding'
```

- [ ] **Step 1: Failing test** — `src/services/dev/url-encode.test.ts`:

```ts
import { encodeUrl, decodeUrl } from './url-encode';

test('encodes reserved chars', () => {
  expect(encodeUrl('a b&c=d')).toBe('a%20b%26c%3Dd');
});
test('decodes', () => {
  expect(decodeUrl('a%20b%26c')).toBe('a b&c');
});
test('throws on malformed input', () => {
  expect(() => decodeUrl('%')).toThrow('Malformed URL encoding');
});
```

- [ ] **Step 2: Run, verify fail.**

- [ ] **Step 3: Implement** — `src/services/dev/url-encode.ts`:

```ts
export function encodeUrl(input: string): string {
  return encodeURIComponent(input);
}

export function decodeUrl(input: string): string {
  try {
    return decodeURIComponent(input);
  } catch {
    throw new Error('Malformed URL encoding');
  }
}
```

- [ ] **Step 4: Run, verify pass.**

- [ ] **Step 5: Route** — `src/routes/dev/UrlEncode.tsx`, mirror Base64. directions `enc`/`dec` with `label: 'Encode'` / `'Decode'`, `inputLanguage`/`outputLanguage` `'text'`, `downloadName: 'url.txt'`, `downloadType: 'text/plain'`. Header title `"URL encode and decode."`.

- [ ] **Step 6: Register + route** — `id: 'dev-url'`, `name: 'URL Encode'`, `description: 'Percent-encode or decode URL components'`, `route: '/dev/url'`, `icon: Link`, `kind: 'text'`. `exact tool set` += `'dev-url'`. routes.tsx lazy + child `dev/url`.

- [ ] **Step 7: Run** `npm test -- src/services/dev/url-encode.test.ts src/tools/registry.test.ts src/app/routes.test.tsx` → PASS; `npm run typecheck` clean.

- [ ] **Step 8: Commit**

```bash
git add src/services/dev/url-encode.ts src/services/dev/url-encode.test.ts src/routes/dev/UrlEncode.tsx src/tools/registry.ts src/tools/registry.test.ts src/app/routes.tsx
git commit -m "feat(dev): add URL encode/decode tool"
```

---

## Task 9: HTML entities encode/decode tool

**Files:** `src/services/dev/html-entities.ts` + `.test.ts`, `src/routes/dev/HtmlEntities.tsx`, registry, registry test, routes.

**Interfaces:**
```ts
export function encodeEntities(input: string): string;   // & < > " ' → named/numeric entities
export function decodeEntities(input: string): string;   // entities → chars (named + numeric)
```
No throw path (any input is valid); malformed entities pass through unchanged.

- [ ] **Step 1: Failing test** — `src/services/dev/html-entities.test.ts`:

```ts
import { encodeEntities, decodeEntities } from './html-entities';

test('encodes the five', () => {
  expect(encodeEntities(`<a href="x">'&'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;');
});
test('decodes named and numeric', () => {
  expect(decodeEntities('&lt;b&gt;&#39;hi&#39;&amp;&#x2764;')).toBe(`<b>'hi'&❤`);
});
test('round-trips', () => {
  const s = `5 < 6 && "yes" > 'no'`;
  expect(decodeEntities(encodeEntities(s))).toBe(s);
});
```

- [ ] **Step 2: Run, verify fail.**

- [ ] **Step 3: Implement** — `src/services/dev/html-entities.ts`:

```ts
const NAMED: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0',
  copy: '\u00a9', reg: '\u00ae', hellip: '\u2026', mdash: '\u2014', ndash: '\u2013',
};

export function encodeEntities(input: string): string {
  return input.replace(/[&<>"']/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;',
  );
}

export function decodeEntities(input: string): string {
  return input.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (m, body: string) => {
    if (body[0] === '#') {
      const code = body[1] === 'x' || body[1] === 'X'
        ? parseInt(body.slice(2), 16)
        : parseInt(body.slice(1), 10);
      return Number.isNaN(code) ? m : String.fromCodePoint(code);
    }
    return body in NAMED ? NAMED[body] : m;
  });
}
```

- [ ] **Step 4: Run, verify pass.**

- [ ] **Step 5: Route** — `src/routes/dev/HtmlEntities.tsx`, mirror. directions `enc`/`dec`, `label: 'Encode'`/`'Decode'`, languages `'text'`, `downloadName: 'entities.txt'`, `downloadType: 'text/plain'`. Title `"Encode and decode HTML entities."`.

- [ ] **Step 6: Register + route** — `id: 'dev-html-entities'`, `name: 'HTML Entities'`, `description: 'Escape or unescape HTML entities'`, `route: '/dev/html-entities'`, `icon: Code`, `kind: 'text'`. `exact tool set` += id. routes.tsx lazy + `dev/html-entities`.

- [ ] **Step 7: Run** relevant tests + typecheck → PASS/clean.

- [ ] **Step 8: Commit**

```bash
git add src/services/dev/html-entities.ts src/services/dev/html-entities.test.ts src/routes/dev/HtmlEntities.tsx src/tools/registry.ts src/tools/registry.test.ts src/app/routes.tsx
git commit -m "feat(dev): add HTML entities encode/decode tool"
```

---

## Task 10: Query string ⇄ JSON tool

**Files:** `src/services/dev/query-json.ts` + `.test.ts`, `src/routes/dev/QueryJson.tsx`, registry, registry test, routes.

**Interfaces:**
```ts
export function queryToJson(input: string): string;   // "?a=1&b=2&b=3" → pretty JSON {"a":"1","b":["3"... ]}
export function jsonToQuery(input: string): string;    // {"a":"1","b":["2","3"]} → "a=1&b=2&b=3"
```
`queryToJson`: leading `?` optional; repeated keys collapse to an array. Never throws (empty ⇒ `{}` — but empty input is caught by `useDevTransform` first).
`jsonToQuery`: throws `Invalid JSON: …`; throws `Error('Query values must be strings, numbers, or arrays of them')` for nested objects.

- [ ] **Step 1: Failing test** — `src/services/dev/query-json.test.ts`:

```ts
import { queryToJson, jsonToQuery } from './query-json';

test('query to json, repeated key becomes array', () => {
  expect(queryToJson('?a=1&b=x&b=y')).toBe('{\n  "a": "1",\n  "b": [\n    "x",\n    "y"\n  ]\n}');
});
test('json to query', () => {
  expect(jsonToQuery('{"a":"1","b":["x","y"]}')).toBe('a=1&b=x&b=y');
});
test('json to query rejects nested objects', () => {
  expect(() => jsonToQuery('{"a":{"deep":1}}')).toThrow(/must be strings/);
});
test('json to query rejects bad json', () => {
  expect(() => jsonToQuery('{bad')).toThrow(/Invalid JSON/);
});
```

- [ ] **Step 2: Run, verify fail.**

- [ ] **Step 3: Implement** — `src/services/dev/query-json.ts`:

```ts
export function queryToJson(input: string): string {
  const params = new URLSearchParams(input.replace(/^\?/, ''));
  const out: Record<string, string | string[]> = {};
  for (const key of new Set(params.keys())) {
    const all = params.getAll(key);
    out[key] = all.length > 1 ? all : all[0];
  }
  return JSON.stringify(out, null, 2);
}

export function jsonToQuery(input: string): string {
  let value: unknown;
  try {
    value = JSON.parse(input);
  } catch (e) {
    throw new Error(`Invalid JSON: ${e instanceof Error ? e.message : String(e)}`);
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Query values must be strings, numbers, or arrays of them');
  }
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    const items = Array.isArray(v) ? v : [v];
    for (const item of items) {
      if (typeof item === 'object' && item !== null) {
        throw new Error('Query values must be strings, numbers, or arrays of them');
      }
      params.append(k, String(item));
    }
  }
  return params.toString();
}
```

- [ ] **Step 4: Run, verify pass.** (Adjust expected strings to real `URLSearchParams` output if needed.)

- [ ] **Step 5: Route** — `src/routes/dev/QueryJson.tsx`, mirror JsonYaml. directions `q2j` (`'Query → JSON'`, out `json`, `query.json`/`application/json`) and `j2q` (`'JSON → Query'`, out `text`, `query.txt`/`text/plain`). Title `"Convert query strings and JSON."`.

- [ ] **Step 6: Register + route** — `id: 'dev-query-json'`, `name: 'Query String ⇄ JSON'`, `description: 'Parse or build URL query strings'`, `route: '/dev/query-json'`, `icon: Link2`, `kind: 'text'`. `exact tool set` += id. routes.tsx lazy + `dev/query-json`.

- [ ] **Step 7: Run** relevant tests + typecheck.

- [ ] **Step 8: Commit**

```bash
git add src/services/dev/query-json.ts src/services/dev/query-json.test.ts src/routes/dev/QueryJson.tsx src/tools/registry.ts src/tools/registry.test.ts src/app/routes.tsx
git commit -m "feat(dev): add query string / JSON converter"
```

---

## Task 11: JSON ⇄ CSV tool

**Files:** `src/services/dev/json-csv.ts` + `.test.ts`, `src/routes/dev/JsonCsv.tsx`, registry, registry test, routes, `package.json`.

**Interfaces:**
```ts
export function jsonToCsv(input: string): string;   // array of flat objects → CSV with header row
export function csvToJson(input: string): string;   // CSV with header → pretty JSON array
```
`jsonToCsv` throws `Invalid JSON: …`; throws `Error('Expected a JSON array of objects')` otherwise. Nested values are JSON-stringified into the cell.
`csvToJson` throws `Error('Could not parse CSV: …')` on papaparse errors.

- [ ] **Step 1: Install papaparse**

```bash
npm install papaparse@^5 && npm install -D @types/papaparse@^5
```

- [ ] **Step 2: Failing test** — `src/services/dev/json-csv.test.ts`:

```ts
import { jsonToCsv, csvToJson } from './json-csv';

test('json array to csv', () => {
  expect(jsonToCsv('[{"a":1,"b":"x"},{"a":2,"b":"y"}]')).toBe('a,b\r\n1,x\r\n2,y');
});
test('csv to json', () => {
  expect(csvToJson('a,b\r\n1,x\r\n2,y')).toBe('[\n  {\n    "a": "1",\n    "b": "x"\n  },\n  {\n    "a": "2",\n    "b": "y"\n  }\n]');
});
test('rejects non-array json', () => {
  expect(() => jsonToCsv('{"a":1}')).toThrow(/array of objects/);
});
test('rejects bad json', () => {
  expect(() => jsonToCsv('[bad')).toThrow(/Invalid JSON/);
});
```

- [ ] **Step 3: Run, verify fail.**

- [ ] **Step 4: Implement** — `src/services/dev/json-csv.ts`:

```ts
import Papa from 'papaparse';

export function jsonToCsv(input: string): string {
  let value: unknown;
  try {
    value = JSON.parse(input);
  } catch (e) {
    throw new Error(`Invalid JSON: ${e instanceof Error ? e.message : String(e)}`);
  }
  if (!Array.isArray(value) || value.some((r) => typeof r !== 'object' || r === null)) {
    throw new Error('Expected a JSON array of objects');
  }
  const rows = (value as Record<string, unknown>[]).map((r) => {
    const flat: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(r)) {
      flat[k] = typeof v === 'object' && v !== null ? JSON.stringify(v) : v;
    }
    return flat;
  });
  return Papa.unparse(rows);
}

export function csvToJson(input: string): string {
  const parsed = Papa.parse<Record<string, string>>(input.trim(), { header: true, skipEmptyLines: true });
  if (parsed.errors.length) {
    throw new Error(`Could not parse CSV: ${parsed.errors[0].message}`);
  }
  return JSON.stringify(parsed.data, null, 2);
}
```

- [ ] **Step 5: Run, verify pass.** (Fix expected whitespace to papaparse's real output — `\r\n` line endings are its default.)

- [ ] **Step 6: Route** — `src/routes/dev/JsonCsv.tsx`, mirror. directions `j2c` (`'JSON → CSV'`, out `text`, `data.csv`/`text/csv`) and `c2j` (`'CSV → JSON'`, out `json`, `data.json`/`application/json`). Title `"Convert JSON and CSV."` subtitle `"JSON must be an array of objects. Nested values become JSON text in the cell."`.

- [ ] **Step 7: Register + route** — `id: 'dev-json-csv'`, `name: 'JSON ⇄ CSV'`, `description: 'Convert a JSON array to CSV and back'`, `route: '/dev/json-csv'`, `icon: Table`, `kind: 'text'`. `exact tool set` += id. routes.tsx lazy + `dev/json-csv`.

- [ ] **Step 8: Run** relevant tests + typecheck.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json src/services/dev/json-csv.ts src/services/dev/json-csv.test.ts src/routes/dev/JsonCsv.tsx src/tools/registry.ts src/tools/registry.test.ts src/app/routes.tsx
git commit -m "feat(dev): add JSON/CSV converter"
```

---

## Task 12: JSON → TypeScript types tool

**Files:** `src/services/dev/json-ts.ts` + `.test.ts`, `src/routes/dev/JsonTs.tsx`, registry, registry test, routes.

**Interfaces:**
```ts
export function jsonToTs(input: string, rootName?: string): string;   // default rootName 'Root'
```
Throws `Invalid JSON: …`. One-way (no reverse direction).

**Ceiling** (put this as a `// ponytail:` comment at the top of `json-ts.ts`):
```
// ponytail: single-sample inference — primitive unions collapsed, array element
// type from the first element only, nested objects emitted as named interfaces,
// no optional-key detection. Swap for quicktype-core if richer output is needed.
```

- [ ] **Step 1: Failing test** — `src/services/dev/json-ts.test.ts`:

```ts
import { jsonToTs } from './json-ts';

test('primitives and nested object', () => {
  const out = jsonToTs('{"id":1,"name":"x","meta":{"active":true}}');
  expect(out).toContain('interface Root {');
  expect(out).toContain('id: number;');
  expect(out).toContain('name: string;');
  expect(out).toContain('meta: RootMeta;');
  expect(out).toContain('interface RootMeta {');
  expect(out).toContain('active: boolean;');
});
test('array element type from first item', () => {
  expect(jsonToTs('{"tags":["a","b"]}')).toContain('tags: string[];');
});
test('empty array is unknown[]', () => {
  expect(jsonToTs('{"x":[]}')).toContain('x: unknown[];');
});
test('bad json throws', () => {
  expect(() => jsonToTs('{bad')).toThrow(/Invalid JSON/);
});
```

- [ ] **Step 2: Run, verify fail.**

- [ ] **Step 3: Implement** — `src/services/dev/json-ts.ts`:

```ts
// ponytail: single-sample inference — primitive unions collapsed, array element
// type from the first element only, nested objects emitted as named interfaces,
// no optional-key detection. Swap for quicktype-core if richer output is needed.

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

const pascal = (s: string) => s.replace(/(^\w|[-_ ]\w)/g, (m) => m.replace(/[-_ ]/, '').toUpperCase());

export function jsonToTs(input: string, rootName = 'Root'): string {
  let value: Json;
  try {
    value = JSON.parse(input) as Json;
  } catch (e) {
    throw new Error(`Invalid JSON: ${e instanceof Error ? e.message : String(e)}`);
  }

  const interfaces: string[] = [];

  const typeOf = (v: Json, name: string): string => {
    if (v === null) return 'null';
    if (Array.isArray(v)) return v.length ? `${typeOf(v[0], name)}[]` : 'unknown[]';
    switch (typeof v) {
      case 'string': return 'string';
      case 'number': return 'number';
      case 'boolean': return 'boolean';
      case 'object': {
        const lines = Object.entries(v).map(
          ([k, val]) => `  ${/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)}: ${typeOf(val, name + pascal(k))};`,
        );
        interfaces.push(`interface ${name} {\n${lines.join('\n')}\n}`);
        return name;
      }
      default: return 'unknown';
    }
  };

  const rootType = typeOf(value, pascal(rootName));
  if (!interfaces.length) return `type ${pascal(rootName)} = ${rootType};`;
  return interfaces.reverse().join('\n\n');
}
```

- [ ] **Step 4: Run, verify pass.**

- [ ] **Step 5: Route** — `src/routes/dev/JsonTs.tsx`, single direction:
```ts
const directions: Direction[] = [
  { id: 'ts', label: 'JSON → TS',
    transform: (s) => jsonToTs(s),
    inputLanguage: 'json', outputLanguage: 'text',
    downloadName: 'types.ts', downloadType: 'text/plain' },
];
```
Title `"Generate TypeScript types from JSON."` subtitle `"One sample in, interfaces out. Best-effort — check the result."`.

- [ ] **Step 6: Register + route** — `id: 'dev-json-ts'`, `name: 'JSON → TypeScript'`, `description: 'Infer TypeScript interfaces from a JSON sample'`, `route: '/dev/json-ts'`, `icon: FileType`, `kind: 'text'`. `exact tool set` += id. routes.tsx lazy + `dev/json-ts`.

- [ ] **Step 7: Run** relevant tests + typecheck.

- [ ] **Step 8: Commit**

```bash
git add src/services/dev/json-ts.ts src/services/dev/json-ts.test.ts src/routes/dev/JsonTs.tsx src/tools/registry.ts src/tools/registry.test.ts src/app/routes.tsx
git commit -m "feat(dev): add JSON to TypeScript types tool"
```

---

## Task 13: Wire `dev` into navigation + Phase 1 checkpoint

**Files:**
- Modify: `src/app/Sidebar.tsx:7-11`
- Modify: `src/app/CommandPalette.tsx:5`
- Test: `src/app/Sidebar.test.tsx`, `src/app/CommandPalette.test.tsx` (verify still green), full suite

**Interfaces:**
- Consumes: `toolsByCategory('dev')` (returns the 8 Phase-1 tools).
- Produces: `dev` tools visible in the sidebar and command palette.

- [ ] **Step 1: Add the sidebar section**

`src/app/Sidebar.tsx`, in `NAV_SECTIONS`, add after the Privacy entry:
```ts
  { label: 'Developer', tools: () => toolsByCategory('dev') },
```

- [ ] **Step 2: Add to command palette group order**

`src/app/CommandPalette.tsx`:
```ts
const GROUP_ORDER: Category[] = ['pdf', 'image', 'ai', 'dev', 'privacy'];
```

- [ ] **Step 3: Run the shell tests**

Run: `npm test -- src/app/Sidebar.test.tsx src/app/CommandPalette.test.tsx src/app/routes.test.tsx`
Expected: PASS. If `Sidebar.test.tsx` asserts an exact section count or list, update it to include `Developer`.

- [ ] **Step 4: Full checkpoint**

Run each, all must be clean:
```bash
npm run typecheck
npm run lint
npm test
npm run build
```
Expected: typecheck clean; lint clean; all tests pass; build succeeds and emits a separate chunk per `dev/*` route (CodeMirror + js-yaml + papaparse only in those chunks, not in the entry chunk — eyeball the Vite output size table).

- [ ] **Step 5: Commit**

```bash
git add src/app/Sidebar.tsx src/app/CommandPalette.tsx src/app/Sidebar.test.tsx
git commit -m "feat(dev): show Developer tools in sidebar and command palette"
```

- [ ] **Step 6: Update the README tool table**

`README.md` — add the 8 dev tools to the tool table (route + one-line engine note: "native" / "js-yaml" / "papaparse"). Commit:
```bash
git add README.md
git commit -m "docs: list Developer tools in README"
```

---

## Self-Review

**Spec coverage:**
- §2 Phase 1 tools (8) → Tasks 5–12. ✓
- §3.1 category / token / `kind` → Task 1. ✓
- §3.2 pure services + throw contract → every service task. ✓
- §3.3 `CodeEditor` + `SplitTool` → Tasks 3–4. ✓ (`JwtTool`/`DiffTool`/`FieldTool`/`LinesTool` are Phase 2.)
- §3.4 `useDevTransform` → Task 2. ✓
- §3.5 routes + `routes.tsx` + `routes.test.tsx` → each tool task + Task 13. ✓
- §3.6 handoff — text tools ignore it → satisfied by not wiring it (no task needed). ✓
- §5 error handling → per-service throw + `SplitTool` `role="alert"` banner (Task 4). ✓
- §6 testing matrix → service tests, hook test, `CodeEditor` test, `SplitTool` test, `routes.test.tsx` auto-covers routes, `registry.test.ts` invariants (Task 1). a11y extension is Phase 2 (one dev route). ✓
- §7 deps → installed in Tasks 3 (CodeMirror), 6 (js-yaml), 11 (papaparse). ✓
- §8 phasing → this plan is Phase 1. ✓

**Placeholder scan:** Tasks 8–12 route components are described as "mirror JsonYaml.tsx" with the exact `directions` array and header text given — the engineer has the full `directions` literal and the one-line differences, and Task 6 Step 6 shows the complete file. Acceptable (not a bare "similar to Task N": the differing content is spelled out).

**Type consistency:** `Direction` fields (`id`, `label`, `transform`, `inputLanguage`, `outputLanguage`, `downloadName`, `downloadType`) are identical across Tasks 4–12. `EditorLanguage` = `'json' | 'yaml' | 'text'` consistent between `cmSetup.ts`, `CodeEditor`, and `Direction`. Service function names match their route imports. `useDevTransform` signature stable.

**Known adjustment points flagged in-task:** exact whitespace of `js-yaml` / `papaparse` / `URLSearchParams` output — tests say "copy the real output into the expectation." `Segmented` prop shape — Task 4 Step 4 says adapt to its real signature.
