# PrivyTools — Developer Tools Suite

**Status:** Approved design
**Date:** 2026-09-09
**Builds on:** `2026-08-29-privytools-dashboard-design.md`, `2026-08-30-image-pdf-conversion-design.md`

## 1. Goal

Add a **Developer** tool category to PrivyTools: everyday text-transform tools a
developer reaches for (JSON⇄YAML, Base64, JWT decode, diff, cron, …). Same
product philosophy as the rest of the suite:

- **On-device only.** No network calls, no analytics, no uploads. Every
  transform runs in the browser.
- **Registry-driven.** A new tool is one `registry.ts` entry + one lazy route.
- **Shared design system.** Reuse existing tokens, `components/ui` primitives,
  theming, command palette, sidebar.

These tools differ from existing tools in *shape*: input is pasted text (or a
small file), output is text to copy (or download). They are synchronous and
need no wasm engine or worker.

## 2. Scope

### In scope

New category `dev` and **15 tools**, delivered in two phases.

**Phase 1 — split-editor converters** (`SplitTool` layout):

| Tool | id | route | Dependency |
|---|---|---|---|
| JSON ⇄ YAML | `dev-json-yaml` | `/dev/json-yaml` | `js-yaml` |
| JSON Formatter (pretty / minify / validate) | `dev-json-format` | `/dev/json-format` | none |
| JSON ⇄ CSV | `dev-json-csv` | `/dev/json-csv` | `papaparse` |
| JSON → TypeScript types | `dev-json-ts` | `/dev/json-ts` | hand-rolled |
| Base64 encode / decode (text + file) | `dev-base64` | `/dev/base64` | none |
| URL encode / decode | `dev-url` | `/dev/url` | none |
| HTML entities encode / decode | `dev-html-entities` | `/dev/html-entities` | none |
| Query string ⇄ JSON | `dev-query-json` | `/dev/query-json` | none |

**Phase 2 — special layouts:**

| Tool | id | route | Layout | Dependency |
|---|---|---|---|---|
| JWT decoder | `dev-jwt` | `/dev/jwt` | `JwtTool` | none |
| Text diff | `dev-diff` | `/dev/diff` | `DiffTool` | `diff` |
| Unix timestamp converter | `dev-timestamp` | `/dev/timestamp` | `FieldTool` | none |
| Cron explainer | `dev-cron` | `/dev/cron` | `FieldTool` | `cronstrue`, `cron-parser` |
| Case converter | `dev-case` | `/dev/case` | `FieldTool` | none |
| Sort / dedupe lines | `dev-lines` | `/dev/lines` | `LinesTool` | none |
| Slugify | `dev-slug` | `/dev/slug` | `FieldTool` | none |

### Out of scope (this spec)

- UUID generator, hash generator (SHA family via Web Crypto), Lorem ipsum,
  random string. Trivial to add as a Phase 3 batch — noted, not built now.
- Regex tester, Markdown preview, SQL formatter, XML⇄JSON, `.env`⇄JSON,
  colour converter. Future batches.
- Any server-side or AI-backed transform.
- Editing the existing file-based tools.

## 3. Architecture

### 3.1 Registry & category

`src/tools/categories.ts`
- Add `'dev'` to the `Category` union.
- `CATEGORIES.dev = { label: 'Developer', accent: 'dev' }`.

`src/design/tokens.css`
- Add `--accent-dev` for light (`:root`) and dark blocks, matching the existing
  pdf/image/privacy/ai pattern. Add `[data-accent='dev'] { --accent: var(--accent-dev); }`.
- Proposed hue: amber/orange, e.g. light `32 80% 45%`, dark `32 90% 62%`
  (final values tuned against the palette during implementation).

`src/tools/registry.ts`
- New optional field on `Tool`:
  ```ts
  kind?: 'file' | 'text'; // default 'file'
  ```
  Text tools set `kind: 'text'`. Dashboard, command palette, and sidebar treat
  it only as a grouping / copy hint — no behavioural branching beyond skipping
  file-only affordances.
- 15 new `Tool` entries, `category: 'dev'`, `processing: 'local'`,
  `status: 'live'`. `accept: []` for pure-text tools; Base64 sets
  `accept: ['*/*']` for its file mode.
- New lucide icons per tool (e.g. `FileJson`, `Braces`, `Binary`, `Link`,
  `Code`, `GitCompare`, `Clock`, `CalendarClock`, `CaseSensitive`,
  `ArrowDownUp`, `Type`).

### 3.2 Transform logic — `src/services/dev/`

One file per tool, **pure functions, no React, no DOM** (except Base64 file
mode which takes/returns `Uint8Array`). Examples:

