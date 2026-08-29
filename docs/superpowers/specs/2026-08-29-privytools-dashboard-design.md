# PrivyTools — Privacy-First File Utility Dashboard

**Status:** Approved design
**Date:** 2026-08-29
**Source brief:** `Build a Premium Privacy-First File Utility Dashboard.md` (repo root)

## 1. Goal

One polished web application — a single application shell hosting a dashboard and
seven tool experiences that share components, routing, and a design system. Not
seven separate pages. Architecture must let 30–40 more tools be added later by
adding one registry entry and one route component.

Product philosophy: **Your files stay yours. Process locally whenever technically
possible.** The UI must communicate privacy honestly — never claim an operation
is local when it is not.

## 2. Scope

### In scope (first implementation)

- Application shell: sidebar (collapsible), top bar, mobile bottom navigation,
  command palette (⌘K), global privacy indicator, global drag-to-action.
- Dashboard: hero, quick actions, tool card grid, drag-to-action mode.
- Seven routes:
  - `/` Dashboard
  - `/pdf/security` PDF Security
  - `/pdf/compress` PDF Compressor
  - `/pdf/merge` PDF Merge
  - `/image/compress` Image Compressor
  - `/image/upscale` Image Upscaler
  - `/privacy` Privacy Center
- Shared design system + shared tool primitive components.
- Light (Porcelain) and Dark (Carbon) themes, both fully designed, with a
  `system | light | dark` mode toggle (see §5).
- Two tools with **real** in-browser processing: PDF Merge, Image Compress.
- Three tools with **honest mock** processing behind a service interface:
  PDF Security, PDF Compress, Image Upscale.
- Responsive: desktop, tablet, mobile. Touch support for dropzones and
  before/after comparison.
- Accessibility: keyboard nav, focus-visible, ARIA labels, `aria-live` status,
  `prefers-reduced-motion`, contrast checked in both themes.
- Tests: registry integrity, tool-runner state machine, byte formatting, real
  merge + compress services. `tsc`, `eslint`, `vite build` green.

### Out of scope (deferred, architecture must not block)

- Real engines for PDF Security / PDF Compress / AI Upscale.
- Any backend / server / cloud processing. No deploy config.
- The 30–40 future tools listed in the brief (§25).
- Persisted history of processed files (only tool *names* are remembered).

## 3. Tech stack

| Concern | Choice | Reason |
|---|---|---|
| Build | Vite | Client-only SPA, no server needed |
| Language | TypeScript | Brief requirement |
| UI | React 18 | Brief requirement |
| Routing | React Router 6 (data router) | Standard SPA routing, lazy routes |
| Styling | Tailwind CSS v4 + CSS-variable tokens | Maintainable, tokens stay single-source |
| Animation | Motion (`framer-motion`) | Shared layout transitions, drag physics, sliders, magnetic buttons; honors reduced-motion |
| Command palette | `cmdk` | De-facto standard, small, accessible |
| Icons | `lucide-react` | One thin consistent library, no emoji as UI icons |
| Fonts | `@fontsource` (Space Grotesk, Geist Mono) | Self-hosted, no CDN calls — consistent with privacy story. Space Grotesk = display + UI; Geist Mono = all technical/metadata type. |
| State | Zustand + `localStorage` (prefs only) | Favorites, recent tool names, theme mode, telemetry toggle. Never file data. |
| PDF | `pdf-lib` | Real merge; metadata read for previews |
| Image compress | `browser-image-compression` + canvas | Real, worker-friendly |
| Heavy work | Web Workers (`pdf.worker.ts`, `image.worker.ts`) | Keep UI responsive |
| Tests | Vitest + @testing-library/react | Lightweight, Vite-native |

No new dependency is added for anything a few lines of code cover.

## 4. Architecture

