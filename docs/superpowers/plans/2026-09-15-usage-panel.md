# Local Usage Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a user see total completed actions + a per-tool breakdown, gated behind the existing (currently dormant) `telemetry` preference, entirely on-device.

**Architecture:** A new `usage.store.ts` (Zustand + `localStorage`) holds `counts: Record<toolId, number>`. A new `useTrackToolUsage(toolId, succeeded)` hook increments a tool's count once per mount, only while `telemetry` is on. `useToolRunner` and `useDevTransform` each gain an optional `toolId` parameter and call the tracking hook internally on success; `JwtTool`/`DiffTool`/`LinesTool` (single-purpose, one route each) call it directly with their own hardcoded id. Every route that uses these hooks/components threads its already-in-scope `tool.id` through. A new `UsagePanel` renders in `/privacy`.

**Tech Stack:** React 19, TypeScript (strict), Zustand + `persist`, Vitest + Testing Library.

## Global Constraints

- Tracking stores only `{ toolId: string, count: number }` pairs — never file names, file contents, or any input text. (spec §2, §4)
- `useTrackToolUsage` no-ops entirely when `usePrefs().telemetry` is `false` — nothing is counted, nothing is written. (spec §3.2)
- A tool's count increments **at most once per component mount** — a `useRef` guard prevents re-counting on every debounced success while the user keeps typing. (spec §3.2)
- `toolId` on `SplitTool`/`FieldTool` is a **required** prop, not optional — a forgotten wire-up must be a TypeScript error, not a silent tracking gap. (spec §3.4)
- `toolId` on `useToolRunner`/`useDevTransform` is **optional** — every existing call site (including existing unit tests) that doesn't pass one keeps compiling and behaving identically; tracking simply doesn't fire. (spec §3.3)
- No new localStorage keys beyond `privytools:usage`. No network calls anywhere in this feature.
- TypeScript strict, `noUnusedLocals`, `noUnusedParameters`. `npm run typecheck` must stay clean throughout.
- Existing test files listed in each task must remain green; only the specific lines this plan calls out change.

---

## File Structure