```ts
// src/services/dev/json-yaml.ts
export function jsonToYaml(input: string): string;
export function yamlToJson(input: string): string;

// src/services/dev/base64.ts
export function encodeText(input: string): string;
export function decodeText(input: string): string;
export function encodeBytes(bytes: Uint8Array): string;
export function decodeToBytes(input: string): Uint8Array;

// src/services/dev/jwt.ts
export interface DecodedJwt { header: unknown; payload: unknown; signature: string; }
export function decodeJwt(token: string): DecodedJwt; // no signature verification
```

Contract:
- On invalid input, `throw new Error(message)` with a short human-readable
  message (e.g. `"Line 3: unexpected token '}'"`). The message is shown verbatim
  in the tool's error banner.
- Deterministic. No `Date.now()` except the timestamp tool, which takes an
  explicit `now` argument for testability.
- Heavy deps (`js-yaml`, `papaparse`, `diff`, `cronstrue`, `cron-parser`) are
  imported with dynamic `import()` inside the transform module so they land in
  the route chunk, not the app bundle.

Each service file gets a sibling `*.test.ts`: valid case, invalid case,
round-trip where applicable. This is the primary correctness surface.

**JSON → TypeScript** is hand-rolled recursive inference. Documented ceiling
(`ponytail:` comment in the source):
- Infers from a single sample value.
- Primitive unions collapsed (`string | number`).
- Array element type inferred from the first element only.
- Nested objects emitted as named `interface`s (`Root`, `Root_items`, …).
- No detection of optional vs required across array elements, no tuple types,
  no enums.
Upgrade path noted in the comment: swap for `quicktype-core` if richer output
is ever needed.

### 3.3 UI framework — `src/components/dev/`

**`CodeEditor.tsx`**
- Wraps **CodeMirror 6**, lazy-loaded (`React.lazy` + dynamic import of the
  CM setup module).
- Features: line numbers, syntax highlight (JSON / YAML / plain), bracket
  matching, soft wrap toggle.
- One editor theme mapping CM's slots to existing CSS tokens; follows
  light/dark via the existing `ThemeProvider` (reads `data-theme`).
- Fallback while the chunk loads: a styled `<textarea>` in Geist Mono with the
  same padding/border, so the layout doesn't jump. Same fallback used in the
  jsdom test environment.
- Props: `value`, `onChange`, `language`, `readOnly`, `placeholder`,
  `error?` (line to mark, optional).

**`SplitTool.tsx`** — Phase 1 layout
- Two `CodeEditor`s. Left = input (editable), right = output (read-only).
- Direction control: for bidirectional tools, a segmented toggle
  (`JSON → YAML` / `YAML → JSON`) with a swap button that also swaps pane
  contents. For one-way tools (JSON→TS), no toggle.
- Live transform: `useDevTransform` (see 3.4), 150 ms debounce.
- Error: banner below the input pane, red, shows the thrown message; output
  pane keeps last good value dimmed.
- Output actions: **Copy** (with copied-state feedback) and **Download**
  (`downloadBlob` from `src/lib/download.ts`, sensible filename +
  extension per tool).
- Input affordances: a "paste from file" control and a drop target over the
  input pane (text files read as text; Base64 tool also accepts binary).
- Responsive: `lg:` → panes side by side with the toggle column between;
  below `lg` → stacked vertically, toggle/swap row between them, each editor
  `min-h-[40vh]`.

**`JwtTool.tsx`** — token `<input>`/small editor at top → three stacked
read-only `CodeEditor`s (Header, Payload, Signature). Payload shows decoded
`exp` / `iat` / `nbf` as human dates beneath. Explicit "signature not
verified" note.

**`DiffTool.tsx`** — two side-by-side input editors (Original / Changed) →
diff view below (unified default, split toggle). Uses `diff` (jsdiff)
`diffLines` / `createTwoFilesPatch`. Add/remove lines coloured via tokens.

**`FieldTool.tsx`** — for timestamp / cron / case / slug. A small input
region (one or two fields / a single-line editor) → a results panel of
labelled rows, each with a copy button. Cron also lists "next 5 runs"
(local + UTC). Timestamp shows a live-updating "now" row.

**`LinesTool.tsx`** — one editor + an options bar (`Segmented` / checkboxes
from `components/ui`): sort asc/desc/none, case-insensitive, trim, unique,
reverse. Output editor below or replaces input via an "Apply" button.
Live-updates on option change.

All Phase-2 components reuse `components/ui` (`Button`, `Segmented`,
`Input`, `Card`, `Badge`, `Tooltip`) and `CodeEditor`.

### 3.4 Hook — `src/hooks/useDevTransform.ts`

