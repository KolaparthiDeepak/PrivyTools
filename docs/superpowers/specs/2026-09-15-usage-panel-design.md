# PrivyTools — Local Usage Panel

**Status:** Approved design
**Date:** 2026-09-15
**Builds on:** `2026-08-29-privytools-dashboard-design.md`, `2026-09-09-dev-tools-design.md`, `2026-09-15-home-sidebar-polish-design.md`

## 1. Goal

Let a user see how much they've used PrivyTools — total actions completed and a
per-tool breakdown — entirely on-device, gated behind the existing (currently
dormant) `telemetry` preference. Today `telemetry: boolean` exists in
`src/store/prefs.store.ts`, defaults to `false`, and is wired to nothing: turning
it on has no effect, and `PrivacyBoard.tsx` already displays it as "Off — nothing
about your files is collected." This spec gives that toggle a real, honest
meaning: when on, the app counts completed tool actions locally; when off, it
counts nothing and shows nothing.

## 2. Scope

### In scope
- `src/store/usage.store.ts` — new persisted store: `counts: Record<toolId, number>`, `increment`, `clear`.
- `src/hooks/useTrackToolUsage.ts` — new hook: increments a tool's count once per mount, the first time an action succeeds, only while `telemetry` is on.
- `src/hooks/useToolRunner.ts` — gains an optional 3rd parameter, `toolId?: string`, used only to call the tracking hook on success (`step === 'result'`). No other behavior changes.
- `src/hooks/useDevTransform.ts` — gains an optional `toolId` field in its `opts` object, used only to call the tracking hook on success (`output !== null && error === null`). No other behavior changes.
- `src/components/dev/SplitTool.tsx`, `src/components/dev/FieldTool.tsx` — gain a required `toolId: string` prop, forwarded into their internal `useDevTransform` call.
- `src/components/dev/JwtTool.tsx`, `src/components/dev/DiffTool.tsx`, `src/components/dev/LinesTool.tsx` — each calls the tracking hook directly with its own hardcoded tool id (each is rendered by exactly one route; no prop needed).
- Every route that calls `useToolRunner` (7 file tools) or renders `SplitTool`/`FieldTool` (12 dev tools) passes its already-in-scope `tool.id` through.
- `src/components/privacy/UsagePanel.tsx` — new component, rendered in `src/routes/Privacy.tsx` below the existing `PrivacyBoard`.

### Out of scope
- No change to what `telemetry` copy says elsewhere, beyond making it true.
- No network calls, ever — this is 100% local `localStorage`, matching every other pref in the app.
- No time-series / rolling window (spec decision: all-time counts + manual clear only).
- No per-file or per-input-content data of any kind — only a tool id and a count. Never what was typed, converted, or processed.
- No change to `JwtTool`/`DiffTool`/`LinesTool`/`SplitTool`/`FieldTool`'s existing visual behavior — tracking is a pure side effect, invisible to the user except via the new panel.
- No visit/page-view counting — only counts a *successful* action (see §3.2 for what "successful" means per tool family). Considered and rejected in favor of the more expensive but more meaningful signal (see design discussion; the file-count cost was made explicit and accepted).

## 3. Architecture