```
src/
  main.tsx            # bootstrap, router
  app/
    AppShell.tsx      # grid: sidebar | (topbar / content) ; mobile nav
    Sidebar.tsx       # nav from tool registry, collapse toggle, favorites, recent
    Topbar.tsx        # logo, command-palette trigger, theme, settings
    MobileNav.tsx     # bottom nav: Home / PDF / Image / Privacy
    CommandPalette.tsx# cmdk, grouped by category, ⌘K
    PrivacyPill.tsx   # fixed pill + popover; copy adapts to active tool
    DragToAction.tsx  # window drag listeners + overlay
    routes.tsx        # route table, lazy() per route, error element
  routes/
    Dashboard.tsx
    PdfSecurity.tsx  PdfCompress.tsx  PdfMerge.tsx
    ImageCompress.tsx  ImageUpscale.tsx
    Privacy.tsx
    NotFound.tsx
  tools/
    registry.ts       # Tool[] — single source of truth
    categories.ts     # category -> {label, accent var}
  services/
    types.ts          # service interfaces + result/progress types
    pdf.service.ts     # merge (real), security/compress (mock)
    image.service.ts   # compress (real)
    upscale.service.ts # mock; real bicubic canvas baseline
    privacy.service.ts # derives status from registry flags
  workers/
    pdf.worker.ts  image.worker.ts
  components/
    ui/               # Button Input Slider Segmented Card Dialog Dropdown Badge Tooltip Kbd
    tool/             # ToolHeader FileDropzone FilePreview FileInfo ConfigPanel
                      # ProcessingState ProgressIndicator ResultCard PrivacyIndicator
                      # DownloadButton ResetButton BeforeAfterComparison StepFlow
  hooks/
    useToolRunner.ts  # SELECT -> CONFIGURE -> PROCESS -> RESULT state machine
    useDropzone.ts  useObjectUrl.ts  useFavorites.ts  useRecent.ts
    useReducedMotion.ts  useFileHandoff.ts
  store/
    prefs.store.ts    # zustand, persisted (non-sensitive only)
    handoff.store.ts  # in-memory only: file passed dashboard -> tool
  design/
    tokens.css  globals.css  motion.ts
  lib/
    formatBytes.ts  fileValidation.ts  cn.ts  download.ts
  test/               # setup, fixtures (tiny sample PDFs / images)
```

### Tool registry

```ts
export type ProcessingMode = 'local' | 'local-partial' | 'server';

export interface Tool {
  id: string;
  name: string;
  description: string;       // short, shown on cards + palette
  route: string;
  category: 'pdf' | 'image' | 'privacy' | 'ai';
  icon: LucideIcon;
  shortcut?: string;         // display hint only
  processing: ProcessingMode;
  status: 'live' | 'demo';   // 'demo' => honest mock copy in UI
  accept: string[];          // e.g. ['application/pdf']
}
```

The registry drives: sidebar nav, dashboard cards, command palette entries,
route generation, breadcrumbs, and the privacy pill copy. Adding a tool later =
append one `Tool` + add one lazy route component.

### Tool page pattern

Every tool route renders:

```
<ToolHeader tool={tool} />
<StepFlow>            // driven by useToolRunner(service, config)
  SELECT     -> FileDropzone / FilePreview + FileInfo
  CONFIGURE  -> ConfigPanel (tool-specific controls) + live estimate
  PROCESS    -> ProcessingState (tool-specific animation) + ProgressIndicator + aria-live
  RESULT     -> ResultCard (success) | error view
</StepFlow>
```

Tool personality comes from three levers only: category accent color, header
treatment, and the processing animation. Structure stays identical.

### Services

```ts
interface ToolService<Config, Result> {
  process(
    file: File | File[],
    config: Config,
    onProgress: (p: Progress) => void,
    signal: AbortSignal,
  ): Promise<Result>;
}

interface Progress { phase: string; ratio?: number; }   // phase drives aria-live text
interface FileResult {
  blob: Blob; filename: string;
  originalBytes: number; outputBytes?: number;
  meta?: Record<string, string | number>;
}
```

- **Real** (`pdf.service.merge`, `image.service.compress`): run in a worker,
  return a genuine `Blob`, report real progress.
- **Mock** (`security`, `compress`, `upscale`): same interface, realistic phase
  timing, `status: 'demo'`. They DO NOT return a transformed file claimed as
  real. PDF Compress shows the real original size and an *estimate* only.
  Image Upscale returns a real bicubic-scaled canvas image, explicitly labeled
  "Preview upscale — AI engine not yet connected".

## 5. Design system

### Tokens (`design/tokens.css`, CSS custom properties)

Two fully designed themes — **Light · Porcelain** and **Dark · Carbon** — a
warm-neutral pair so the product reads as one identity in either mode. Tokens
are role names; each theme redefines the same set. Category accents keep the
same hue in both themes, darkened for contrast in Light.