```ts
function useDevTransform<T>(
  fn: (input: string) => T,
  input: string,
  opts?: { debounceMs?: number },
): { output: T | null; error: string | null; pending: boolean };
```

- Debounces, runs `fn` in `try/catch`, maps a thrown `Error` to
  `error: err.message`.
- Keeps the last successful `output` when the current input errors.
- ~30 lines. One test file (success, error keeps last output, debounce).

The existing `useToolRunner` is **not** used for text tools — it is built
around the file `select → configure → process → result → error` state machine
and async services. Text transforms are synchronous.

### 3.5 Routes

- `src/routes/dev/*.tsx` — one thin component per tool. It picks a layout
  component, imports its transform fn(s) from `services/dev/`, supplies
  labels / filename / icon, and renders `<ToolHeader tool={getTool(id)!} … />`
  (reusing the existing header).
- `src/app/routes.tsx` — add `const DevX = lazy(() => import('../routes/dev/X'))`
  and a `{ path: 'dev/x', element: page(<DevX />) }` child per tool.
- `src/app/routes.test.tsx` — extend the route-smoke test to cover the new
  paths.

### 3.6 Handoff

Text tools ignore `src/store/handoff.store.ts`. Exception: the Base64 tool's
file mode may `consume()` a handoff file, matching how existing tools accept
drag-to-action handoffs.

## 4. Data flow

```
paste / drop  ─►  input state (string)  ─►  useDevTransform(debounce, try/catch)
                                               │
                        thrown Error ──────────┤────► error banner (verbatim message)
                                               │
                                     success ──┴────► output editor ─► Copy / Download
```

No persistence. `localStorage` untouched beyond what the shell already stores
(favourites, recents, theme, telemetry toggle, sidebar). No file bytes, no
input text, ever written to storage.

## 5. Error handling

- Every `services/dev` function throws `Error` with a concise message on bad
  input; layouts render it in a banner, never a toast, never swallowed.
- Empty input → no error, empty output, `pending: false`.
- CodeMirror chunk fails to load → textarea fallback stays; tool still works.
- Base64 decode of non-base64 → `"Not valid Base64"`.
- JWT with ≠3 segments → `"Not a JWT (expected 3 dot-separated parts)"`.
- Cron parse failure → message from `cron-parser`, surfaced verbatim.
- File dropped that isn't UTF-8 text (non-Base64 tools) → `"Could not read
  file as text"`.

## 6. Testing

| Layer | Test |
|---|---|
| `services/dev/*.ts` | Per tool: valid transform, invalid input throws expected message, round-trip where bidirectional. Vitest, no DOM. |
| `useDevTransform` | Success, error retains last output, debounce timing. |
| `CodeEditor` | Renders fallback textarea in jsdom; `onChange` fires; `readOnly` respected. |
| `SplitTool` | Typing updates output; error banner shows on bad input; swap swaps panes; copy writes to clipboard (mocked). |
| Phase-2 layouts | One render + one interaction test each (JWT decodes a known token; diff shows an added line; cron shows a description; lines sort+unique). |
| `routes.test.tsx` | All 15 `/dev/*` routes mount without crashing. |
| `registry.test.ts` | Existing invariants hold with `dev` entries (unique ids, unique routes, valid category). |
| `a11y.test.tsx` | Extend axe coverage to one `dev` route. |

No E2E. No new test framework.

## 7. Dependencies

Add to `package.json`:

- `js-yaml` + `@types/js-yaml`
- `papaparse` + `@types/papaparse`
- `diff` + `@types/diff`
- `cronstrue`
- `cron-parser`
- `codemirror`, `@codemirror/state`, `@codemirror/view`,
  `@codemirror/commands`, `@codemirror/language`,
  `@codemirror/lang-json`, `@codemirror/lang-yaml`

All MIT-licensed. All reach the browser only through per-route lazy chunks;
the dashboard / shell bundle size is unchanged. CodeMirror 6 is modular
(~120 KB gzipped for this set) and is consistent with the suite already
lazy-loading the ~10 MB MuPDF wasm per PDF route.

No CDN. CodeMirror ships as npm ESM, bundled by Vite like everything else.
No web fonts added — Geist Mono (already self-hosted) is the editor font.

## 8. Phasing

1. **Infra + Phase 1:** category, tokens, registry field, `CodeEditor`,
   `SplitTool`, `useDevTransform`, 8 converter tools + tests + routes.
2. **Phase 2:** `JwtTool`, `DiffTool`, `FieldTool`, `LinesTool`, 7 tools +
   tests + routes.
3. **(Future, not this spec):** UUID / hash / lorem / random-string batch.

Each phase is independently shippable and leaves the suite green.

## 9. Open questions

None blocking. Accent hue for `dev` and exact lucide icon per tool are
implementation-time choices.