### 3.1 `usage.store.ts`

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UsageState {
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

A separate store from `prefs.store.ts` (different concern, different lifecycle —
`clear()` here never touches favourites/theme/etc).

### 3.2 `useTrackToolUsage`

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

Counts **at most once per component mount** — the `counted` ref means retyping,
re-running, or producing a second successful result in the same visit does not
inflate the count. A fresh mount (leaving the tool and coming back) is a fresh
chance to count once. This is deliberate: "how many times did you use this
tool" reads as "how many separate times you got value from it," not "how many
keystrokes triggered a debounced success."

"Succeeded" per tool family:

| Family | Signal | Where computed |
|---|---|---|
| File tools (`useToolRunner`) | `step === 'result'` | Already exists — just threaded to the hook. |
| `SplitTool` / `FieldTool` (`useDevTransform`) | `output !== null && error === null` | Already exists — just threaded to the hook. |
| `JwtTool` | `result.data !== null` (a token decoded without error) | Already exists — just threaded to the hook. |
| `DiffTool` | `lines.length > 0` (either input has content) | Already exists — just threaded to the hook. |
| `LinesTool` | `input !== ''` (processing never throws; non-empty input is the closest thing to a completion signal) | Already exists — just threaded to the hook. |

### 3.3 Hook signature changes

`src/hooks/useToolRunner.ts`:
```ts
export function useToolRunner<C>(service: ToolService<C>, initialConfig: C, toolId?: string) {
  // ...unchanged internals...
  useTrackToolUsage(toolId, step === 'result');
  return { /* unchanged */ };
}
```
`toolId` is optional so every existing `useToolRunner` unit test (which doesn't
pass one) keeps working unmodified — tracking simply no-ops when absent.

`src/hooks/useDevTransform.ts`:
```ts
export function useDevTransform<T>(
  fn: (input: string) => T,
  input: string,
  opts: { debounceMs?: number; toolId?: string } = {},
): Result<T> {
  // ...unchanged internals...
  useTrackToolUsage(opts.toolId, state.output !== null && state.error === null);
  return state;
}
```
Same optionality reasoning.

### 3.4 Component + route wiring

`SplitTool`/`FieldTool` gain a required `toolId: string` prop (required, not
optional — every real call site always has a known tool, so making it optional
would only hide a forgotten wire-up as a silently-untracked tool instead of a
type error):

```ts
interface SplitToolProps {
  toolId: string;
  directions: Direction[];
  // ...unchanged...
}
```
Internally: `useDevTransform(dir.transform, input, { toolId })`.

Each of the 12 consuming dev routes adds one prop to its existing
`<SplitTool .../>` / `<FieldTool .../>` call: `toolId={tool.id}` — `tool` is
already defined at module scope in every route file (`const tool =
getTool('dev-json-yaml')!;`).

Each of the 7 file-tool routes adds one argument to its existing
`useToolRunner(service, config)` call: `useToolRunner(service, config, tool.id)`.

`JwtTool.tsx`/`DiffTool.tsx`/`LinesTool.tsx` each call
`useTrackToolUsage('dev-jwt', ...)` / `useTrackToolUsage('dev-diff', ...)` /
`useTrackToolUsage('dev-lines', ...)` directly — no prop, no route touch,
since each is rendered by exactly one route today.

### 3.5 `UsagePanel`

Rendered in `Privacy.tsx`, below `PrivacyBoard`:

```tsx
export function UsagePanel() {
  const telemetry = usePrefs((s) => s.telemetry);
  const counts = useUsage((s) => s.counts);
  const clear = useUsage((s) => s.clear);

  if (!telemetry) {
    return (
      <div className="rounded-lg border border-border p-4 text-xs text-dim">
        Turn on Telemetry above to start counting local tool usage. Nothing is
        counted while it's off.
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
            <div key={r.tool.id} className="flex items-center gap-3 border-b border-border p-3 text-xs last:border-b-0">
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

`r.tool !== undefined` guards a persisted id whose tool no longer exists (a
future tool rename/removal) — that row is silently dropped rather than
crashing or showing a blank name. Exact class names/layout are an
implementation-time detail — match `PrivacyBoard`'s existing visual language
(the plan will pin exact Tailwind classes).

## 4. Data flow

```
user completes an action in tool X
  → useToolRunner/useDevTransform/JwtTool/DiffTool/LinesTool computes success
  → useTrackToolUsage(toolId, true) fires (once per mount)
      → if telemetry off: no-op
      → if telemetry on: useUsage.increment(toolId) → counts[toolId]++ → persisted to localStorage
user opens /privacy
  → UsagePanel reads useUsage(counts) + usePrefs(telemetry)
  → renders total + per-tool breakdown, or the "turn on Telemetry" message
user clicks "Clear usage data"
  → useUsage.clear() → counts = {} → persisted
```

No new state crosses component boundaries beyond the two Zustand stores
(already the app's established pattern for `prefs.store.ts`). No new
localStorage keys beyond `privytools:usage`, holding only `{toolId: number}`
pairs — never file names, file contents, or input text.

## 5. Error handling

None needed — no async operations, no I/O beyond `localStorage` (which Zustand's
`persist` middleware already handles defensively for the rest of the app). The
one edge case (a persisted count for a since-removed tool id) is handled by
filtering it out in `UsagePanel`, not by throwing.

## 6. Testing

| Layer | Test |
|---|---|
| `usage.store.test.ts` | `increment` accumulates per id; `clear` resets to `{}`. |
| `useTrackToolUsage.test.tsx` | Fires `increment` once when `succeeded` goes true + telemetry on; never fires when telemetry off; doesn't fire a second time on a second `succeeded=true` render within the same mount. |
| `useToolRunner.test.tsx` | One new test: passing a `toolId` and reaching `step==='result'` calls the tracking path (mock `useUsage`/`usePrefs` or assert via a real store + telemetry-on setup). Existing tests (no `toolId` passed) stay green unmodified. |
| `useDevTransform.test.tsx` | Same shape, one new test. |
| `UsagePanel.test.tsx` | Renders counts + total when telemetry on; renders the off-message when telemetry off; Clear button empties the list. |
| One end-to-end sanity check per family | One file-tool route (e.g. `PdfMerge`) and one `SplitTool`-based dev route (e.g. `JsonYaml`) each get one test: complete the action with telemetry on, assert the usage store incremented for that tool's id. Not duplicated across all 19 wired routes — the wiring is mechanical and the shared-hook tests already cover the logic; these two catch a wiring mistake in the pattern itself. |

No new component visual/snapshot tests beyond what's listed — `UsagePanel`'s
styling follows existing `PrivacyBoard` conventions, not independently
pixel-tested.

## 7. Open questions

None blocking. Exact panel copy/spacing is an implementation-time choice,
matching `PrivacyBoard`'s existing visual language.