```
/* role tokens (both themes define all of these) */
--bg  --surface  --surface-hi  --sunken  --raise
--border  --border-hi  --text  --text-dim
--track  --seg-active  --hatch-a  --hatch-b   /* control + placeholder surfaces */
--accent-pdf  --accent-image  --accent-privacy  --accent-ai
--accent        /* set per view from the tool category */
--radius-sm 8px  --radius-md 12px  --radius-lg 16px
--shadow-1
--dur-1 120ms  --dur-2 200ms  --dur-3 320ms  --dur-4 480ms
--ease-out-expo cubic-bezier(.16,1,.3,1)

/* DARK · Carbon */
--bg #0A0908  --surface #100E0C  --surface-hi #16130F  --sunken #0D0B09  --raise #1B1712
--border rgba(255,240,220,.08)  --border-hi rgba(255,240,220,.16)
--text #F6F2EC  --text-dim #9A9082
--accent-pdf hsl(212 90% 62%)  --accent-image hsl(258 85% 68%)
--accent-privacy hsl(150 55% 55%)  --accent-ai hsl(270 80% 70%)
--shadow-1 0 1px 2px rgba(0,0,0,.5), 0 12px 40px rgba(0,0,0,.35)

/* LIGHT · Porcelain */
--bg #F7F6F3  --surface #FFFFFF  --surface-hi #FFFFFF  --sunken #F1EFE9  --raise #FAF9F6
--border rgba(20,20,18,.10)  --border-hi rgba(20,20,18,.22)
--text #16130F  --text-dim #625D54
--accent-pdf hsl(212 76% 42%)  --accent-image hsl(258 58% 48%)
--accent-privacy hsl(150 52% 32%)  --accent-ai hsl(270 58% 48%)
--shadow-1 0 1px 2px rgba(20,20,18,.06), 0 16px 44px rgba(20,20,18,.09)
```

The brief's stated dark hexes (`#070707 / #0D0D0D / #121212`) are superseded by
Carbon per the user's explicit choice; the palette above is authoritative.

Spacing: 4px base scale via Tailwind defaults. One elevation shadow, one border
style. Accent used for at most one element per view (icon, focus ring, or a
single highlight) — never as fills or gradients across the UI.

### Theme

Both **Light (Porcelain)** and **Dark (Carbon)** are fully designed and
maintained. A mode control ships `system | light | dark`; `system` resolves via
`prefers-color-scheme`. Mode persists in `localStorage`, applied as `data-mode`
(`light` / `dark`) on `<html>` (see `ThemeProvider`). No dark sub-palettes.

### Typography

- Display / headings: **Space Grotesk**, tight tracking (`--tracking-display
  -.035em`), `clamp()` hero up to ~64px, strong size jumps between levels.
- Body / UI: Space Grotesk (system-ui fallback stack).
- Technical metadata — file sizes, percentages, counts, dimensions, shortcuts:
  **Geist Mono**.
- Generous whitespace; content max-width ~880px on tool pages, wider on
  dashboard grid.

### Motion (`design/motion.ts`)

Presets: `fade`, `slideUp`, `scaleIn`, `stagger`, route transition (crossfade +
4px rise). Premium: shared layout id on tool card → tool header, magnetic button
(pointer-follow within 6px), drag-to-reorder (merge), before/after slider
(pointer events). All transform/beam animations gate on `useReducedMotion()`;
reduced motion keeps opacity fades only.

## 6. Components

### `components/ui`

`Button` (variant: primary | ghost | subtle; optional `magnetic`), `Input`
(with optional trailing slot, e.g. password eye), `Slider` (labelled ends),
`Segmented` (preset picker), `Card`, `Dialog` (focus-trapped), `Dropdown`,
`Badge`, `Tooltip`, `Kbd`.

### `components/tool`

- `ToolHeader` — title, subtitle, category accent, breadcrumb, back.
- `FileDropzone` — drag + click + keyboard; `accept` from tool; polished empty
  state per §26 of brief; touch friendly.
- `FilePreview` — PDF first-page render (pdf.js only if time allows; otherwise a
  document glyph + name), image thumbnail with morph-in.