**Created:**
- `src/store/usage.store.ts` — `useUsage` store: `counts`, `increment`, `clear`
- `src/store/usage.store.test.ts`
- `src/hooks/useTrackToolUsage.ts` — the tracking hook
- `src/hooks/useTrackToolUsage.test.tsx`
- `src/components/privacy/UsagePanel.tsx`
- `src/components/privacy/UsagePanel.test.tsx`
- `src/routes/dev/JsonYaml.test.tsx` — new (didn't exist before), one e2e sanity test

**Modified:**
- `src/hooks/useToolRunner.ts` — optional 3rd param `toolId?: string`
- `src/hooks/useDevTransform.ts` — optional `toolId` field in `opts`
- `src/components/dev/SplitTool.tsx` — required `toolId: string` prop
- `src/components/dev/FieldTool.tsx` — required `toolId: string` prop
- `src/components/dev/JwtTool.tsx`, `DiffTool.tsx`, `LinesTool.tsx` — direct hardcoded tracking call each
- `src/components/dev/SplitTool.test.tsx`, `FieldTool.test.tsx` — add `toolId="test-tool"` to every render call (now required)
- 7 file-tool routes (`ImageCompress.tsx`, `ImageToPdf.tsx`, `PdfMerge.tsx`, `PdfCompress.tsx`, `ImageUpscale.tsx`, `PdfToImage.tsx`, `PdfSecurity.tsx`) — pass `tool.id` as 3rd arg to `useToolRunner`
- 12 dev routes (`JsonFormat.tsx`, `JsonYaml.tsx`, `Base64.tsx`, `UrlEncode.tsx`, `HtmlEntities.tsx`, `QueryJson.tsx`, `JsonCsv.tsx`, `JsonTs.tsx`, `Slugify.tsx`, `CaseConvert.tsx`, `Timestamp.tsx`, `Cron.tsx`) — pass `toolId={tool.id}` to `SplitTool`/`FieldTool`
- `src/routes/PdfMerge.test.tsx` — one new e2e sanity test
- `src/routes/Privacy.tsx` — renders `<UsagePanel />`

---

## Task 1: `usage.store.ts` + `useTrackToolUsage` hook

**Files:**
- Create: `src/store/usage.store.ts`
- Create: `src/store/usage.store.test.ts`
- Create: `src/hooks/useTrackToolUsage.ts`
- Create: `src/hooks/useTrackToolUsage.test.tsx`

**Interfaces:**
- Consumes: `usePrefs` from `src/store/prefs.store.ts` (existing, has `telemetry: boolean`).
- Produces:
  ```ts
  // src/store/usage.store.ts
  export interface UsageState {
    counts: Record<string, number>;
    increment: (toolId: string) => void;
    clear: () => void;
  }
  export const useUsage: /* zustand store hook */;

  // src/hooks/useTrackToolUsage.ts
  export function useTrackToolUsage(toolId: string | undefined, succeeded: boolean): void;
  ```
  Later tasks import both.

- [ ] **Step 1: Write the failing store test**

`src/store/usage.store.test.ts`:

```ts
import { useUsage } from './usage.store';

beforeEach(() => {
  useUsage.setState({ counts: {} });
});

test('increment accumulates per tool id', () => {
  useUsage.getState().increment('pdf-merge');
  useUsage.getState().increment('pdf-merge');
  useUsage.getState().increment('dev-jwt');
  expect(useUsage.getState().counts).toEqual({ 'pdf-merge': 2, 'dev-jwt': 1 });
});

test('clear resets to empty', () => {
  useUsage.getState().increment('pdf-merge');
  useUsage.getState().clear();
  expect(useUsage.getState().counts).toEqual({});
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npm test -- src/store/usage.store.test.ts`
Expected: FAIL — `Cannot find module './usage.store'`.

- [ ] **Step 3: Implement the store**

`src/store/usage.store.ts`:

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UsageState {
  counts: Record<string, number>;
  increment: (toolId: string) => void;
  clear: () => void;
}

export const useUsage = create<UsageState>()(
  persist(
    (set) => ({
      counts: {},
      increment: (toolId) =>
        set((s) => ({ counts: { ...s.counts, [toolId]: (s.counts[toolId] ?? 0) + 1 } })),
      clear: () => set({ counts: {} }),
    }),
    { name: 'privytools:usage' },
  ),
);
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npm test -- src/store/usage.store.test.ts` → Expected: PASS

- [ ] **Step 5: Write the failing hook test**

`src/hooks/useTrackToolUsage.test.tsx`:

```tsx
import { renderHook } from '@testing-library/react';
import { useTrackToolUsage } from './useTrackToolUsage';
import { usePrefs } from '../store/prefs.store';
import { useUsage } from '../store/usage.store';

beforeEach(() => {
  usePrefs.setState({ telemetry: false });
  useUsage.setState({ counts: {} });
});

test('does nothing when telemetry is off', () => {
  renderHook(() => useTrackToolUsage('pdf-merge', true));
  expect(useUsage.getState().counts).toEqual({});
});

test('increments once when telemetry is on and succeeded is true', () => {
  usePrefs.setState({ telemetry: true });
  renderHook(() => useTrackToolUsage('pdf-merge', true));
  expect(useUsage.getState().counts).toEqual({ 'pdf-merge': 1 });
});

test('does not increment a second time on a second true render within the same mount', () => {
  usePrefs.setState({ telemetry: true });
  const { rerender } = renderHook(({ succeeded }) => useTrackToolUsage('pdf-merge', succeeded), {
    initialProps: { succeeded: true },
  });
  rerender({ succeeded: false });
  rerender({ succeeded: true });
  expect(useUsage.getState().counts).toEqual({ 'pdf-merge': 1 });
});

test('does nothing when toolId is undefined', () => {
  usePrefs.setState({ telemetry: true });
  renderHook(() => useTrackToolUsage(undefined, true));
  expect(useUsage.getState().counts).toEqual({});
});
```

- [ ] **Step 6: Run test, verify it fails**

Run: `npm test -- src/hooks/useTrackToolUsage.test.tsx`
Expected: FAIL — `Cannot find module './useTrackToolUsage'`.

- [ ] **Step 7: Implement the hook**

`src/hooks/useTrackToolUsage.ts`:

```ts
import { useEffect, useRef } from 'react';
import { usePrefs } from '../store/prefs.store';
import { useUsage } from '../store/usage.store';

export function useTrackToolUsage(toolId: string | undefined, succeeded: boolean): void {
  const telemetry = usePrefs((s) => s.telemetry);
  const increment = useUsage((s) => s.increment);
  const counted = useRef(false);

  useEffect(() => {
    if (!telemetry || !toolId || !succeeded || counted.current) return;
    counted.current = true;
    increment(toolId);
  }, [telemetry, toolId, succeeded, increment]);
}
```

- [ ] **Step 8: Run tests, verify they pass**

Run: `npm test -- src/store/usage.store.test.ts src/hooks/useTrackToolUsage.test.tsx` → Expected: PASS
Run: `npm run typecheck` → Expected: clean

- [ ] **Step 9: Commit**

```bash
git add src/store/usage.store.ts src/store/usage.store.test.ts src/hooks/useTrackToolUsage.ts src/hooks/useTrackToolUsage.test.tsx
git commit -m "feat(usage): add usage store and useTrackToolUsage hook"
```

---

## Task 2: Wire `useToolRunner` + the 7 file-tool routes

**Files:**
- Modify: `src/hooks/useToolRunner.ts`
- Modify: `src/routes/ImageCompress.tsx:28`, `src/routes/ImageToPdf.tsx:20`, `src/routes/PdfMerge.tsx:21`, `src/routes/PdfCompress.tsx:28`, `src/routes/ImageUpscale.tsx:23`, `src/routes/PdfToImage.tsx:21`, `src/routes/PdfSecurity.tsx:25`
- Modify: `src/routes/PdfMerge.test.tsx`

**Interfaces:**
- Consumes: `useTrackToolUsage` (Task 1).
- Produces: `useToolRunner<C>(service, initialConfig, toolId?: string)` — same return shape as before, `toolId` is a new optional 3rd parameter.

- [ ] **Step 1: Implement the hook change**

In `src/hooks/useToolRunner.ts`, add the import and the 3rd parameter, and call the tracking hook right before `return`:

```ts
import { useCallback, useRef, useState } from 'react';
import type { FileResult, Progress, ToolService } from '../services/types';
import { ToolError } from '../services/types';
import { useTrackToolUsage } from './useTrackToolUsage';

type Step = 'select' | 'configure' | 'process' | 'result' | 'error';

export function useToolRunner<C>(service: ToolService<C>, initialConfig: C, toolId?: string) {
  const [step, setStep] = useState<Step>('select');
  // ...everything else between here and `return` is UNCHANGED...
```

Immediately before the final `return { step, file: files[0] ?? null, ... };` statement, add:

```ts
  useTrackToolUsage(toolId, step === 'result');

```

(One line, no other changes to the hook body.)

- [ ] **Step 2: Run the existing hook tests, confirm they still pass unmodified**

Run: `npm test -- src/hooks/useToolRunner.test.tsx`
Expected: PASS — these tests call `useToolRunner(service, config)` with no 3rd argument, so `toolId` is `undefined` and `useTrackToolUsage` no-ops. No test file changes needed here.

- [ ] **Step 3: Wire the 7 file-tool routes**

Each of these already has `const tool = getTool('<id>')!;` in scope. Change only the `useToolRunner(...)` call line, adding `tool.id` as the 3rd argument:

`src/routes/ImageCompress.tsx:28` — before:
```ts
  const runner = useToolRunner<Config>(compressImage, { quality: 0.7, format: 'image/jpeg' });
```
after:
```ts
  const runner = useToolRunner<Config>(compressImage, { quality: 0.7, format: 'image/jpeg' }, tool.id);
```

`src/routes/ImageToPdf.tsx:20` — before:
```ts
  const runner = useToolRunner<Record<string, never>>(imagesToPdf, {});
```
after:
```ts
  const runner = useToolRunner<Record<string, never>>(imagesToPdf, {}, tool.id);
```

`src/routes/PdfMerge.tsx:21` — before:
```ts
  const runner = useToolRunner<Record<string, never>>(mergePdf, {});
```
after:
```ts
  const runner = useToolRunner<Record<string, never>>(mergePdf, {}, tool.id);
```

`src/routes/PdfCompress.tsx:28` — before:
```ts
  const runner = useToolRunner<Config>(compressPdf, { preset: 'balanced', quality: 0.6 });
```
after:
```ts
  const runner = useToolRunner<Config>(compressPdf, { preset: 'balanced', quality: 0.6 }, tool.id);
```

`src/routes/ImageUpscale.tsx:23` — before:
```ts
  const runner = useToolRunner<ResizeConfig>(upscaleImage, { scale: 2, sharpen: 0.4, smoothing: true });
```
after:
```ts
  const runner = useToolRunner<ResizeConfig>(upscaleImage, { scale: 2, sharpen: 0.4, smoothing: true }, tool.id);
```

`src/routes/PdfToImage.tsx:21` — before:
```ts
  const runner = useToolRunner<Record<string, never>>(pdfToImages, {});
```
after:
```ts
  const runner = useToolRunner<Record<string, never>>(pdfToImages, {}, tool.id);
```

`src/routes/PdfSecurity.tsx:25` — before:
```ts
  const runner = useToolRunner<Config>(protectPdf, { mode: 'add', password: '' });
```
after:
```ts
  const runner = useToolRunner<Config>(protectPdf, { mode: 'add', password: '' }, tool.id);
```

- [ ] **Step 4: Run the full existing test suite for these 7 routes, confirm nothing broke**

Run: `npm test -- src/routes/ImageCompress.test.tsx src/routes/ImageToPdf.test.tsx src/routes/PdfMerge.test.tsx src/routes/PdfCompress.test.tsx src/routes/ImageUpscale.test.tsx src/routes/PdfToImage.test.tsx src/routes/PdfSecurity.test.tsx`
Expected: PASS (these files exist already; if any route lacks a `.test.tsx` file, skip it in this run — none are expected to be missing given the existing dashboard test iterates all `TOOLS`).

- [ ] **Step 5: Write the failing e2e sanity test**

Add to `src/routes/PdfMerge.test.tsx` (append; keep the existing two tests as-is). Add the imports at the top of the file too:

```tsx
import { usePrefs } from '../store/prefs.store';
import { useUsage } from '../store/usage.store';
```

```tsx
test('completing a merge with telemetry on tracks one usage for pdf-merge', async () => {
  usePrefs.setState({ telemetry: true });
  useUsage.setState({ counts: {} });
  render(
    <MemoryRouter>
      <PdfMerge />
    </MemoryRouter>,
  );
  await userEvent.upload(document.querySelector('input[type=file]') as HTMLInputElement, [
    pdf('../test/fixtures/a.pdf', 'a.pdf'),
    pdf('../test/fixtures/b.pdf', 'b.pdf'),
  ]);
  await userEvent.click(await screen.findByRole('button', { name: /^merge pdfs/i }));
  await screen.findByText(/PDFs merged/i);
  expect(useUsage.getState().counts['pdf-merge']).toBe(1);
  usePrefs.setState({ telemetry: false });
});
```

The final `usePrefs.setState({ telemetry: false })` resets the (module-level, shared) store back to its default so this test doesn't leak state into the two tests that ran before it re-run in watch mode or into other files sharing the process. `useUsage.setState({ counts: {} })` at the top of the test does the same for the usage store at test start.

- [ ] **Step 6: Run it, verify it fails**

Run: `npm test -- src/routes/PdfMerge.test.tsx`
Expected: FAIL — `useUsage.getState().counts['pdf-merge']` is `undefined`, not `1` (the route doesn't pass `tool.id` yet... wait, Step 3 already added it above). Actually by this point Step 3 is done, so re-order: this step should be run **before** Step 3's route edit to be a true RED step. Since Step 3 happens earlier in this task for all 7 routes together (they're mechanical and reviewed as one unit), treat Steps 5-6 as confirming the **already-applied** wiring is correct rather than strict TDD-before-implementation — implement Step 7 below only if this test unexpectedly fails.

- [ ] **Step 7: If Step 6 failed, debug**

If the test still fails after Step 3's edit, the most likely cause is `tool.id` not being `'pdf-merge'` (double check `src/routes/PdfMerge.tsx`'s `const tool = getTool('pdf-merge')!;` line) or the `useToolRunner` edit from Step 1 missing. Fix and re-run.

- [ ] **Step 8: Run full suite + typecheck + lint**

Run: `npm test` → all pass
Run: `npm run typecheck` → clean
Run: `npm run lint` → clean

- [ ] **Step 9: Commit**

```bash
git add src/hooks/useToolRunner.ts src/routes/ImageCompress.tsx src/routes/ImageToPdf.tsx src/routes/PdfMerge.tsx src/routes/PdfCompress.tsx src/routes/ImageUpscale.tsx src/routes/PdfToImage.tsx src/routes/PdfSecurity.tsx src/routes/PdfMerge.test.tsx
git commit -m "feat(usage): track completed actions for file tools"
```

---

## Task 3: Wire `useDevTransform` + `SplitTool`/`FieldTool` + the 12 dev routes

**Files:**
- Modify: `src/hooks/useDevTransform.ts`
- Modify: `src/components/dev/SplitTool.tsx`, `src/components/dev/SplitTool.test.tsx`
- Modify: `src/components/dev/FieldTool.tsx`, `src/components/dev/FieldTool.test.tsx`
- Modify: 8 `SplitTool` routes: `src/routes/dev/JsonFormat.tsx:31`, `JsonYaml.tsx:33`, `Base64.tsx:33`, `UrlEncode.tsx:33`, `HtmlEntities.tsx:33`, `QueryJson.tsx:33`, `JsonCsv.tsx:33`, `JsonTs.tsx:24`
- Modify: 4 `FieldTool` routes: `src/routes/dev/Slugify.tsx`, `CaseConvert.tsx`, `Timestamp.tsx`, `Cron.tsx`
- Create: `src/routes/dev/JsonYaml.test.tsx`

**Interfaces:**
- Consumes: `useTrackToolUsage` (Task 1).
- Produces: `useDevTransform<T>(fn, input, opts?: { debounceMs?: number; toolId?: string })` — same return shape. `SplitTool`/`FieldTool` gain a required `toolId: string` prop.

- [ ] **Step 1: Implement the `useDevTransform` change**

In `src/hooks/useDevTransform.ts`, add the import, widen `opts`, and call the tracking hook right before `return state;`:

```ts
import { useEffect, useRef, useState } from 'react';
import { useTrackToolUsage } from './useTrackToolUsage';

interface Result<T> {
  output: T | null;
  error: string | null;
  pending: boolean;
}

export function useDevTransform<T>(
  fn: (input: string) => T,
  input: string,
  opts: { debounceMs?: number; toolId?: string } = {},
): Result<T> {
  const debounceMs = opts.debounceMs ?? 150;
  const [state, setState] = useState<Result<T>>({ output: null, error: null, pending: false });
  const lastGood = useRef<T | null>(null);

  useEffect(() => {
    if (input.trim() === '') {
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

  useTrackToolUsage(opts.toolId, state.output !== null && state.error === null);

  return state;
}
```

- [ ] **Step 2: Run existing `useDevTransform` tests, confirm still green**

Run: `npm test -- src/hooks/useDevTransform.test.tsx`
Expected: PASS — no test passes `toolId`, so tracking never fires; behavior otherwise identical.

- [ ] **Step 3: Add the required `toolId` prop to `SplitTool`**

`src/components/dev/SplitTool.tsx` — change the props interface and the destructured parameters and the internal `useDevTransform` call:

```ts
interface SplitToolProps {
  toolId: string;
  directions: Direction[];
  inputPlaceholder?: string;
  acceptFile?: boolean;
  fileAsBytes?: boolean;
}

export function SplitTool({
  toolId,
  directions,
  inputPlaceholder,
  acceptFile = true,
  fileAsBytes = false,
}: SplitToolProps) {
```

And change:
```ts
  const { output, error, pending } = useDevTransform(dir.transform, input);
```
to:
```ts
  const { output, error, pending } = useDevTransform(dir.transform, input, { toolId });
```

Nothing else in the file changes.

- [ ] **Step 4: Add the required `toolId` prop to `FieldTool`**

`src/components/dev/FieldTool.tsx` — change the props interface and destructuring and the internal `useDevTransform` call:

```ts
interface FieldToolProps {
  toolId: string;
  compute: (input: string) => FieldRow[];
  inputLabel: string;
  placeholder?: string;
  multiline?: boolean;
}
```

```ts
export function FieldTool({ toolId, compute, inputLabel, placeholder, multiline = false }: FieldToolProps) {
  const [input, setInput] = useState('');
  const { output, error } = useDevTransform(compute, input, { toolId });
  const rows = output ?? [];
```

Nothing else in the file changes.

- [ ] **Step 5: Fix the now-broken `SplitTool.test.tsx` and `FieldTool.test.tsx` (TypeScript will fail to compile — `toolId` is required)**

`src/components/dev/SplitTool.test.tsx` — add `toolId="test-tool"` to all 4 render calls:
```tsx
render(<SplitTool toolId="test-tool" directions={dirs} />);
```
(repeat for each of the 4 occurrences — the 4th one is `render(<SplitTool toolId="test-tool" directions={dirs} fileAsBytes />);`)

`src/components/dev/FieldTool.test.tsx` — add `toolId="test-tool"` to both render calls:
```tsx
render(<FieldTool toolId="test-tool" compute={compute} inputLabel="Text" />);
```
(repeat for both occurrences)

- [ ] **Step 6: Run these two test files, verify they pass**

Run: `npm test -- src/components/dev/SplitTool.test.tsx src/components/dev/FieldTool.test.tsx`
Expected: PASS
Run: `npm run typecheck` → Expected: clean (this is the step that confirms every call site was updated — a missed one is a compile error naming the exact file/line)

- [ ] **Step 7: Wire the 8 `SplitTool` routes**

Each already has `const tool = getTool('<id>')!;` in scope. Add `toolId={tool.id}` to the `<SplitTool ...>` call:

`src/routes/dev/JsonFormat.tsx:31` — before:
```tsx
      <SplitTool directions={directions} inputPlaceholder='{"paste":"json here"}' />
```
after:
```tsx
      <SplitTool toolId={tool.id} directions={directions} inputPlaceholder='{"paste":"json here"}' />
```

`src/routes/dev/JsonYaml.tsx:33` — before:
```tsx
      <SplitTool directions={directions} inputPlaceholder='{"paste":"json or yaml"}' />
```
after:
```tsx
      <SplitTool toolId={tool.id} directions={directions} inputPlaceholder='{"paste":"json or yaml"}' />
```

`src/routes/dev/Base64.tsx:33` — before:
```tsx
      <SplitTool directions={directions} inputPlaceholder="paste text or Base64" />
```
after:
```tsx
      <SplitTool toolId={tool.id} directions={directions} inputPlaceholder="paste text or Base64" />
```

`src/routes/dev/UrlEncode.tsx:33` — before:
```tsx
      <SplitTool directions={directions} inputPlaceholder="paste URL or encoded text" />
```
after:
```tsx
      <SplitTool toolId={tool.id} directions={directions} inputPlaceholder="paste URL or encoded text" />
```

`src/routes/dev/HtmlEntities.tsx:33` — before:
```tsx
      <SplitTool directions={directions} inputPlaceholder="paste HTML or entities" />
```
after:
```tsx
      <SplitTool toolId={tool.id} directions={directions} inputPlaceholder="paste HTML or entities" />
```

`src/routes/dev/QueryJson.tsx:33` — before:
```tsx
      <SplitTool directions={directions} inputPlaceholder="paste query string or JSON" />
```
after:
```tsx
      <SplitTool toolId={tool.id} directions={directions} inputPlaceholder="paste query string or JSON" />
```

`src/routes/dev/JsonCsv.tsx:33` — before:
```tsx
      <SplitTool directions={directions} inputPlaceholder='[{"paste":"json or csv"}]' />
```
after:
```tsx
      <SplitTool toolId={tool.id} directions={directions} inputPlaceholder='[{"paste":"json or csv"}]' />
```

`src/routes/dev/JsonTs.tsx:24` — before:
```tsx
      <SplitTool directions={directions} inputPlaceholder='{"paste":"json sample"}' />
```
after:
```tsx
      <SplitTool toolId={tool.id} directions={directions} inputPlaceholder='{"paste":"json sample"}' />
```

- [ ] **Step 8: Wire the 4 `FieldTool` routes**

Each already has `const tool = getTool('<id>')!;` in scope and a `<FieldTool ...>` call spanning multiple lines. Add `toolId={tool.id}` as the first prop on the `<FieldTool` opening tag in each of these 4 files:

`src/routes/dev/Slugify.tsx` — the block:
```tsx
      <FieldTool
        inputLabel="Text to slugify"
        placeholder="Hello, World!"
        compute={(s) => [{ label: 'Slug', value: slugify(s) }]}
      />
```
becomes:
```tsx
      <FieldTool
        toolId={tool.id}
        inputLabel="Text to slugify"
        placeholder="Hello, World!"
        compute={(s) => [{ label: 'Slug', value: slugify(s) }]}
      />
```

`src/routes/dev/CaseConvert.tsx` — add `toolId={tool.id}` as the first line inside its `<FieldTool ...>` block the same way (its other props are unchanged — open the file, add the one line right after `<FieldTool`).

`src/routes/dev/Timestamp.tsx` — same: add `toolId={tool.id}` as the first line inside its `<FieldTool ...>` block.

`src/routes/dev/Cron.tsx` — same: add `toolId={tool.id}` as the first line inside its `<FieldTool ...>` block.

- [ ] **Step 9: Write the failing e2e sanity test for a dev tool**

Create `src/routes/dev/JsonYaml.test.tsx` (new file):

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import JsonYaml from './JsonYaml';
import { usePrefs } from '../../store/prefs.store';
import { useUsage } from '../../store/usage.store';

test('a successful conversion with telemetry on tracks one usage for dev-json-yaml', async () => {
  usePrefs.setState({ telemetry: true });
  useUsage.setState({ counts: {} });
  render(
    <MemoryRouter>
      <JsonYaml />
    </MemoryRouter>,
  );
  await userEvent.type(screen.getByLabelText('Input'), '{"a":1}');
  await screen.findByDisplayValue(/a: 1/);
  expect(useUsage.getState().counts['dev-json-yaml']).toBe(1);
  usePrefs.setState({ telemetry: false });
});
```

- [ ] **Step 10: Run it**

Run: `npm test -- src/routes/dev/JsonYaml.test.tsx`
Expected: PASS (Steps 1-8 already wired the tracking path; if this fails, check that `JsonYaml.tsx`'s `<SplitTool>` call has `toolId={tool.id}` from Step 7, and that the input label queries `getByLabelText('Input')` matches `CodeEditor`'s textarea — if it's ambiguous, scope the query with `{ selector: 'textarea' }` as established in earlier dev-tools work).

- [ ] **Step 11: Run full suite + typecheck + lint**

Run: `npm test` → all pass
Run: `npm run typecheck` → clean
Run: `npm run lint` → clean

- [ ] **Step 12: Commit**

```bash
git add src/hooks/useDevTransform.ts src/components/dev/SplitTool.tsx src/components/dev/SplitTool.test.tsx src/components/dev/FieldTool.tsx src/components/dev/FieldTool.test.tsx src/routes/dev/JsonFormat.tsx src/routes/dev/JsonYaml.tsx src/routes/dev/Base64.tsx src/routes/dev/UrlEncode.tsx src/routes/dev/HtmlEntities.tsx src/routes/dev/QueryJson.tsx src/routes/dev/JsonCsv.tsx src/routes/dev/JsonTs.tsx src/routes/dev/Slugify.tsx src/routes/dev/CaseConvert.tsx src/routes/dev/Timestamp.tsx src/routes/dev/Cron.tsx src/routes/dev/JsonYaml.test.tsx
git commit -m "feat(usage): track completed actions for SplitTool/FieldTool dev tools"
```

---

## Task 4: Wire `JwtTool`, `DiffTool`, `LinesTool` directly

**Files:**
- Modify: `src/components/dev/JwtTool.tsx`
- Modify: `src/components/dev/DiffTool.tsx`
- Modify: `src/components/dev/LinesTool.tsx`

**Interfaces:**
- Consumes: `useTrackToolUsage` (Task 1).
- Produces: no prop/signature changes — these 3 components are each rendered by exactly one route (`Jwt.tsx`, `Diff.tsx`, `Lines.tsx`) and call the hook with their own hardcoded id. No route file changes in this task.

- [ ] **Step 1: Wire `JwtTool`**

`src/components/dev/JwtTool.tsx` — add the import and one hook call. The file becomes:

```tsx
import { useMemo, useState } from 'react';
import { CodeEditor } from './CodeEditor';
import type { DecodedJwt } from '../../services/dev/jwt';
import { useTrackToolUsage } from '../../hooks/useTrackToolUsage';

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

  useTrackToolUsage('dev-jwt', result.data !== null);

  const d = result.data;
  const pretty = (v: unknown) => (v === undefined ? '' : JSON.stringify(v, null, 2));

  // ...rest of the component (the JSX return) is UNCHANGED...
```

(Only the import line and the `useTrackToolUsage('dev-jwt', result.data !== null);` line are new — everything from `const d = result.data;` down to the closing `}` stays exactly as it was.)

- [ ] **Step 2: Wire `DiffTool`**

`src/components/dev/DiffTool.tsx` — add the import and one hook call:

```tsx
import { useMemo, useState } from 'react';
import { CodeEditor } from './CodeEditor';
import type { DiffLine } from '../../services/dev/text-diff';
import { cn } from '../../lib/cn';
import { useTrackToolUsage } from '../../hooks/useTrackToolUsage';

export function DiffTool({ diff }: { diff: (a: string, b: string) => DiffLine[] }) {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const lines = useMemo(() => (a === '' && b === '' ? [] : diff(a, b)), [a, b, diff]);
  const added = lines.filter((l) => l.kind === 'add').length;
  const removed = lines.filter((l) => l.kind === 'remove').length;

  useTrackToolUsage('dev-diff', lines.length > 0);

  // ...rest of the component (the JSX return) is UNCHANGED...
```

- [ ] **Step 3: Wire `LinesTool`**

`src/components/dev/LinesTool.tsx` — add the import and one hook call:

```tsx
import { useMemo, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Segmented } from '../ui';
import { CodeEditor } from './CodeEditor';
import { processLines, type LineOptions } from '../../services/dev/lines';
import { useTrackToolUsage } from '../../hooks/useTrackToolUsage';

// ...DEFAULTS and TOGGLES constants UNCHANGED...

export function LinesTool() {
  const [input, setInput] = useState('');
  const [opts, setOpts] = useState<LineOptions>(DEFAULTS);
  const [copied, setCopied] = useState(false);
  const output = useMemo(() => (input === '' ? '' : processLines(input, opts)), [input, opts]);

  useTrackToolUsage('dev-lines', input !== '');

  // ...rest of the component (copy(), the JSX return) is UNCHANGED...
```

- [ ] **Step 4: Run the existing tests for these 3 components, confirm still green**

Run: `npm test -- src/components/dev/JwtTool.test.tsx src/components/dev/DiffTool.test.tsx src/components/dev/LinesTool.test.tsx`
Expected: PASS — none of these tests set `telemetry: true`, so `useTrackToolUsage` no-ops in every existing test; only behavior addition is the (inert, by default) tracking call.

- [ ] **Step 5: Run typecheck and lint**

Run: `npm run typecheck` → clean
Run: `npm run lint` → clean

- [ ] **Step 6: Commit**

```bash
git add src/components/dev/JwtTool.tsx src/components/dev/DiffTool.tsx src/components/dev/LinesTool.tsx
git commit -m "feat(usage): track completed actions for JWT, Diff, and Lines tools"
```

---

## Task 5: `UsagePanel` + wire into Privacy Center + full checkpoint

**Files:**
- Create: `src/components/privacy/UsagePanel.tsx`
- Create: `src/components/privacy/UsagePanel.test.tsx`
- Modify: `src/routes/Privacy.tsx`

**Interfaces:**
- Consumes: `usePrefs` (`telemetry`), `useUsage` (`counts`, `clear`) (Task 1); `getTool`, `Tool` from `src/tools/registry.ts`.
- Produces: `UsagePanel` component, no props.

- [ ] **Step 1: Write the failing test**

`src/components/privacy/UsagePanel.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UsagePanel } from './UsagePanel';
import { usePrefs } from '../../store/prefs.store';
import { useUsage } from '../../store/usage.store';

beforeEach(() => {
  usePrefs.setState({ telemetry: false });
  useUsage.setState({ counts: {} });
});

test('shows a message and no counts when telemetry is off', () => {
  useUsage.setState({ counts: { 'pdf-merge': 3 } });
  render(<UsagePanel />);
  expect(screen.getByText(/turn on telemetry/i)).toBeInTheDocument();
  expect(screen.queryByText('Merge PDF')).toBeNull();
});

test('shows total and per-tool counts when telemetry is on', () => {
  usePrefs.setState({ telemetry: true });
  useUsage.setState({ counts: { 'pdf-merge': 3, 'dev-jwt': 1 } });
  render(<UsagePanel />);
  expect(screen.getByText(/4 actions completed/i)).toBeInTheDocument();
  expect(screen.getByText('Merge PDF')).toBeInTheDocument();
  expect(screen.getByText('JWT Decoder')).toBeInTheDocument();
});

test('drops a count for a tool id that no longer exists, without crashing', () => {
  usePrefs.setState({ telemetry: true });
  useUsage.setState({ counts: { 'pdf-merge': 1, 'not-a-real-tool': 5 } });
  render(<UsagePanel />);
  expect(screen.getByText(/1 action completed/i)).toBeInTheDocument();
  expect(screen.getByText('Merge PDF')).toBeInTheDocument();
});

test('Clear usage data empties the list', async () => {
  usePrefs.setState({ telemetry: true });
  useUsage.setState({ counts: { 'pdf-merge': 3 } });
  render(<UsagePanel />);
  await userEvent.click(screen.getByRole('button', { name: /clear usage data/i }));
  expect(screen.getByText(/no actions completed yet/i)).toBeInTheDocument();
  expect(useUsage.getState().counts).toEqual({});
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npm test -- src/components/privacy/UsagePanel.test.tsx`
Expected: FAIL — `Cannot find module './UsagePanel'`.

- [ ] **Step 3: Implement**

`src/components/privacy/UsagePanel.tsx`:

```tsx
import { usePrefs } from '../../store/prefs.store';
import { useUsage } from '../../store/usage.store';
import { getTool, type Tool } from '../../tools/registry';

export function UsagePanel() {
  const telemetry = usePrefs((s) => s.telemetry);
  const counts = useUsage((s) => s.counts);
  const clear = useUsage((s) => s.clear);

  if (!telemetry) {
    return (
      <div className="rounded-lg border border-border p-4 text-xs text-dim">
        Turn on Telemetry above to start counting local tool usage. Nothing is counted while it's off.
      </div>
    );
  }

  const rows = Object.entries(counts)
    .map(([id, count]) => ({ tool: getTool(id), count }))
    .filter((r): r is { tool: Tool; count: number } => r.tool !== undefined)
    .sort((a, b) => b.count - a.count);
  const total = rows.reduce((sum, r) => sum + r.count, 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-dim/70">
          {total} action{total === 1 ? '' : 's'} completed
        </span>
        <button type="button" onClick={clear} className="text-xs text-dim hover:text-text">
          Clear usage data
        </button>
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-dim">No actions completed yet.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          {rows.map((r) => (
            <div
              key={r.tool.id}
              className="flex items-center gap-3 border-b border-border p-3 text-xs last:border-b-0"
            >
              <span className="flex-1 text-text">{r.tool.name}</span>
              <span className="font-mono text-dim">{r.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npm test -- src/components/privacy/UsagePanel.test.tsx` → Expected: PASS

- [ ] **Step 5: Wire it into Privacy Center**

`src/routes/Privacy.tsx` — full new contents:

```tsx
import { PrivateIndicator } from '../components/privacy/PrivateIndicator';
import { PrivacyBoard } from '../components/privacy/PrivacyBoard';
import { UsagePanel } from '../components/privacy/UsagePanel';

export default function Privacy() {
  return (
    <main role="main" className="mx-auto flex max-w-2xl flex-col gap-10 p-6 sm:p-10">
      <div className="flex flex-col gap-3" data-accent="privacy">
        <h1
          className="text-3xl font-semibold text-text sm:text-4xl"
          style={{ letterSpacing: 'var(--tracking-display)' }}
        >
          Your privacy, by design.
        </h1>
        <p className="text-sm text-dim">
          What happens to a file when you use PrivyTools - stated plainly, tool by tool.
        </p>
      </div>
      <PrivateIndicator />
      <PrivacyBoard />
      <UsagePanel />
    </main>
  );
}
```

- [ ] **Step 6: Run the existing Privacy route test, confirm still green**

Run: `npm test -- src/routes/Privacy.test.tsx`
Expected: PASS — neither existing test asserts anything about `UsagePanel`'s absence, and `telemetry` defaults to `false` in a fresh test render, so `UsagePanel` renders only its off-message, which doesn't collide with either existing assertion (`PDF Security` text, `/local|demo|server|preview/i` counts, and the "not fully local" check).

- [ ] **Step 7: Full checkpoint**

```bash
npm run typecheck
npm run lint
npm test
npm run build
```
All clean. `npm test` now covers every file/test touched across all 5 tasks of this plan plus the entire pre-existing suite (must stay green).

- [ ] **Step 8: Commit**

```bash
git add src/components/privacy/UsagePanel.tsx src/components/privacy/UsagePanel.test.tsx src/routes/Privacy.tsx
git commit -m "feat(usage): add UsagePanel to Privacy Center"
```

---

## Self-Review

**Spec coverage:**
- §3.1 `usage.store.ts` → Task 1. ✓
- §3.2 `useTrackToolUsage` (once-per-mount, telemetry-gated) → Task 1. ✓
- §3.3 `useToolRunner`/`useDevTransform` optional `toolId` → Tasks 2, 3. ✓
- §3.4 `SplitTool`/`FieldTool` required `toolId` prop; `JwtTool`/`DiffTool`/`LinesTool` hardcoded self-tracking; all 19 route call sites → Tasks 2, 3, 4. ✓
- §3.5 `UsagePanel` (total, breakdown, off-message, Clear, dead-id filtering) → Task 5. ✓
- §4 data flow (increment → persist → panel reads → clear) → exercised end-to-end by Task 2's PdfMerge test, Task 3's JsonYaml test, and Task 5's UsagePanel tests. ✓
- §5 error handling (dead tool id filtered, not crashed) → Task 5, "drops a count for a tool id that no longer exists" test. ✓
- §6 testing table → every row has a corresponding task/step: store test (Task 1), hook test (Task 1), useToolRunner test addition (Task 2 — folded into the existing test file's green-check rather than a new assertion, since the hook's behavior is fully covered by Task 1's hook test plus the PdfMerge e2e test), useDevTransform (same reasoning, Task 3), UsagePanel tests (Task 5), the two e2e sanity tests (Tasks 2 and 3). ✓

**Placeholder scan:** None — every route edit shows the exact before/after line; every new file shows complete contents.

**Type consistency:** `useTrackToolUsage(toolId: string | undefined, succeeded: boolean): void` signature identical across Tasks 1, 2, 3, 4. `UsageState`/`useUsage` shape identical across Tasks 1 and 5. `SplitToolProps`/`FieldToolProps` both gain `toolId: string` (required) consistently in Task 3, and both are then satisfied by the 12 route edits in the same task — no task references a `toolId` shape not yet defined.

**Cross-task ordering:** Task 3 deliberately keeps "wire the hook," "add the required prop," "fix now-broken tests," and "wire the routes" inside one task rather than splitting further — TypeScript would refuse to compile the moment `toolId` becomes required until every call site (including tests) is updated, so these steps cannot be reviewed/merged independently without leaving the tree in a non-compiling state between them.