- `FileInfo` — name, size (mono), type, page count where known.
- `ConfigPanel` — layout wrapper for tool-specific controls.
- `ProcessingState` — slot for the tool-specific animation + phase label.
- `ProgressIndicator` — determinate bar / ring, mono percentage.
- `ResultCard` — the premium result experience (§18): check animation,
  filename, `A → B` size, "Saved N", `DownloadButton`, `ResetButton`
  ("Process another"), privacy line.
- `PrivacyIndicator` — inline variant of the pill for tool pages.
- `BeforeAfterComparison` — pointer-event slider, labels, touch drag.
- `StepFlow` — renders the current `useToolRunner` step with transitions.

No tool route re-implements any of these.

## 7. Global behaviors

- **Command palette** — ⌘K / Ctrl+K. `cmdk`. Groups: PDF, Image, Privacy.
  Instant filter, full keyboard nav, Enter routes, Esc closes. Also reachable
  from the topbar trigger showing `⌘K`.
- **Drag-to-action** — dragging any file over the window (dashboard) shows an
  overlay: "What would you like to do with this file?" with the actions valid
  for that file type (brief §9). Selecting one routes to the tool with the file
  pre-loaded via `handoff.store` (in-memory; cleared on consume or route
  change). Never written to disk/localStorage.
- **Privacy pill** — fixed bottom-left. Popover content (brief §10) with the
  four checkmarks. Copy adapts to the active tool's `processing`:
  `local` → "processed on your device"; `local-partial` → "parts run on your
  device; <X> is estimated locally, full engine pending"; `server` → explicit
  "this operation runs on a server" (none in first release).
- **Object URL lifecycle** — `useObjectUrl` revokes on unmount, new file, and
  reset. `useToolRunner` clears file + result state on reset.

## 8. States (every tool)

- **Empty** — brief §26 style: single glyph, "Ready when you are.", one-line
  instruction, `Browse files`, privacy line. Per-tool accent.
- **Loading** — tool-specific animation (§9 below) + phase text stepped via
  `aria-live="polite"`. No generic spinner on any tool.
- **Error** — brief §27: `!` glyph, "Something went wrong.", "We couldn't
  process this file.", "The original file is untouched.", `Try again`. No stack
  traces; technical detail only to `console` in dev.
- **Success** — brief §18 result experience via `ResultCard`.

## 9. Tool specifics

| Route | Status | Engine | Identity | Processing animation |
|---|---|---|---|---|
| `/` | — | — | calm home | drag-to-action overlay |
| `/pdf/security` | demo | mock service; pdf-lib metadata read | vault | lock → encrypting → locked (and reverse for unlock) |
| `/pdf/compress` | demo | mock; real original size, estimated output; slider + presets (Max / Balanced / High quality) | performance/minimal | stacked bars visually shrinking |
| `/pdf/merge` | live | `pdf-lib` in worker | document flow | draggable page cards → stacking into one |
| `/image/compress` | live | `browser-image-compression` + canvas in worker; quality / format (JPG/PNG/WEBP) / target size; live estimate | pixel lab | pixel grid coarsening |
| `/image/upscale` | demo | `UpscaleService` interface; real bicubic 2×/4× baseline, labeled preview; sharpness / noise / face sliders are UI-only in demo | AI studio | scanning beam across image; phase list: Analyzing → Detecting details → Enhancing resolution → Reconstructing pixels |
| `/privacy` | — | `privacy.service` reads registry flags | trust dashboard | metadata/data particles dissipating; animated `◉ PRIVATE` indicator |

Privacy Center lists, from the registry, which tools run locally and which are
demo/pending — no misleading claims.

## 10. Responsive

- Desktop `≥1024px`: sidebar (240px) + content.
- Tablet `768–1023px`: sidebar collapses to 64px icon rail; labels on hover.
- Mobile `<768px`: sidebar becomes a slide-over sheet; bottom nav with Home /
  PDF / Image / Privacy. Content single-column, controls stack.
- Dropzones accept touch (tap = browse). `BeforeAfterComparison` uses pointer
  events so mouse and touch drag both work.

## 11. Accessibility

Keyboard nav across shell, palette, tool flows. `:focus-visible` ring using an
accent token. Dropzone is a labelled button with `role` and key handler. Every
icon-only control has `aria-label`. Processing phases announced via
`aria-live="polite"`. `prefers-reduced-motion` disables transforms/beam/particle
effects, keeps opacity. Contrast verified in both themes (Porcelain, Carbon):
`--text` and `--text-dim` on `--bg` / `--surface-hi`, and each accent token
where it carries text or icon meaning.

## 12. Security / privacy rules

- No file contents to `console`, analytics, or `localStorage`.
- `localStorage` holds only: favorites (tool ids), recent (tool ids), theme,
  telemetry toggle (default off).
- Object URLs revoked when stale; tool state cleared on reset.
- Mock tools never present a fabricated transformation as real.
- Privacy pill copy is derived from registry flags, not hardcoded per page.

## 13. Testing / quality bar

- `tools/registry.test.ts` — every tool has a unique id, a route that resolves
  to a component, a valid category, non-empty accept.
- `hooks/useToolRunner.test.ts` — state transitions, abort, reset clears state.
- `lib/formatBytes.test.ts` — boundaries (0, <1KB, MB, GB).
- `services/pdf.service.test.ts` — real merge of two fixture PDFs → page count
  is the sum; output is a valid PDF.
- `services/image.service.test.ts` — compress fixture → output smaller, correct
  mime for chosen format.
- Gates before "done": `tsc --noEmit`, `eslint`, `vitest run`, `vite build` all
  green; manual walk of all seven routes + palette + drag-to-action + mobile
  layout.

## 14. Build order

1. Scaffold Vite + TS + Tailwind v4 + Router; fonts; tokens + globals.
2. Design system `components/ui` + dev-only visual check route at `/_ds`
   (not in nav).
3. Tool registry + categories + services interfaces (mock impls first).
4. AppShell + Sidebar + Topbar + MobileNav + routing (lazy).
5. Command palette + privacy pill + drag-to-action.
6. `components/tool` primitives + `useToolRunner` + `StepFlow`.
7. Dashboard (hero, quick actions, card grid).
8. Seven tool routes, each wiring header + flow + service + animation.
9. Real engines: pdf merge worker, image compress worker.
10. Responsive pass; reduced-motion pass; a11y pass.
11. Tests + lint + type + build; route walk; fix visual inconsistencies.

## 15. Risks / mitigations

- **pdf-lib in a worker** — bundling/transferable quirks. Mitigation: fall back
  to main-thread with a yield loop if worker integration slips the time box;
  interface unchanged.
- **Tailwind v4** — newer config surface. Mitigation: if v4 friction appears,
  drop to v3.4 — token file and class usage stay the same.
- **Two full themes** — every component styled via role tokens only; any color
  literal outside `tokens.css` is a bug. `/_ds` gallery is walked in both modes
  before Task 32 signs off.
- **PDF first-page preview** — pulling `pdf.js` is heavy. Mitigation: ship a
  document glyph + filename preview first; real render only if time allows.
- **Space Grotesk / Geist Mono via @fontsource** — package name/coverage.
  Mitigation: `system-ui` + a system mono as the shipped fallback stacks.
---

## Addendum (post-approval): all engines made real

Superseded the demo/mock split. Every processing tool now runs a real
on-device engine:

- **PDF Security** — MuPDF wasm. Real AES-256 encrypt; decrypt authenticates
  the password first (`ToolError` "did not unlock" on mismatch). Passwords may
  not contain `,` or `=` (MuPDF option-string limitation), surfaced in the UI.
- **PDF Compress** — MuPDF wasm. `compress + compress-images + compress-fonts +
  garbage=compact`. Returns the original file unchanged when the result would
  be larger. Big gains only on image-heavy PDFs; copy no longer promises a %.
- **Image Upscale** — deliberately **not AI** (user decision). Real stepped
  high-quality canvas resampling (2× hops) + a 3×3 unsharp-mask sharpen slider
  + a smoothing toggle. Retitled "Bigger, sharper images.", category `image`.

Registry: all five processing tools are `status: 'live'`, `processing:
'local'`. `ResultCard`'s `demo` branch is retained but currently unused. Demo
`Badge`s removed from routes. `PrivacyPill` and Privacy Center now truthfully
report every operation as local.

MuPDF wasm (~10MB) is lazy-loaded only on the three PDF routes via
`src/services/mupdf.ts`. `pdf.service.test.ts` runs in the Vitest **node**
environment against the real engine (AES round-trip, wrong-password, page-count
preservation).
