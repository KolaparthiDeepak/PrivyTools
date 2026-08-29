# PrivyTools Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one polished privacy-first file-utility web app — a single application shell with a dashboard and seven tool experiences sharing a design system, components, routing, and honest local-first processing.

**Architecture:** Vite + React + TS SPA. A tool registry array is the single source of truth for nav, dashboard cards, command palette, and routes. Every tool page is `ToolHeader` + a `StepFlow` state machine (`useToolRunner`) wired to a `ToolService`. Two services do real in-browser work (PDF merge via `pdf-lib`, image compression via canvas), three are honest mocks behind the same interface. Heavy work can move to Web Workers (headroom left in place).

**Tech Stack:** Vite, React 18, TypeScript, React Router 6, Tailwind CSS v4, framer-motion, cmdk, lucide-react, @fontsource, Zustand, pdf-lib, Vitest + @testing-library/react.

## Global Constraints

- Node 26, npm 11 (present). Package manager: npm.
- TypeScript strict mode. `tsc --noEmit`, `eslint`, `vitest run`, `vite build` all green before "done".
- No backend, no runtime network calls. Fonts self-hosted via `@fontsource`. No analytics.
- `localStorage` stores ONLY: favorite tool ids, recent tool ids, theme mode, telemetry toggle (default off), sidebar-collapsed, privacyMode flag. Never file bytes, names, or contents.
- No file contents to `console` (dev-only logging of an error `.message` string is allowed), analytics, or storage.
- Object URLs revoked on unmount, on new file, and on reset.
- Two fully designed themes: **Light · Porcelain** (default) and **Dark · Carbon**. Exact token values in Task 3. Category accents: pdf=cool blue, image=violet, privacy=green, ai=purple — same hue both themes, darker in Light. Accent on at most one element per view. No large gradients, no heavy glass, no glow spam, no emoji as UI icons. Every color comes from a `tokens.css` role token — no color literal anywhere else in `src/`.
- Typeface: **Space Grotesk** (display + UI) + **Geist Mono** (all sizes, percentages, counts, dimensions, shortcuts). Icons: `lucide-react` only.
- Every tool has designed empty / loading / error / success states. Loading is tool-specific, never a generic spinner. Errors never show stack traces; copy: "Something went wrong." / "We couldn't process this file." / "The original file is untouched." / "Try again".
- Mock tools never present a fabricated transformation as real. They carry `status: 'demo'` and visible honest copy.
- `prefers-reduced-motion`: disable transforms / beam / particle effects, keep opacity fades.
- All interactive elements: visible `:focus-visible` ring, ARIA labels on icon-only controls, processing phases announced via `aria-live="polite"`.
- Commit after every task. End commit messages with `Claude-Session: https://claude.ai/code/session_01P5CGW7XmbuXSx91S6XXUfL`.

---

## File Structure

```
index.html
vite.config.ts            # react plugin, tailwind v4 plugin, vitest config, worker format
tsconfig.json             # strict
tailwind.config.ts        # content globs, theme extension mapping CSS vars
.eslintrc.cjs
src/
  main.tsx                # createRoot + RouterProvider
  vite-env.d.ts
  design/
    tokens.css            # :root CSS custom properties
    globals.css           # @import tailwind, resets, font faces, focus-visible, scrollbar
    motion.ts             # framer-motion variant presets + reduced-motion helper
  lib/
    cn.ts  formatBytes.ts  formatPercent.ts  fileValidation.ts  download.ts  privacyCopy.ts
  tools/
    categories.ts  registry.ts
  services/
    types.ts  pdf.service.ts  image.encode.ts  image.service.ts  upscale.service.ts  privacy.service.ts
  workers/
    pdf.worker.ts          # merge headroom (not wired in v1)
  store/
    prefs.store.ts  handoff.store.ts
  hooks/
    useReducedMotion.ts  useObjectUrl.ts  useDropzone.ts  useToolRunner.ts
    useFavorites.ts  useRecent.ts  useCommandPalette.ts
  components/
    ui/    Button Input Slider Segmented Card Dialog Dropdown Badge Tooltip Kbd  index.ts
    tool/  ToolHeader FileDropzone FilePreview FileInfo ConfigPanel ProcessingState
           ProgressIndicator ResultCard ErrorState PrivacyIndicator DownloadButton
           ResetButton BeforeAfterComparison StepFlow MergeList
           anims/  LockAnim ShrinkBarsAnim StackAnim PixelGridAnim ScanBeamAnim ParticlesAnim
    dashboard/  Hero ToolCard QuickActions
    privacy/    PrivacyBoard PrivateIndicator
  app/
    AppShell.tsx  Sidebar.tsx  Topbar.tsx  MobileNav.tsx
    CommandPalette.tsx  PrivacyPill.tsx  DragToAction.tsx  ThemeProvider.tsx  routes.tsx
  routes/
    Dashboard.tsx  PdfSecurity.tsx  PdfCompress.tsx  PdfMerge.tsx
    ImageCompress.tsx  ImageUpscale.tsx  Privacy.tsx  DesignSystem.tsx  NotFound.tsx
  test/
    setup.ts  fixtures/ (a.pdf b.pdf sample.png sample.jpg generated in Task 2)
```

---

## Task 1: Project scaffold

**Files:** Create `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `.eslintrc.cjs`, `index.html`, `src/main.tsx`, `src/vite-env.d.ts`, `tailwind.config.ts`, minimal `src/design/globals.css`.

**Interfaces:** Produces a running dev server showing "PrivyTools"; scripts `dev`, `build`, `test`, `lint`, `typecheck`.

- [ ] **Step 1: Init + install**

```bash
npm init -y
npm i react react-dom react-router-dom framer-motion cmdk lucide-react zustand pdf-lib
npm i @fontsource/space-grotesk @fontsource/geist-mono
npm i -D vite @vitejs/plugin-react typescript @types/react @types/react-dom \
  tailwindcss @tailwindcss/vite \
  vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom \
  eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react-hooks \
  clsx tailwind-merge
```

- [ ] **Step 2: `package.json` fields**

```json
{
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint \"src/**/*.{ts,tsx}\"",
    "typecheck": "tsc --noEmit"
  }
}
```

- [ ] **Step 3: `vite.config.ts`**

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwind()],
  worker: { format: 'es' },
  test: { environment: 'jsdom', setupFiles: ['src/test/setup.ts'], globals: true },
});
```

- [ ] **Step 4: `tsconfig.json`**

Key options: `"strict": true`, `"jsx": "react-jsx"`, `"moduleResolution": "bundler"`, `"target": "ES2022"`, `"module": "ESNext"`, `"lib": ["ES2022","DOM","DOM.Iterable","WebWorker"]`, `"types": ["vitest/globals","@testing-library/jest-dom"]`, `"noUnusedLocals": true`, `"noUnusedParameters": true`, `"noEmit": true`, `"skipLibCheck": true`. `"include": ["src"]`.

- [ ] **Step 5: `index.html` + `src/main.tsx`**

`index.html`: `<div id="root"></div>` + `<script type="module" src="/src/main.tsx">`.

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './design/globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode><div className="p-8 text-lg">PrivyTools</div></StrictMode>,
);
```

`src/design/globals.css` for now: `@import "tailwindcss";`

- [ ] **Step 6: `.eslintrc.cjs`**

```js
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
  plugins: ['@typescript-eslint', 'react-hooks'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:react-hooks/recommended'],
  env: { browser: true, es2022: true },
  ignorePatterns: ['dist', 'node_modules'],
  rules: { '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }] },
};
```

- [ ] **Step 7: Verify** — `npm run dev` shows "PrivyTools"; `npm run build`, `npm run lint`, `npm run typecheck` all clean.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "chore: scaffold Vite + React + TS + Tailwind v4

Claude-Session: https://claude.ai/code/session_01P5CGW7XmbuXSx91S6XXUfL"
```

---

## Task 2: Test setup + fixtures

**Files:** Create `src/test/setup.ts`, `src/test/fixtures/make-fixtures.mjs`, generated `a.pdf`, `b.pdf`, `sample.png`, `sample.jpg`.

**Interfaces:** Produces binary fixtures for service/route tests; jest-dom matchers registered.

- [ ] **Step 1: `src/test/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 2: `src/test/fixtures/make-fixtures.mjs`**

```js
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { writeFileSync } from 'node:fs';

async function pdf(pages, url) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < pages; i++) {
    doc.addPage([200, 200]).drawText(`page ${i + 1}`, { x: 20, y: 100, size: 12, font });
  }
  writeFileSync(url, await doc.save());
}
await pdf(2, new URL('./a.pdf', import.meta.url));
await pdf(3, new URL('./b.pdf', import.meta.url));

writeFileSync(new URL('./sample.png', import.meta.url), Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'));
writeFileSync(new URL('./sample.jpg', import.meta.url), Buffer.from(
  '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
  'base64'));
console.log('fixtures written');
```

- [ ] **Step 3: Run + commit**

```bash
node src/test/fixtures/make-fixtures.mjs
git add -A && git commit -m "test: setup + binary fixtures

Claude-Session: https://claude.ai/code/session_01P5CGW7XmbuXSx91S6XXUfL"
```

---

## Task 3: Design tokens + globals + Tailwind mapping

**Files:** Create `src/design/tokens.css`; modify `src/design/globals.css`; create `tailwind.config.ts`.

**Interfaces:** Produces role tokens (`--bg --surface --surface-hi --sunken --raise --track --seg-active --hatch-a --hatch-b --border --border-hi --text --text-dim --accent-* --accent --tracking-display --radius-* --shadow-1 --dur-* --ease-out-expo`), redefined for Light (Porcelain, the bare `:root`) and Dark (Carbon, `:root[data-mode='dark']`). Tailwind classes `bg-bg bg-surface bg-surface-hi bg-sunken bg-raise border-border border-border-hi text-text text-dim text-accent rounded-{sm,md,lg} shadow-1 ease-expo`. `[data-accent]` on a wrapper switches `--accent`. Mode applied by `ThemeProvider` (Task 14) via `data-mode` (`light`/`dark`) on `<html>`.

- [ ] **Step 1: `src/design/tokens.css`**

Every color literal in the codebase lives here and nowhere else. Accent hues stay constant across themes; only lightness shifts.

```css
:root {
  /* ---- LIGHT · Porcelain (default / bare :root) ---- */
  --bg: #f7f6f3;
  --surface: #ffffff;
  --surface-hi: #ffffff;
  --sunken: #f1efe9;
  --raise: #faf9f6;
  --track: #e7e4dc;
  --seg-active: #eeece5;
  --hatch-a: #efede7;
  --hatch-b: #f5f3ee;
  --border: rgba(20, 20, 18, 0.10);
  --border-hi: rgba(20, 20, 18, 0.22);
  --text: #16130f;
  --text-dim: #625d54;

  --accent-pdf: 212 76% 42%;
  --accent-image: 258 58% 48%;
  --accent-privacy: 150 52% 32%;
  --accent-ai: 270 58% 48%;
  --accent: var(--accent-pdf);

  --tracking-display: -0.035em;
  --radius-sm: 8px; --radius-md: 12px; --radius-lg: 16px;
  --shadow-1: 0 1px 2px rgba(20,20,18,.06), 0 16px 44px rgba(20,20,18,.09);
  --dur-1: 120ms; --dur-2: 200ms; --dur-3: 320ms; --dur-4: 480ms;
  --ease-out-expo: cubic-bezier(.16, 1, .3, 1);
}

[data-accent='pdf']     { --accent: var(--accent-pdf); }
[data-accent='image']   { --accent: var(--accent-image); }
[data-accent='privacy'] { --accent: var(--accent-privacy); }
[data-accent='ai']      { --accent: var(--accent-ai); }

/* ---- DARK · Carbon (default dark) ---- */
:root[data-mode='dark'] {
  --bg: #0a0908;
  --surface: #100e0c;
  --surface-hi: #16130f;
  --sunken: #0d0b09;
  --raise: #1b1712;
  --track: #241f18;
  --seg-active: #201b15;
  --hatch-a: #131009;
  --hatch-b: #0f0c07;
  --border: rgba(255, 240, 220, 0.08);
  --border-hi: rgba(255, 240, 220, 0.16);
  --text: #f6f2ec;
  --text-dim: #9a9082;
  --accent-pdf: 212 90% 62%;
  --accent-image: 258 85% 68%;
  --accent-privacy: 150 55% 55%;
  --accent-ai: 270 80% 70%;
  --shadow-1: 0 1px 2px rgba(0,0,0,.5), 0 12px 40px rgba(0,0,0,.35);
}
```

- [ ] **Step 2: `src/design/globals.css`**

```css
@import 'tailwindcss';
@import './tokens.css';
@import '@fontsource/space-grotesk/400.css';
@import '@fontsource/space-grotesk/500.css';
@import '@fontsource/space-grotesk/600.css';
@import '@fontsource/space-grotesk/700.css';
@import '@fontsource/geist-mono/400.css';
@import '@fontsource/geist-mono/500.css';

@theme {
  --font-sans: 'Space Grotesk', ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-mono: 'Geist Mono', ui-monospace, 'SF Mono', Menlo, monospace;
}

html, body, #root { height: 100%; }
body {
  background: var(--bg); color: var(--text);
  font-family: var(--font-sans); -webkit-font-smoothing: antialiased;
}
*:focus-visible { outline: 2px solid hsl(var(--accent)); outline-offset: 2px; border-radius: 4px; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important; animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
  }
}
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-thumb { background: var(--border-hi); border-radius: 8px; }
```

- [ ] **Step 3: `tailwind.config.ts`**

```ts
import type { Config } from 'tailwindcss';
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)', surface: 'var(--surface)', 'surface-hi': 'var(--surface-hi)',
        sunken: 'var(--sunken)', raise: 'var(--raise)', track: 'var(--track)',
        border: 'var(--border)', 'border-hi': 'var(--border-hi)',
        text: 'var(--text)', dim: 'var(--text-dim)', accent: 'hsl(var(--accent))',
      },
      borderRadius: { sm: 'var(--radius-sm)', md: 'var(--radius-md)', lg: 'var(--radius-lg)' },
      boxShadow: { '1': 'var(--shadow-1)' },
      transitionTimingFunction: { expo: 'var(--ease-out-expo)' },
    },
  },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 4: Verify** — temporarily add `<div className="bg-surface border border-border rounded-md p-6">check</div>` to `main.tsx`, `npm run dev`, see a Porcelain (light) card; set `document.documentElement.dataset.mode='dark'` in devtools, confirm it flips to Carbon. Revert.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: design tokens, globals, Tailwind mapping

Claude-Session: https://claude.ai/code/session_01P5CGW7XmbuXSx91S6XXUfL"
```

---

## Task 4: lib utilities (TDD)

**Files:** Create `src/lib/{cn,formatBytes,formatPercent,fileValidation,download,privacyCopy}.ts`; test `src/lib/{formatBytes,formatPercent,fileValidation}.test.ts`.

**Interfaces:**
- `cn(...classes): string`
- `formatBytes(n: number, digits=1): string` → `"0 B"`, `"820 B"`, `"8.4 MB"`, `"42.8 MB"`, `"1.3 GB"`
- `formatPercent(originalBytes, outputBytes): string` → `"80.4% smaller"`, `"0% smaller"` when output ≥ original
- `isAccepted(file: {type;name}, accept: string[]): boolean`
- `rejectionReason(file, accept): string | null` → `"That's a PNG. This tool needs a PDF."`
- `downloadBlob(blob: Blob, filename: string): void`
- `PRIVACY_COPY: Record<'local'|'local-partial'|'server', { short: string; long: string }>`

- [ ] **Step 1: Failing tests**

`formatBytes.test.ts`:

```ts
import { formatBytes } from './formatBytes';
test('zero', () => expect(formatBytes(0)).toBe('0 B'));
test('bytes', () => expect(formatBytes(820)).toBe('820 B'));
test('MB', () => expect(formatBytes(42.8 * 1024 ** 2)).toBe('42.8 MB'));
test('rounds', () => expect(formatBytes(8.44 * 1024 ** 2)).toBe('8.4 MB'));
test('GB', () => expect(formatBytes(1.3 * 1024 ** 3)).toBe('1.3 GB'));
```

`formatPercent.test.ts`:

```ts
import { formatPercent } from './formatPercent';
test('smaller', () => expect(formatPercent(42.8 * 1024 ** 2, 8.4 * 1024 ** 2)).toBe('80.4% smaller'));
test('no gain', () => expect(formatPercent(100, 120)).toBe('0% smaller'));
```

`fileValidation.test.ts`:

```ts
import { isAccepted, rejectionReason } from './fileValidation';
const pdf = { type: 'application/pdf', name: 'x.pdf' };
const png = { type: 'image/png', name: 'x.png' };
test('mime match', () => expect(isAccepted(pdf, ['application/pdf'])).toBe(true));
test('ext fallback', () => expect(isAccepted({ type: '', name: 'x.pdf' }, ['application/pdf'])).toBe(true));
test('rejects wrong', () => expect(isAccepted(png, ['application/pdf'])).toBe(false));
test('friendly reason', () => {
  const r = rejectionReason(png, ['application/pdf'])!;
  expect(r).toMatch(/PDF/);
  expect(r).not.toMatch(/application\//);
});
test('null when ok', () => expect(rejectionReason(pdf, ['application/pdf'])).toBeNull());
```

- [ ] **Step 2: Run → FAIL** (`npm run test`).

- [ ] **Step 3: Implement**

`cn.ts`:

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export const cn = (...i: ClassValue[]) => twMerge(clsx(i));
```

`formatBytes.ts`:

```ts
const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;
export function formatBytes(n: number, digits = 1): string {
  if (!Number.isFinite(n) || n <= 0) return '0 B';
  const i = Math.min(UNITS.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  const v = n / 1024 ** i;
  return `${i === 0 ? Math.round(v) : v.toFixed(digits)} ${UNITS[i]}`;
}
```

`formatPercent.ts`:

```ts
export function formatPercent(originalBytes: number, outputBytes: number): string {
  if (originalBytes <= 0 || outputBytes >= originalBytes) return '0% smaller';
  return `${((1 - outputBytes / originalBytes) * 100).toFixed(1)}% smaller`;
}
```

`fileValidation.ts`:

```ts
type FileLike = { type: string; name: string };
const EXT_BY_MIME: Record<string, string[]> = {
  'application/pdf': ['pdf'], 'image/png': ['png'],
  'image/jpeg': ['jpg', 'jpeg'], 'image/webp': ['webp'],
};
const LABEL: Record<string, string> = {
  'application/pdf': 'PDF', 'image/png': 'PNG', 'image/jpeg': 'JPG', 'image/webp': 'WebP',
};
const ext = (name: string) => name.split('.').pop()?.toLowerCase() ?? '';

export function isAccepted(file: FileLike, accept: string[]): boolean {
  if (file.type && accept.includes(file.type)) return true;
  const e = ext(file.name);
  return accept.some((m) => EXT_BY_MIME[m]?.includes(e));
}
export function rejectionReason(file: FileLike, accept: string[]): string | null {
  if (isAccepted(file, accept)) return null;
  const want = [...new Set(accept.map((m) => LABEL[m] ?? 'file'))].join(' or ');
  const got = LABEL[file.type] ?? (ext(file.name) ? ext(file.name).toUpperCase() : 'file');
  return `That's a ${got}. This tool needs a ${want}.`;
}
```

`download.ts`:

```ts
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
```

`privacyCopy.ts`:

```ts
export type ProcessingMode = 'local' | 'local-partial' | 'server';
export const PRIVACY_COPY: Record<ProcessingMode, { short: string; long: string }> = {
  local: {
    short: 'Processed on your device',
    long: 'This operation runs entirely on your device. No file upload, no cloud storage, no account.',
  },
  'local-partial': {
    short: 'Preview on your device (demo engine)',
    long: 'The preview runs on your device. The full processing engine is not yet connected, so no real transformation is applied.',
  },
  server: {
    short: 'Runs on a server',
    long: 'This operation runs on a server. Your file leaves your device for processing.',
  },
};
```

- [ ] **Step 4: Run → PASS. Commit**

```bash
git add -A && git commit -m "feat: lib utilities + privacy copy map

Claude-Session: https://claude.ai/code/session_01P5CGW7XmbuXSx91S6XXUfL"
```

---

## Task 5: Categories + tool registry (TDD)

**Files:** Create `src/tools/categories.ts`, `src/tools/registry.ts`; test `src/tools/registry.test.ts`.

**Interfaces:**
- `type Category = 'pdf' | 'image' | 'privacy' | 'ai'`
- `CATEGORIES: Record<Category, { label: string; accent: Category }>`
- `interface Tool { id; name; description; route; category: Category; icon: LucideIcon; shortcut?: string; processing: ProcessingMode; status: 'live'|'demo'; accept: string[] }`
- `TOOLS: Tool[]` — ids: `pdf-security`, `pdf-compress`, `pdf-merge`, `image-compress`, `image-upscale`, `privacy-center`
- `getTool(id): Tool | undefined`, `toolsByCategory(c): Tool[]`

- [ ] **Step 1: Failing test `src/tools/registry.test.ts`**

```ts
import { TOOLS, getTool, CATEGORIES } from './registry';

test('unique ids', () => {
  const ids = TOOLS.map((t) => t.id);
  expect(new Set(ids).size).toBe(ids.length);
});
test('routes absolute + unique', () => {
  const r = TOOLS.map((t) => t.route);
  r.forEach((x) => expect(x.startsWith('/')).toBe(true));
  expect(new Set(r).size).toBe(r.length);
});
test('categories resolve', () => {
  TOOLS.forEach((t) => expect(CATEGORIES[t.category]).toBeDefined());
});
test('non-privacy tools declare accept types', () => {
  TOOLS.filter((t) => t.id !== 'privacy-center')
    .forEach((t) => expect(t.accept.length).toBeGreaterThan(0));
});
test('mock/live flags', () => {
  expect(getTool('pdf-security')!.status).toBe('demo');
  expect(getTool('pdf-compress')!.status).toBe('demo');
  expect(getTool('image-upscale')!.status).toBe('demo');
  expect(getTool('pdf-merge')!.status).toBe('live');
  expect(getTool('image-compress')!.status).toBe('live');
});
test('exact tool set', () => {
  expect(TOOLS.map((t) => t.id).sort()).toEqual(
    ['image-compress', 'image-upscale', 'pdf-compress', 'pdf-merge', 'pdf-security', 'privacy-center'].sort(),
  );
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: `src/tools/categories.ts`**

```ts
export type Category = 'pdf' | 'image' | 'privacy' | 'ai';
export const CATEGORIES: Record<Category, { label: string; accent: Category }> = {
  pdf: { label: 'PDF', accent: 'pdf' },
  image: { label: 'Image', accent: 'image' },
  privacy: { label: 'Privacy', accent: 'privacy' },
  ai: { label: 'AI', accent: 'ai' },
};
```

- [ ] **Step 4: `src/tools/registry.ts`**

```ts
import { ShieldCheck, Minimize2, Combine, ImageDown, Sparkles, Lock, type LucideIcon } from 'lucide-react';
import type { Category } from './categories';
import type { ProcessingMode } from '../lib/privacyCopy';
export { CATEGORIES } from './categories';
export type { Category } from './categories';
export type { ProcessingMode } from '../lib/privacyCopy';

export interface Tool {
  id: string; name: string; description: string; route: string;
  category: Category; icon: LucideIcon; shortcut?: string;
  processing: ProcessingMode; status: 'live' | 'demo'; accept: string[];
}

const PDF = ['application/pdf'];
const IMG = ['image/png', 'image/jpeg', 'image/webp'];

export const TOOLS: Tool[] = [
  { id: 'pdf-security', name: 'PDF Security', description: 'Protect or unlock PDFs',
    route: '/pdf/security', category: 'pdf', icon: ShieldCheck,
    processing: 'local-partial', status: 'demo', accept: PDF },
  { id: 'pdf-compress', name: 'Compress PDF', description: 'Reduce file size, keep it readable',
    route: '/pdf/compress', category: 'pdf', icon: Minimize2,
    processing: 'local-partial', status: 'demo', accept: PDF },
  { id: 'pdf-merge', name: 'Merge PDF', description: 'Combine documents into one',
    route: '/pdf/merge', category: 'pdf', icon: Combine,
    processing: 'local', status: 'live', accept: PDF },
  { id: 'image-compress', name: 'Compress Image', description: 'Smaller images, same feeling',
    route: '/image/compress', category: 'image', icon: ImageDown,
    processing: 'local', status: 'live', accept: IMG },
  { id: 'image-upscale', name: 'Upscale Image', description: 'Enhance resolution and detail',
    route: '/image/upscale', category: 'ai', icon: Sparkles,
    processing: 'local-partial', status: 'demo', accept: IMG },
  { id: 'privacy-center', name: 'Privacy Center', description: 'How your files are handled',
    route: '/privacy', category: 'privacy', icon: Lock,
    processing: 'local', status: 'live', accept: [] },
];

export const getTool = (id: string) => TOOLS.find((t) => t.id === id);
export const toolsByCategory = (c: Category) => TOOLS.filter((t) => t.category === c);
```

- [ ] **Step 5: Run → PASS. Commit**

```bash
git add -A && git commit -m "feat: tool registry + categories (single source of truth)

Claude-Session: https://claude.ai/code/session_01P5CGW7XmbuXSx91S6XXUfL"
```

---

## Task 6: Service interfaces + privacy service (TDD)

**Files:** Create `src/services/types.ts`, `src/services/privacy.service.ts`; test `src/services/privacy.service.test.ts`.

**Interfaces:**
- `interface Progress { phase: string; ratio?: number }`
- `interface FileResult { blob: Blob; filename: string; originalBytes: number; outputBytes?: number; meta?: Record<string, string | number>; demo?: boolean }`
- `interface ToolService<C, R = FileResult> { process(input: File | File[], config: C, onProgress: (p: Progress) => void, signal: AbortSignal): Promise<R> }`
- `class ToolError extends Error { userMessage: string }`
- `interface PrivacyRow { toolId: string; name: string; mode: ProcessingMode; note: string }`
- `privacyStatus(): PrivacyRow[]`

- [ ] **Step 1: Failing test**

```ts
import { privacyStatus } from './privacy.service';
test('rows for every tool with mode + note', () => {
  const s = privacyStatus();
  expect(s.length).toBeGreaterThanOrEqual(5);
  s.forEach((r) => {
    expect(r.name).toBeTruthy();
    expect(['local', 'local-partial', 'server']).toContain(r.mode);
    expect(r.note).toBeTruthy();
  });
});
test('demo tools described honestly', () => {
  const sec = privacyStatus().find((r) => r.toolId === 'pdf-security')!;
  expect(sec.note.toLowerCase()).toMatch(/demo|preview|not yet|pending/);
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: `src/services/types.ts`**

```ts
export interface Progress { phase: string; ratio?: number }
export interface FileResult {
  blob: Blob; filename: string;
  originalBytes: number; outputBytes?: number;
  meta?: Record<string, string | number>; demo?: boolean;
}
export interface ToolService<C, R = FileResult> {
  process(input: File | File[], config: C, onProgress: (p: Progress) => void, signal: AbortSignal): Promise<R>;
}
export class ToolError extends Error {
  constructor(public userMessage: string, technical?: string) {
    super(technical ?? userMessage);
    this.name = 'ToolError';
  }
}
```

- [ ] **Step 4: `src/services/privacy.service.ts`**

```ts
import { TOOLS } from '../tools/registry';
import { PRIVACY_COPY, type ProcessingMode } from '../lib/privacyCopy';

export interface PrivacyRow { toolId: string; name: string; mode: ProcessingMode; note: string }

export function privacyStatus(): PrivacyRow[] {
  return TOOLS.filter((t) => t.id !== 'privacy-center').map((t) => ({
    toolId: t.id,
    name: t.name,
    mode: t.processing,
    note: t.status === 'demo' && t.processing !== 'server'
      ? PRIVACY_COPY['local-partial'].long
      : PRIVACY_COPY[t.processing].long,
  }));
}
```

- [ ] **Step 5: Run → PASS. Commit**

```bash
git add -A && git commit -m "feat: service interfaces + privacy status service

Claude-Session: https://claude.ai/code/session_01P5CGW7XmbuXSx91S6XXUfL"
```

---

## Task 7: PDF service — real merge + honest mock protect/compress (TDD)

**Files:** Create `src/services/pdf.service.ts`, `src/workers/pdf.worker.ts`; test `src/services/pdf.service.test.ts`.

**Interfaces:**
- Consumes `ToolService`, `FileResult`, `ToolError` (Task 6); fixtures (Task 2).
- `mergePdf: ToolService<Record<string, never>, FileResult>` — merges `File[]`; `meta.pages` = summed page count, `meta.documents` = input count; throws `ToolError` with `userMessage` mentioning "two" for <2 inputs.
- `estimateCompressedPdf(originalBytes: number, quality: number): number` — pure, monotonic in quality.
- `compressPdf: ToolService<{ preset: string; quality: number }, FileResult>` — mock; `demo: true`; `outputBytes` = estimate; `blob` = original unchanged.
- `protectPdf: ToolService<{ mode: 'add'|'remove'; password: string }, FileResult>` — mock; `demo: true`; throws `ToolError("Enter a password first.")` when password empty.

- [ ] **Step 1: Failing test `src/services/pdf.service.test.ts`**

```ts
import { readFileSync } from 'node:fs';
import { PDFDocument } from 'pdf-lib';
import { mergePdf, estimateCompressedPdf, protectPdf } from './pdf.service';

const f = (p: string, n: string) =>
  new File([readFileSync(new URL(p, import.meta.url))], n, { type: 'application/pdf' });

test('merge sums pages, returns valid pdf, reports phases', async () => {
  const phases: string[] = [];
  const res = await mergePdf.process(
    [f('../test/fixtures/a.pdf', 'a.pdf'), f('../test/fixtures/b.pdf', 'b.pdf')],
    {}, (p) => phases.push(p.phase), new AbortController().signal,
  );
  expect(res.meta!.pages).toBe(5);
  expect(res.meta!.documents).toBe(2);
  expect((await PDFDocument.load(await res.blob.arrayBuffer())).getPageCount()).toBe(5);
  expect(phases.length).toBeGreaterThan(0);
});

test('merge rejects single file', async () => {
  await expect(
    mergePdf.process([f('../test/fixtures/a.pdf', 'a.pdf')], {}, () => {}, new AbortController().signal),
  ).rejects.toMatchObject({ userMessage: expect.stringMatching(/two/i) });
});

test('estimate monotonic in quality', () => {
  expect(estimateCompressedPdf(1000, 0.2)).toBeLessThan(estimateCompressedPdf(1000, 0.9));
});

test('protect requires a password', async () => {
  await expect(
    protectPdf.process(f('../test/fixtures/a.pdf', 'a.pdf'), { mode: 'add', password: '' },
      () => {}, new AbortController().signal),
  ).rejects.toMatchObject({ userMessage: expect.stringMatching(/password/i) });
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: `src/services/pdf.service.ts`**

```ts
import { PDFDocument } from 'pdf-lib';
import type { FileResult, Progress, ToolService } from './types';
import { ToolError } from './types';

// ponytail: merge runs pdf-lib on the main thread — fast enough for typical inputs and
// fully testable. src/workers/pdf.worker.ts holds the offload path if profiling demands it.
async function mergeCore(files: File[], onProgress: (p: Progress) => void, signal: AbortSignal): Promise<FileResult> {
  if (files.length < 2) throw new ToolError('Add at least two PDFs to merge.');
  const merged = await PDFDocument.create();
  let originalBytes = 0;
  for (let i = 0; i < files.length; i++) {
    if (signal.aborted) throw new ToolError('Cancelled.');
    onProgress({ phase: `Adding ${files[i].name}`, ratio: i / files.length });
    const bytes = await files[i].arrayBuffer();
    originalBytes += bytes.byteLength;
    const doc = await PDFDocument.load(bytes).catch(() => {
      throw new ToolError(`${files[i].name} could not be read as a PDF.`);
    });
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
  }
  onProgress({ phase: 'Finishing', ratio: 0.95 });
  const out = await merged.save();
  return {
    blob: new Blob([out], { type: 'application/pdf' }),
    filename: 'merged.pdf',
    originalBytes,
    outputBytes: out.byteLength,
    meta: { pages: merged.getPageCount(), documents: files.length },
  };
}

export const mergePdf: ToolService<Record<string, never>, FileResult> = {
  process: (input, _c, onProgress, signal) =>
    mergeCore(Array.isArray(input) ? input : [input], onProgress, signal),
};

export function estimateCompressedPdf(originalBytes: number, quality: number): number {
  const floor = 0.15;
  return Math.round(originalBytes * (floor + (1 - floor) * quality ** 1.5));
}

const wait = (ms: number, signal: AbortSignal) =>
  new Promise<void>((res, rej) => {
    const t = setTimeout(res, ms);
    signal.addEventListener('abort', () => { clearTimeout(t); rej(new ToolError('Cancelled.')); });
  });

export const compressPdf: ToolService<{ preset: string; quality: number }, FileResult> = {
  async process(input, config, onProgress, signal) {
    const file = Array.isArray(input) ? input[0] : input;
    for (const phase of ['Analyzing document', 'Recompressing images', 'Rewriting structure']) {
      onProgress({ phase });
      await wait(650, signal);
    }
    return {
      blob: file,
      filename: file.name,
      originalBytes: file.size,
      outputBytes: estimateCompressedPdf(file.size, config.quality),
      demo: true,
      meta: { estimate: 1 },
    };
  },
};

export const protectPdf: ToolService<{ mode: 'add' | 'remove'; password: string }, FileResult> = {
  async process(input, config, onProgress, signal) {
    const file = Array.isArray(input) ? input[0] : input;
    if (!config.password) throw new ToolError('Enter a password first.');
    const phases = config.mode === 'add'
      ? ['Preparing document', 'Encrypting', 'Sealing']
      : ['Reading document', 'Validating password', 'Unlocking'];
    for (const phase of phases) { onProgress({ phase }); await wait(600, signal); }
    return { blob: file, filename: file.name, originalBytes: file.size, demo: true };
  },
};
```

- [ ] **Step 4: `src/workers/pdf.worker.ts`** (headroom, not wired)

```ts
/// <reference lib="webworker" />
import { PDFDocument } from 'pdf-lib';
declare const self: DedicatedWorkerGlobalScope;

self.onmessage = async (e: MessageEvent<{ buffers: ArrayBuffer[] }>) => {
  try {
    const merged = await PDFDocument.create();
    for (const buf of e.data.buffers) {
      const doc = await PDFDocument.load(buf);
      (await merged.copyPages(doc, doc.getPageIndices())).forEach((p) => merged.addPage(p));
      self.postMessage({ type: 'progress' });
    }
    const out = await merged.save();
    self.postMessage({ type: 'done', bytes: out, pages: merged.getPageCount() }, [out.buffer]);
  } catch (err) {
    self.postMessage({ type: 'error', message: (err as Error).message });
  }
};
```

- [ ] **Step 5: Run → PASS. Commit**

```bash
git add -A && git commit -m "feat: pdf service — real merge, honest mock protect/compress

Claude-Session: https://claude.ai/code/session_01P5CGW7XmbuXSx91S6XXUfL"
```

---

## Task 8: Image compress (real) + upscale (honest preview) services (TDD)

**Files:** Create `src/services/image.encode.ts`, `src/services/image.service.ts`, `src/services/upscale.service.ts`; test `src/services/image.service.test.ts`.

**Interfaces:**
- `encode(file: File, format: string, quality: number): Promise<Blob>` — canvas re-encode (browser); isolated for mocking.
- `estimateCompressedImage(originalBytes: number, quality: number, format: string): number` — pure, monotonic in quality (except PNG which is quality-independent).
- `compressImage: ToolService<{ quality: number; format: 'image/jpeg'|'image/png'|'image/webp'; maxBytes?: number }, FileResult>` — real; `blob.type` = chosen format; `outputBytes` = `blob.size`.
- `upscaleImage: ToolService<{ scale: 2|4; sharpness: number; noise: number; face: number }, FileResult>` — real bicubic canvas scale; `demo: true`; `meta.from`/`meta.to` dimension strings; `meta.note` explains AI pending. Phases: `Analyzing image`, `Detecting details`, `Enhancing resolution`, `Reconstructing pixels`.

- [ ] **Step 1: Failing test `src/services/image.service.test.ts`**

```ts
import { compressImage, estimateCompressedImage } from './image.service';

vi.mock('./image.encode', () => ({
  encode: async (_f: File, format: string) => new Blob([new Uint8Array(128)], { type: format }),
}));

test('returns blob with requested format', async () => {
  const res = await compressImage.process(
    new File([new Uint8Array(4096)], 'p.jpg', { type: 'image/jpeg' }),
    { quality: 0.6, format: 'image/webp' }, () => {}, new AbortController().signal,
  );
  expect(res.blob.type).toBe('image/webp');
  expect(res.outputBytes).toBe(res.blob.size);
  expect(res.originalBytes).toBe(4096);
});

test('estimate decreases with quality', () => {
  expect(estimateCompressedImage(10000, 0.3, 'image/jpeg'))
    .toBeLessThan(estimateCompressedImage(10000, 0.9, 'image/jpeg'));
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement**

`image.encode.ts`:

```ts
export async function encode(file: File, format: string, quality: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode failed'))), format, quality),
  );
}
```

`image.service.ts`:

```ts
import type { FileResult, Progress, ToolService } from './types';
import { ToolError } from './types';
import { encode } from './image.encode';

const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export function estimateCompressedImage(originalBytes: number, quality: number, format: string): number {
  const base = format === 'image/png' ? 0.85 : 0.1 + 0.8 * quality ** 1.4;
  return Math.round(originalBytes * base);
}

export const compressImage: ToolService<
  { quality: number; format: 'image/jpeg' | 'image/png' | 'image/webp'; maxBytes?: number }, FileResult
> = {
  async process(input, config, onProgress: (p: Progress) => void, signal) {
    const file = Array.isArray(input) ? input[0] : input;
    if (signal.aborted) throw new ToolError('Cancelled.');
    onProgress({ phase: 'Decoding image', ratio: 0.2 });
    let blob = await encode(file, config.format, config.quality).catch(() => {
      throw new ToolError('This image could not be processed.');
    });
    onProgress({ phase: 'Re-encoding', ratio: 0.7 });
    if (config.maxBytes) {
      for (let q = config.quality; q > 0.3 && blob.size > config.maxBytes; q -= 0.15) {
        blob = await encode(file, config.format, q);
      }
    }
    onProgress({ phase: 'Done', ratio: 1 });
    const stem = file.name.replace(/\.[^.]+$/, '');
    return {
      blob, filename: `${stem}.${EXT[config.format]}`,
      originalBytes: file.size, outputBytes: blob.size, meta: { format: EXT[config.format] },
    };
  },
};
```

`upscale.service.ts`:

```ts
import type { FileResult, ToolService } from './types';
import { ToolError } from './types';

const PHASES = ['Analyzing image', 'Detecting details', 'Enhancing resolution', 'Reconstructing pixels'];

export const upscaleImage: ToolService<
  { scale: 2 | 4; sharpness: number; noise: number; face: number }, FileResult
> = {
  async process(input, config, onProgress, signal) {
    const file = Array.isArray(input) ? input[0] : input;
    const bitmap = await createImageBitmap(file).catch(() => {
      throw new ToolError('This image could not be processed.');
    });
    for (let i = 0; i < PHASES.length; i++) {
      if (signal.aborted) throw new ToolError('Cancelled.');
      onProgress({ phase: PHASES[i], ratio: (i + 1) / PHASES.length });
      await new Promise((r) => setTimeout(r, 700));
    }
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width * config.scale;
    canvas.height = bitmap.height * config.scale;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const from = `${bitmap.width}×${bitmap.height}`;
    const to = `${canvas.width}×${canvas.height}`;
    bitmap.close();
    const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), 'image/png'));
    const stem = file.name.replace(/\.[^.]+$/, '');
    return {
      blob, filename: `${stem}@${config.scale}x.png`,
      originalBytes: file.size, outputBytes: blob.size, demo: true,
      meta: { from, to, note: 'Preview upscale (bicubic). AI enhancement engine not yet connected.' },
    };
  },
};
```

- [ ] **Step 4: Run → PASS. Commit**

```bash
git add -A && git commit -m "feat: image compress (real) + upscale (honest preview) services

Claude-Session: https://claude.ai/code/session_01P5CGW7XmbuXSx91S6XXUfL"
```

---

## Task 9: Prefs store + handoff store + selector hooks (TDD)

**Files:** Create `src/store/prefs.store.ts`, `src/store/handoff.store.ts`, `src/hooks/useFavorites.ts`, `src/hooks/useRecent.ts`; test `src/store/prefs.store.test.ts`.

**Interfaces:**
- `usePrefs` (zustand, persisted `privytools:prefs`): `{ favorites: string[]; recent: string[]; theme: 'system'|'light'|'dark'; telemetry: boolean; sidebarCollapsed: boolean; privacyMode: boolean; toggleFavorite(id); pushRecent(id); setTheme(t); setTelemetry(b); toggleSidebar(); setPrivacyMode(b) }` — `theme` default `'system'`.
- `useHandoff` (not persisted): `{ pendingFile: File | null; setPendingFile(f); consume(): File | null }`
- `useFavorites()` → `{ favorites; isFavorite(id); toggle(id) }`
- `useRecent()` → `{ recent; push(id) }` — cap 5, most-recent-first, deduped

- [ ] **Step 1: Failing test `src/store/prefs.store.test.ts`**

```ts
import { usePrefs } from './prefs.store';

beforeEach(() => {
  localStorage.clear();
  usePrefs.setState({ favorites: [], recent: [], theme: 'system', telemetry: false });
});

test('toggleFavorite adds then removes', () => {
  usePrefs.getState().toggleFavorite('pdf-merge');
  expect(usePrefs.getState().favorites).toEqual(['pdf-merge']);
  usePrefs.getState().toggleFavorite('pdf-merge');
  expect(usePrefs.getState().favorites).toEqual([]);
});
test('pushRecent caps 5, recent-first, deduped', () => {
  ['a', 'b', 'c', 'd', 'e', 'f', 'b'].forEach((id) => usePrefs.getState().pushRecent(id));
  expect(usePrefs.getState().recent).toEqual(['b', 'f', 'e', 'd', 'c']);
});
test('persists theme', () => {
  usePrefs.getState().setTheme('dark');
  expect(localStorage.getItem('privytools:prefs')!).toMatch(/dark/);
});
test('never stores file-shaped data', () => {
  usePrefs.getState().pushRecent('pdf-merge');
  expect(localStorage.getItem('privytools:prefs')!).not.toMatch(/blob:|data:|ArrayBuffer/);
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement**

`prefs.store.ts`:

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'system' | 'light' | 'dark';
interface PrefsState {
  favorites: string[]; recent: string[]; theme: Theme;
  telemetry: boolean; sidebarCollapsed: boolean; privacyMode: boolean;
  toggleFavorite: (id: string) => void;
  pushRecent: (id: string) => void;
  setTheme: (t: Theme) => void;
  setTelemetry: (b: boolean) => void;
  toggleSidebar: () => void;
  setPrivacyMode: (b: boolean) => void;
}

export const usePrefs = create<PrefsState>()(
  persist(
    (set) => ({
      favorites: [], recent: [], theme: 'system',
      telemetry: false, sidebarCollapsed: false, privacyMode: true,
      toggleFavorite: (id) => set((s) => ({
        favorites: s.favorites.includes(id)
          ? s.favorites.filter((x) => x !== id) : [...s.favorites, id],
      })),
      pushRecent: (id) => set((s) => ({
        recent: [id, ...s.recent.filter((x) => x !== id)].slice(0, 5),
      })),
      setTheme: (theme) => set({ theme }),
      setTelemetry: (telemetry) => set({ telemetry }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setPrivacyMode: (privacyMode) => set({ privacyMode }),
    }),
    {
      name: 'privytools:prefs',
      partialize: (s) => ({
        favorites: s.favorites, recent: s.recent, theme: s.theme,
        telemetry: s.telemetry, sidebarCollapsed: s.sidebarCollapsed, privacyMode: s.privacyMode,
      }),
    },
  ),
);
```

`handoff.store.ts`:

```ts
import { create } from 'zustand';
interface HandoffState {
  pendingFile: File | null;
  setPendingFile: (f: File | null) => void;
  consume: () => File | null;
}
export const useHandoff = create<HandoffState>((set, get) => ({
  pendingFile: null,
  setPendingFile: (pendingFile) => set({ pendingFile }),
  consume: () => { const f = get().pendingFile; set({ pendingFile: null }); return f; },
}));
```

`useFavorites.ts`:

```ts
import { usePrefs } from '../store/prefs.store';
export function useFavorites() {
  const favorites = usePrefs((s) => s.favorites);
  const toggle = usePrefs((s) => s.toggleFavorite);
  return { favorites, isFavorite: (id: string) => favorites.includes(id), toggle };
}
```

`useRecent.ts`:

```ts
import { usePrefs } from '../store/prefs.store';
export function useRecent() {
  const recent = usePrefs((s) => s.recent);
  const push = usePrefs((s) => s.pushRecent);
  return { recent, push };
}
```

- [ ] **Step 4: Run → PASS. Commit**

```bash
git add -A && git commit -m "feat: prefs store (persisted, non-sensitive) + handoff store + selector hooks

Claude-Session: https://claude.ai/code/session_01P5CGW7XmbuXSx91S6XXUfL"
```

---

## Task 10: Core hooks — useReducedMotion, useObjectUrl, useDropzone (TDD)

**Files:** Create `src/hooks/{useReducedMotion,useObjectUrl,useDropzone}.ts`; test `src/hooks/useObjectUrl.test.tsx`.

**Interfaces:**
- `useReducedMotion(): boolean` — `matchMedia('(prefers-reduced-motion: reduce)')`, live.
- `useObjectUrl(blob: Blob | null): string | null` — creates on change, revokes previous + on unmount.
- `useDropzone({ accept, multiple?, onFile, onReject? })` → `{ isDragging, open(), inputProps, rootProps }` — validates via `fileValidation`, calls `onFile(File | File[])` or `onReject(reason)`.

- [ ] **Step 1: Failing test `src/hooks/useObjectUrl.test.tsx`**

```tsx
import { renderHook } from '@testing-library/react';
import { useObjectUrl } from './useObjectUrl';

test('creates and revokes on change', () => {
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:x');
  const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  const { result, rerender } = renderHook(({ b }) => useObjectUrl(b), {
    initialProps: { b: new Blob(['a']) as Blob | null },
  });
  expect(result.current).toBe('blob:x');
  rerender({ b: null });
  expect(revoke).toHaveBeenCalledWith('blob:x');
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement**

`useObjectUrl.ts`:

```ts
import { useEffect, useState } from 'react';
export function useObjectUrl(blob: Blob | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!blob) { setUrl(null); return; }
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return url;
}
```

`useReducedMotion.ts`:

```ts
import { useSyncExternalStore } from 'react';
const q = () => window.matchMedia('(prefers-reduced-motion: reduce)');
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (cb) => { const m = q(); m.addEventListener('change', cb); return () => m.removeEventListener('change', cb); },
    () => q().matches,
    () => false,
  );
}
```

`useDropzone.ts`:

```ts
import { useCallback, useRef, useState } from 'react';
import { isAccepted, rejectionReason } from '../lib/fileValidation';

interface Opts {
  accept: string[];
  multiple?: boolean;
  onFile: (f: File | File[]) => void;
  onReject?: (reason: string) => void;
}

export function useDropzone({ accept, multiple = false, onFile, onReject }: Opts) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setDragging] = useState(false);
  const depth = useRef(0);

  const handleFiles = useCallback((list: FileList | null) => {
    if (!list?.length) return;
    const files = [...list];
    const bad = files.find((f) => !isAccepted(f, accept));
    if (bad) { onReject?.(rejectionReason(bad, accept) ?? 'Unsupported file.'); return; }
    onFile(multiple ? files : files[0]);
  }, [accept, multiple, onFile, onReject]);

  return {
    isDragging,
    open: () => inputRef.current?.click(),
    inputProps: {
      ref: inputRef, type: 'file' as const, hidden: true,
      accept: accept.join(','), multiple,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files),
    },
    rootProps: {
      onDragEnter: (e: React.DragEvent) => { e.preventDefault(); depth.current++; setDragging(true); },
      onDragOver: (e: React.DragEvent) => e.preventDefault(),
      onDragLeave: (e: React.DragEvent) => { e.preventDefault(); if (--depth.current <= 0) setDragging(false); },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault(); depth.current = 0; setDragging(false);
        handleFiles(e.dataTransfer.files);
      },
    },
  };
}
```

- [ ] **Step 4: Run → PASS. Commit**

```bash
git add -A && git commit -m "feat: useReducedMotion, useObjectUrl, useDropzone hooks

Claude-Session: https://claude.ai/code/session_01P5CGW7XmbuXSx91S6XXUfL"
```

---

## Task 11: useToolRunner state machine (TDD)

**Files:** Create `src/hooks/useToolRunner.ts`; test `src/hooks/useToolRunner.test.tsx`.

**Interfaces:**
- Consumes `ToolService`, `Progress`, `FileResult`, `ToolError` (Task 6).
- `useToolRunner<C>(service: ToolService<C>, initialConfig: C)` → `{ step: 'select'|'configure'|'process'|'result'|'error'; file: File | null; files: File[]; config: C; setConfig(partial: Partial<C>); progress: Progress | null; result: FileResult | null; error: string | null; selectFile(f: File | File[]); run(): Promise<void>; cancel(); reset() }`
- `step` starts `select`; `selectFile` → `configure`; `run` → `process` → `result` | `error`; `reset` → `select` clearing all + aborting; `cancel` aborts → `configure`.

- [ ] **Step 1: Failing test `src/hooks/useToolRunner.test.tsx`**

```tsx
import { renderHook, act } from '@testing-library/react';
import { useToolRunner } from './useToolRunner';
import type { ToolService } from '../services/types';
import { ToolError } from '../services/types';

const ok: ToolService<{ n: number }> = {
  async process(_i, _c, onProgress) {
    onProgress({ phase: 'working', ratio: 0.5 });
    return { blob: new Blob(['x']), filename: 'o.bin', originalBytes: 1, outputBytes: 1 };
  },
};
const boom: ToolService<{ n: number }> = { async process() { throw new ToolError('nope'); } };

test('happy path', async () => {
  const { result } = renderHook(() => useToolRunner(ok, { n: 1 }));
  expect(result.current.step).toBe('select');
  act(() => result.current.selectFile(new File(['a'], 'a.bin')));
  expect(result.current.step).toBe('configure');
  await act(async () => { await result.current.run(); });
  expect(result.current.step).toBe('result');
  expect(result.current.result?.filename).toBe('o.bin');
});
test('error path', async () => {
  const { result } = renderHook(() => useToolRunner(boom, { n: 1 }));
  act(() => result.current.selectFile(new File(['a'], 'a.bin')));
  await act(async () => { await result.current.run(); });
  expect(result.current.step).toBe('error');
  expect(result.current.error).toBe('nope');
});
test('reset clears', async () => {
  const { result } = renderHook(() => useToolRunner(ok, { n: 1 }));
  act(() => result.current.selectFile(new File(['a'], 'a.bin')));
  await act(async () => { await result.current.run(); });
  act(() => result.current.reset());
  expect(result.current.step).toBe('select');
  expect(result.current.result).toBeNull();
  expect(result.current.file).toBeNull();
});
test('setConfig merges', () => {
  const { result } = renderHook(() => useToolRunner(ok, { n: 1 }));
  act(() => result.current.setConfig({ n: 9 }));
  expect(result.current.config.n).toBe(9);
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement `src/hooks/useToolRunner.ts`**

```ts
import { useCallback, useRef, useState } from 'react';
import type { FileResult, Progress, ToolService } from '../services/types';
import { ToolError } from '../services/types';

type Step = 'select' | 'configure' | 'process' | 'result' | 'error';

export function useToolRunner<C>(service: ToolService<C>, initialConfig: C) {
  const [step, setStep] = useState<Step>('select');
  const [files, setFiles] = useState<File[]>([]);
  const [config, setConfigState] = useState<C>(initialConfig);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [result, setResult] = useState<FileResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const setConfig = useCallback((partial: Partial<C>) => {
    setConfigState((c) => ({ ...c, ...partial }));
  }, []);

  const selectFile = useCallback((f: File | File[]) => {
    setFiles(Array.isArray(f) ? f : [f]);
    setError(null); setResult(null); setStep('configure');
  }, []);

  const run = useCallback(async () => {
    if (!files.length) return;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setStep('process'); setProgress({ phase: 'Starting' }); setError(null);
    try {
      const input = files.length === 1 ? files[0] : files;
      const res = await service.process(input, config, setProgress, ac.signal);
      if (ac.signal.aborted) return;
      setResult(res); setStep('result');
    } catch (e) {
      if (ac.signal.aborted) return;
      const msg = e instanceof ToolError ? e.userMessage : "We couldn't process this file.";
      if (import.meta.env.DEV) console.warn('[tool]', (e as Error).message);
      setError(msg); setStep('error');
    }
  }, [files, config, service]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setStep(files.length ? 'configure' : 'select');
  }, [files.length]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setFiles([]); setProgress(null); setResult(null); setError(null); setStep('select');
  }, []);

  return {
    step, file: files[0] ?? null, files, config, setConfig,
    progress, result, error, selectFile, run, cancel, reset,
  };
}
```

- [ ] **Step 4: Run → PASS. Commit**

```bash
git add -A && git commit -m "feat: useToolRunner SELECT->CONFIGURE->PROCESS->RESULT state machine

Claude-Session: https://claude.ai/code/session_01P5CGW7XmbuXSx91S6XXUfL"
```

---

## Task 12: UI primitives — Button, Kbd, Badge, Card (TDD on Button)

**Files:** Create `src/components/ui/{Button,Kbd,Badge,Card}.tsx`, `src/components/ui/index.ts`; test `src/components/ui/Button.test.tsx`.

**Interfaces:**
- `Button` — `variant?: 'primary'|'ghost'|'subtle'` (default `subtle`), `size?: 'sm'|'md'` (default `md`), native button props, `forwardRef`. Disabled sets `aria-disabled` and blocks clicks.
- `Kbd` — styled `<kbd>`, mono, `text-xs`.
- `Badge` — `tone?: 'neutral'|'accent'|'warn'` (default `neutral`).
- `Card` — `as?: 'div'|'a'|'button'` (default `div`), `interactive?: boolean` (hover lift + border brighten). Surface + border + `rounded-lg`.
- `index.ts` re-exports all `ui/` components (extended in Task 13).

- [ ] **Step 1: Failing test `src/components/ui/Button.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

test('calls onClick', async () => {
  const fn = vi.fn();
  render(<Button onClick={fn}>Go</Button>);
  await userEvent.click(screen.getByRole('button', { name: 'Go' }));
  expect(fn).toHaveBeenCalled();
});
test('disabled blocks click', async () => {
  const fn = vi.fn();
  render(<Button disabled onClick={fn}>Go</Button>);
  await userEvent.click(screen.getByRole('button'));
  expect(fn).not.toHaveBeenCalled();
});
test('variant class applied', () => {
  render(<Button variant="primary">Go</Button>);
  expect(screen.getByRole('button').className).toMatch(/bg-/);
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement**

`Button.tsx`:

```tsx
import { forwardRef } from 'react';
import { cn } from '../../lib/cn';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'subtle';
  size?: 'sm' | 'md';
};
const V = {
  primary: 'bg-text text-bg hover:opacity-90',
  ghost: 'bg-transparent hover:bg-surface-hi text-text',
  subtle: 'bg-surface-hi border border-border hover:border-border-hi text-text',
};
const S = { sm: 'h-8 px-3 text-sm', md: 'h-10 px-4 text-sm' };

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ variant = 'subtle', size = 'md', className, disabled, ...rest }, ref) => (
    <button
      ref={ref}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium',
        'transition-[background,border,opacity,transform] duration-200 ease-expo',
        'disabled:opacity-40 disabled:pointer-events-none',
        V[variant], S[size], className,
      )}
      {...rest}
    />
  ),
);
Button.displayName = 'Button';
```

`Kbd.tsx`, `Badge.tsx`, `Card.tsx` — small presentational components per interface. `Badge` tone map: neutral `bg-surface-hi text-dim border-border`, accent `text-accent border-accent/30`, warn `text-amber-400 border-amber-400/30`.

- [ ] **Step 4: Run → PASS. Commit**

```bash
git add -A && git commit -m "feat: ui primitives — Button, Kbd, Badge, Card

Claude-Session: https://claude.ai/code/session_01P5CGW7XmbuXSx91S6XXUfL"
```

---

## Task 13: UI primitives — Input, Slider, Segmented, Dialog, Dropdown, Tooltip (TDD on Segmented + Dialog)

**Files:** Create `src/components/ui/{Input,Slider,Segmented,Dialog,Dropdown,Tooltip}.tsx`; modify `src/components/ui/index.ts`; test `src/components/ui/{Segmented,Dialog}.test.tsx`.

**Interfaces:**
- `Input` — native `<input>`, `forwardRef`, optional `trailing?: ReactNode` slot, `aria-label` required if no visible label.
- `Slider` — controlled `value: number`, `min`, `max`, `step`, `onChange(n: number)`, `leftLabel?: string`, `rightLabel?: string`; native `<input type="range">` styled.
- `Segmented<T extends string>` — `options: { value: T; label: string }[]`, `value: T`, `onChange(v: T)`, `aria-label: string`; `role="radiogroup"`, roving tabindex, ArrowLeft/Right/Up/Down move + call `onChange`.
- `Dialog` — `open: boolean`, `onClose()`, `title: string`, `children`; native `<dialog>`, `showModal()`/`close()`, `cancel` event → `onClose`, returns `null` in DOM when closed (do not render children).
- `Dropdown` — `trigger: ReactNode`, `children` (menu items); `role="menu"`, ArrowUp/Down, Esc closes.
- `Tooltip` — `content: string`, `children`; shows on hover/focus after 400ms; `role="tooltip"` + `aria-describedby`.

- [ ] **Step 1: Failing tests**

`Segmented.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Segmented } from './Segmented';

const opts = [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }, { value: 'c', label: 'C' }];
test('click calls onChange', async () => {
  const fn = vi.fn();
  render(<Segmented options={opts} value="a" onChange={fn} aria-label="x" />);
  await userEvent.click(screen.getByRole('radio', { name: 'B' }));
  expect(fn).toHaveBeenCalledWith('b');
});
test('arrow key moves', async () => {
  const fn = vi.fn();
  render(<Segmented options={opts} value="a" onChange={fn} aria-label="x" />);
  screen.getByRole('radio', { name: 'A' }).focus();
  await userEvent.keyboard('{ArrowRight}');
  expect(fn).toHaveBeenCalledWith('b');
});
```

`Dialog.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dialog } from './Dialog';

test('Esc closes', async () => {
  const onClose = vi.fn();
  render(<Dialog open title="T" onClose={onClose}><p>body</p></Dialog>);
  await userEvent.keyboard('{Escape}');
  expect(onClose).toHaveBeenCalled();
});
test('no children when closed', () => {
  render(<Dialog open={false} title="T" onClose={() => {}}><p>body</p></Dialog>);
  expect(screen.queryByText('body')).toBeNull();
});
```

Note: jsdom `HTMLDialogElement.showModal` may be unimplemented — in `Dialog.tsx` guard with `typeof el.showModal === 'function'` and fall back to a `[role=dialog]` div with an Esc `keydown` listener. The test only needs Esc→onClose and closed→no-render.

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement all six** (each ≤ ~85 lines).

- [ ] **Step 4: Run → PASS. Commit**

```bash
git add -A && git commit -m "feat: ui primitives — Input, Slider, Segmented, Dialog, Dropdown, Tooltip

Claude-Session: https://claude.ai/code/session_01P5CGW7XmbuXSx91S6XXUfL"
```

---

## Task 14: motion presets + ThemeProvider (TDD on ThemeProvider)

**Files:** Create `src/design/motion.ts`, `src/app/ThemeProvider.tsx`; test `src/app/ThemeProvider.test.tsx`.

**Interfaces:**
- `motion.ts`: `fade`, `slideUp`, `scaleIn`, `routeTransition` (`Variants`); `stagger(gap?: number): Variants`; `springSoft`; `maybe(v: Variants, reduced: boolean): Variants` → `fade` when reduced.
- `ThemeProvider` — reads `usePrefs(s => s.theme)`, resolves `system` via `matchMedia('(prefers-color-scheme: dark)')`. Sets `document.documentElement.dataset.mode` to `'light'` | `'dark'` (Porcelain is the bare `:root`, Carbon is `[data-mode='dark']`). Updates on theme change and media change. Renders children.

- [ ] **Step 1: Failing test `src/app/ThemeProvider.test.tsx`**

```tsx
import { render } from '@testing-library/react';
import { act } from 'react';
import { ThemeProvider } from './ThemeProvider';
import { usePrefs } from '../store/prefs.store';

test('sets data-mode from prefs.theme', () => {
  act(() => usePrefs.setState({ theme: 'light' }));
  render(<ThemeProvider><div /></ThemeProvider>);
  expect(document.documentElement.dataset.mode).toBe('light');
  act(() => usePrefs.setState({ theme: 'dark' }));
  expect(document.documentElement.dataset.mode).toBe('dark');
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement**

`motion.ts`:

```ts
import type { Variants } from 'framer-motion';
export const fade: Variants = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };
export const slideUp: Variants = {
  initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 },
};
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.96 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.98 },
};
export const routeTransition: Variants = {
  initial: { opacity: 0, y: 4 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -4 },
};
export const springSoft = { type: 'spring', stiffness: 220, damping: 28 } as const;
export const stagger = (gap = 0.04): Variants => ({ animate: { transition: { staggerChildren: gap } } });
export const maybe = (v: Variants, reduced: boolean): Variants => (reduced ? fade : v);
```

`ThemeProvider.tsx`:

```tsx
import { useEffect } from 'react';
import { usePrefs } from '../store/prefs.store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = usePrefs((s) => s.theme);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const mode = theme === 'system' ? (mq.matches ? 'dark' : 'light') : theme;
      document.documentElement.dataset.mode = mode;
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);
  return <>{children}</>;
}
```

- [ ] **Step 4: Run → PASS. Commit**

```bash
git add -A && git commit -m "feat: motion presets + ThemeProvider

Claude-Session: https://claude.ai/code/session_01P5CGW7XmbuXSx91S6XXUfL"
```

---

## Task 15: AppShell + routing skeleton (TDD)

**Files:** Create `src/app/AppShell.tsx`, `src/app/routes.tsx`, `src/routes/NotFound.tsx`, stub `src/routes/{Dashboard,PdfSecurity,PdfCompress,PdfMerge,ImageCompress,ImageUpscale,Privacy,DesignSystem}.tsx`; modify `src/main.tsx`; test `src/app/routes.test.tsx`.

**Interfaces:**
- `routeObjects: RouteObject[]` and `router` (createBrowserRouter). `AppShell` is the layout route; children: index → `Dashboard`; six tool routes (map from `TOOLS`); `/_ds` → `DesignSystem` only when `import.meta.env.DEV`; `*` → `NotFound`. Each route element lazy-loaded.
- Route `errorElement` — component with the tool `ErrorState` visual (no stack trace). For Task 15 a minimal inline version; unify in Task 20 if convenient.
- `AppShell` renders `<ThemeProvider>` + CSS grid: `aside#sidebar-slot` (hidden `<lg`) | column of `header#topbar-slot` + scroll area with `<AnimatePresence mode="wait">` route transition wrapping `<Outlet/>` + `nav#mobilenav-slot` (hidden `≥lg`). Slots are placeholders until Task 16.
- Each stub route: `export default function X() { return <main role="main" className="p-8">X</main>; }`

- [ ] **Step 1: Failing test `src/app/routes.test.tsx`**

```tsx
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { routeObjects } from './routes';
import { TOOLS } from '../tools/registry';

const mountAt = (path: string) =>
  render(<RouterProvider router={createMemoryRouter(routeObjects, { initialEntries: [path] })} />);

test('every tool route renders a main', async () => {
  for (const t of TOOLS) {
    mountAt(t.route);
    expect(await screen.findByRole('main')).toBeInTheDocument();
  }
});
test('unknown route shows NotFound', async () => {
  mountAt('/nope');
  expect(await screen.findByText(/can.?t find that/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement.**

`AppShell.tsx`:

```tsx
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ThemeProvider } from './ThemeProvider';
import { routeTransition } from '../design/motion';
import { useReducedMotion } from '../hooks/useReducedMotion';

export function AppShell() {
  const loc = useLocation();
  const reduced = useReducedMotion();
  return (
    <ThemeProvider>
      <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-3">
        Skip to content
      </a>
      <div className="grid h-full grid-cols-1 lg:grid-cols-[240px_1fr]">
        <aside id="sidebar-slot" className="hidden lg:block border-r border-border" />
        <div className="flex min-w-0 flex-col">
          <header id="topbar-slot" className="h-14 border-b border-border" />
          <div id="content" className="min-h-0 flex-1 overflow-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={loc.pathname}
                variants={reduced ? undefined : routeTransition}
                initial="initial" animate="animate" exit="exit"
                transition={{ duration: 0.2 }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
          <nav id="mobilenav-slot" className="lg:hidden border-t border-border" />
        </div>
      </div>
    </ThemeProvider>
  );
}
```

`routes.tsx` builds `routeObjects` with `{ path: '/', element: <AppShell/>, children: [...] }`, lazy elements via `React.lazy` + `<Suspense>`. `main.tsx` → `<RouterProvider router={router} />`.

- [ ] **Step 4: Run → PASS. `npm run dev` — visit `/`, `/pdf/merge`, `/nope`. Commit**

```bash
git add -A && git commit -m "feat: AppShell layout + full route table + NotFound

Claude-Session: https://claude.ai/code/session_01P5CGW7XmbuXSx91S6XXUfL"
```

---

## Task 16: Sidebar + Topbar + MobileNav (TDD on Sidebar)

**Files:** Create `src/app/{Sidebar,Topbar,MobileNav}.tsx`; modify `src/app/AppShell.tsx` (fill slots); test `src/app/Sidebar.test.tsx`.

**Interfaces:**
- Consumes `TOOLS`, `CATEGORIES`, `toolsByCategory`, `useFavorites`, `useRecent`, `usePrefs` (`sidebarCollapsed`, `toggleSidebar`), `getTool`.
- `Sidebar` — logo; Home `NavLink` to `/`; a group per category (`pdf`, `image`, `privacy`, `ai`) with its tools as `NavLink`s to `tool.route`; Favorites section (tools from `favorites`); Recent section (tools from `recent`); collapse toggle button. When `sidebarCollapsed` at `lg`, render icon-only with `Tooltip` labels. Active link styling via `NavLink` `isActive`.
- `Topbar` — mobile logo (hidden `≥lg`); spacer; command-palette trigger `<button>` with search icon + `<Kbd>⌘K</Kbd>` (accepts `onOpenPalette` prop); theme `Dropdown` — `system` / `light` / `dark` → `usePrefs.setTheme`; Settings link → `/privacy#preferences`.
- `MobileNav` — 4 `NavLink`s: Home `/`, PDF `/pdf/merge`, Image `/image/compress`, Privacy `/privacy`; icon + label; active highlight.

- [ ] **Step 1: Failing test `src/app/Sidebar.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TOOLS } from '../tools/registry';

test('a link for every tool', () => {
  render(<MemoryRouter><Sidebar /></MemoryRouter>);
  for (const t of TOOLS) {
    expect(screen.getByRole('link', { name: new RegExp(t.name, 'i') }))
      .toHaveAttribute('href', t.route);
  }
});
test('has a Home link', () => {
  render(<MemoryRouter><Sidebar /></MemoryRouter>);
  expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/');
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement** the three; replace `AppShell` placeholder `aside`/`header`/`nav` bodies with `<Sidebar/>`, `<Topbar onOpenPalette={...}/>` (palette prop wired in Task 17 — for now pass a no-op), `<MobileNav/>`.

- [ ] **Step 4: Run → PASS. `npm run dev` — resize; toggle collapse; mobile bottom nav. Commit**

```bash
git add -A && git commit -m "feat: Sidebar, Topbar, MobileNav wired into AppShell

Claude-Session: https://claude.ai/code/session_01P5CGW7XmbuXSx91S6XXUfL"
```

---

## Task 17: Command palette (TDD)

**Files:** Create `src/app/CommandPalette.tsx`, `src/hooks/useCommandPalette.ts`; modify `src/app/AppShell.tsx` (mount + wire), `src/app/Topbar.tsx` (trigger); test `src/app/CommandPalette.test.tsx`.

**Interfaces:**
- `useCommandPalette()` → `{ open: boolean; setOpen(b: boolean) }`; attaches one global `keydown` — `(e.metaKey||e.ctrlKey) && e.key.toLowerCase()==='k'` → `preventDefault` + toggle. Mounted once in `AppShell`.
- `CommandPalette` props: `open: boolean`, `onOpenChange(b: boolean)`. Uses `cmdk`. Input placeholder "What do you want to do?". `Command.Group` per category (`PDF`, `Image`, `Privacy`) built from `TOOLS`. Item select → `navigate(tool.route)` + `usePrefs.pushRecent(tool.id)` + `onOpenChange(false)`. Empty: "No tools match". cmdk provides keyboard nav.

- [ ] **Step 1: Failing test `src/app/CommandPalette.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { CommandPalette } from './CommandPalette';

test('filters by query', async () => {
  render(<MemoryRouter><CommandPalette open onOpenChange={() => {}} /></MemoryRouter>);
  await userEvent.type(screen.getByPlaceholderText(/what do you want to do/i), 'merge');
  expect(screen.getByText(/Merge PDF/i)).toBeInTheDocument();
  expect(screen.queryByText(/Upscale Image/i)).toBeNull();
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement.** `AppShell` uses `useCommandPalette()` and renders `<CommandPalette open={open} onOpenChange={setOpen} />`; passes `() => setOpen(true)` to `Topbar`.

- [ ] **Step 4: Run → PASS. `npm run dev` — ⌘K, type, Enter navigates, Esc closes. Commit**

```bash
git add -A && git commit -m "feat: global command palette (cmdk, ⌘K)

Claude-Session: https://claude.ai/code/session_01P5CGW7XmbuXSx91S6XXUfL"
```

---

## Task 18: PrivacyPill + PrivacyIndicator (TDD on PrivacyIndicator)

**Files:** Create `src/app/PrivacyPill.tsx`, `src/components/tool/PrivacyIndicator.tsx`; modify `src/app/AppShell.tsx` (mount pill); test `src/components/tool/PrivacyIndicator.test.tsx`.

**Interfaces:**
- Consumes `PRIVACY_COPY` (Task 4), `useLocation`, `TOOLS` (match `location.pathname` to `tool.route`), `Dialog`/popover, `Lock` icon.
- `PrivacyIndicator` props: `mode: ProcessingMode`, `compact?: boolean` — renders `PRIVACY_COPY[mode].short` with a lock/shield icon; `compact` = icon + short text inline; non-compact = small card with the four brief-§10 checkmarks + `.long`.
- `PrivacyPill` — fixed bottom-left; button "Local processing"; opens a popover with brief §10 content. Active tool resolved from route; copy = `PRIVACY_COPY[activeTool?.processing ?? 'local']`. On non-tool routes uses `local` copy with the generic "Local whenever supported" heading.

- [ ] **Step 1: Failing test `src/components/tool/PrivacyIndicator.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import { PrivacyIndicator } from './PrivacyIndicator';

test('local says on your device', () => {
  render(<PrivacyIndicator mode="local" />);
  expect(screen.getByText(/on your device/i)).toBeInTheDocument();
});
test('local-partial honest about demo', () => {
  render(<PrivacyIndicator mode="local-partial" />);
  expect(screen.getByText(/demo|not yet|preview/i)).toBeInTheDocument();
});
test('server explicit', () => {
  render(<PrivacyIndicator mode="server" />);
  expect(screen.getByText(/server/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement.** Mount `<PrivacyPill/>` in `AppShell` outside the scroll area (fixed).

- [ ] **Step 4: Run → PASS. Commit**

```bash
git add -A && git commit -m "feat: PrivacyPill + PrivacyIndicator with honest per-tool copy

Claude-Session: https://claude.ai/code/session_01P5CGW7XmbuXSx91S6XXUfL"
```

---

## Task 19: Tool primitives — ToolHeader, FileDropzone, FileInfo, FilePreview (TDD on FileDropzone)

**Files:** Create `src/components/tool/{ToolHeader,FileDropzone,FileInfo,FilePreview}.tsx`; test `src/components/tool/FileDropzone.test.tsx`.

**Interfaces:**
- `ToolHeader` props: `tool: Tool`, `title: string`, `subtitle?: string`. Renders a wrapper with `data-accent={CATEGORIES[tool.category].accent}`; breadcrumb `Home / <category label> / <tool.name>` (Links); `<h1>` display size; subtitle in `text-dim`; `useEffect` sets `document.title = \`${tool.name} — PrivyTools\``.
- `FileDropzone` props: `accept: string[]`, `multiple?: boolean`, `onFile: (f: File | File[]) => void`, `mode: ProcessingMode`, `glyph?: ReactNode`, `headline?: string` (default "Ready when you are."), `hint?: string` (default "Drop a file here to start working."). Uses `useDropzone`. Root is `role="button"` `tabIndex={0}`, Enter/Space → `open()`. Shows drag-over ring. Renders reject message in an `aria-live="polite"` span. Includes `Browse files` `Button` + `<PrivacyIndicator mode={mode} compact />`.
- `FileInfo` props: `file: File`, `pages?: number` — name, `formatBytes(file.size)` in mono, type label, optional `· {pages} pages`.
- `FilePreview` props: `file: File`, `className?: string` — image → `<img>` with `useObjectUrl(file)` and `alt={file.name}`; else → document glyph + `file.name`.

- [ ] **Step 1: Failing test `src/components/tool/FileDropzone.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileDropzone } from './FileDropzone';

test('rejects wrong type with friendly message', async () => {
  const onFile = vi.fn();
  render(<FileDropzone accept={['application/pdf']} mode="local" onFile={onFile} />);
  await userEvent.upload(
    document.querySelector('input[type=file]') as HTMLInputElement,
    new File(['x'], 'x.png', { type: 'image/png' }),
  );
  expect(onFile).not.toHaveBeenCalled();
  expect(screen.getByText(/needs a PDF/i)).toBeInTheDocument();
});
test('accepts correct type', async () => {
  const onFile = vi.fn();
  render(<FileDropzone accept={['application/pdf']} mode="local" onFile={onFile} />);
  await userEvent.upload(
    document.querySelector('input[type=file]') as HTMLInputElement,
    new File(['x'], 'x.pdf', { type: 'application/pdf' }),
  );
  expect(onFile).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement** the four (`FileDropzone` ≤ ~95 lines).

- [ ] **Step 4: Run → PASS. Commit**

```bash
git add -A && git commit -m "feat: tool primitives — ToolHeader, FileDropzone, FileInfo, FilePreview

Claude-Session: https://claude.ai/code/session_01P5CGW7XmbuXSx91S6XXUfL"
```

---

## Task 20: Tool primitives — ProgressIndicator, ProcessingState, ErrorState, ResultCard, DownloadButton, ResetButton (TDD on ResultCard)

**Files:** Create those six under `src/components/tool/`; test `src/components/tool/ResultCard.test.tsx`.

**Interfaces:**
- `ProgressIndicator` props: `ratio?: number`, `label: string` — determinate bar when `ratio` set (`role="progressbar"` `aria-valuenow/min/max`), else indeterminate shimmer; mono `%`; `label` in `aria-live="polite"`.
- `ProcessingState` props: `phase: string`, `ratio?: number`, `onCancel?: () => void`, `children: ReactNode` (animation slot) — lays out animation + `ProgressIndicator label={phase}` + optional Cancel `Button`.
- `ErrorState` props: `message: string`, `onRetry: () => void` — `!` glyph, "Something went wrong.", `message` (defaults handled by caller), "The original file is untouched.", `Try again` `Button`. No stack trace rendered.
- `ResultCard` props: `result: FileResult`, `onReset: () => void`, `successVerb?: string` (default "All done.") — check-mark animation (scale/draw; opacity-only when `useReducedMotion`); filename mono; if `result.outputBytes != null`: size line `formatBytes(originalBytes) → formatBytes(outputBytes)` + `formatPercent(...)` + "Saved `formatBytes(originalBytes - outputBytes)`"; if `result.meta.estimate`: render output as `≈ {formatBytes(outputBytes)} (estimated)` and omit "Saved"; `meta` non-reserved keys as chips; `<DownloadButton blob={result.blob} filename={result.filename} />`; `<ResetButton onClick={onReset} />`; privacy line — `result.demo` → "This was a preview — no real transformation was applied." else "Your file was processed on your device."
- `DownloadButton` props: `blob: Blob`, `filename: string` — primary `Button`, `onClick` → `downloadBlob`.
- `ResetButton` props: `onClick: () => void`, `children?: ReactNode` (default "Process another") — ghost `Button`.

- [ ] **Step 1: Failing test `src/components/tool/ResultCard.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import { ResultCard } from './ResultCard';

const base = {
  blob: new Blob(['x'], { type: 'application/pdf' }),
  filename: 'merged.pdf',
  originalBytes: 42.8 * 1024 ** 2,
  outputBytes: 8.4 * 1024 ** 2,
};

test('shows size delta and saved', () => {
  render(<ResultCard result={base} onReset={() => {}} />);
  expect(screen.getByText(/42\.8 MB/)).toBeInTheDocument();
  expect(screen.getByText(/8\.4 MB/)).toBeInTheDocument();
  expect(screen.getByText(/saved/i)).toBeInTheDocument();
});
test('demo result shows honest line, no Saved', () => {
  render(<ResultCard result={{ ...base, demo: true, meta: { estimate: 1 } }} onReset={() => {}} />);
  expect(screen.getByText(/preview|no real transformation/i)).toBeInTheDocument();
  expect(screen.getByText(/estimated/i)).toBeInTheDocument();
});
test('has download + process another', () => {
  render(<ResultCard result={base} onReset={() => {}} />);
  expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /process another/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement** the six. Also swap the Task-15 inline route `errorElement` to use `ErrorState` where it fits.

- [ ] **Step 4: Run → PASS. Commit**

```bash
git add -A && git commit -m "feat: tool primitives — progress, processing, error, result, download, reset

Claude-Session: https://claude.ai/code/session_01P5CGW7XmbuXSx91S6XXUfL"
```

---

## Task 21: BeforeAfterComparison + StepFlow (TDD on BeforeAfterComparison)

**Files:** Create `src/components/tool/{BeforeAfterComparison,StepFlow}.tsx`; test `src/components/tool/BeforeAfterComparison.test.tsx`.

**Interfaces:**
- `BeforeAfterComparison` props: `before: ReactNode`, `after: ReactNode`, `beforeLabel?: string`, `afterLabel?: string`, `initial?: number` (0–1, default 0.5) — overlays `after` clipped to `split` fraction; drag handle uses pointer events (`onPointerDown` → `setPointerCapture`, `onPointerMove` while captured updates split from bounding-rect ratio, clamp 0–1). Handle is `role="slider"` `aria-valuemin={0}` `aria-valuemax={100}` `aria-valuenow={Math.round(split*100)}` `tabIndex={0}`; ArrowLeft/Right ±2%.
- `StepFlow` props: `step: 'select'|'configure'|'process'|'result'|'error'`, `views: Record<typeof step, ReactNode>` — renders `views[step]` inside `<AnimatePresence mode="wait">` with `maybe(slideUp, reduced)`.

- [ ] **Step 1: Failing test `src/components/tool/BeforeAfterComparison.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BeforeAfterComparison } from './BeforeAfterComparison';

test('arrow keys change split', async () => {
  render(<BeforeAfterComparison before={<div>B</div>} after={<div>A</div>} initial={0.5} />);
  const handle = screen.getByRole('slider');
  handle.focus();
  await userEvent.keyboard('{ArrowRight}{ArrowRight}');
  expect(Number(handle.getAttribute('aria-valuenow'))).toBeGreaterThan(50);
});
test('renders labels', () => {
  render(
    <BeforeAfterComparison
      before={<div>B</div>} after={<div>A</div>}
      beforeLabel="ORIGINAL" afterLabel="COMPRESSED"
    />,
  );
  expect(screen.getByText('ORIGINAL')).toBeInTheDocument();
  expect(screen.getByText('COMPRESSED')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement** both.

- [ ] **Step 4: Run → PASS. Commit**

```bash
git add -A && git commit -m "feat: BeforeAfterComparison (pointer + keyboard) + StepFlow

Claude-Session: https://claude.ai/code/session_01P5CGW7XmbuXSx91S6XXUfL"
```

---

## Task 22: Tool animation components

**Files:** Create `src/components/tool/anims/{LockAnim,ShrinkBarsAnim,StackAnim,PixelGridAnim,ScanBeamAnim,ParticlesAnim}.tsx`.

**Interfaces:** Each default-exports a component. Common prop `{ reduced?: boolean }`; when `reduced` render one static representative frame (no infinite loop). No external assets; colors from `hsl(var(--accent))` / `currentColor`.
- `LockAnim({ mode: 'add'|'remove', reduced? })` — shackle closes (add) / opens (remove).
- `ShrinkBarsAnim({ reduced? })` — stacked bars step shorter, loop.
- `StackAnim({ count: number, reduced? })` — `count` page rects slide into a stack.
- `PixelGridAnim({ reduced? })` — grid squares merge into larger blocks.
- `ScanBeamAnim({ reduced?, children? })` — horizontal beam sweeps over `children` (image area).
- `ParticlesAnim({ reduced? })` — dots drift out and fade.

- [ ] **Step 1: Implement all six** (each ≤ ~70 lines; infinite loops gated behind `!reduced`).
- [ ] **Step 2: Visual check deferred to Task 30 (`/_ds`).**
- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: tool-specific processing animations

Claude-Session: https://claude.ai/code/session_01P5CGW7XmbuXSx91S6XXUfL"
```

---

## Task 23: Dashboard (TDD)

**Files:** Create `src/routes/Dashboard.tsx`, `src/components/dashboard/{Hero,ToolCard,QuickActions}.tsx`; modify `src/app/routes.tsx` (real import); test `src/routes/Dashboard.test.tsx`.

**Interfaces:**
- `Hero` — brief §7 copy: `<h1>` "YOUR FILES. YOUR DEVICE. YOUR PRIVACY." (three lines), subline "Everything you need to work with PDFs and images — processed locally whenever possible."
- `ToolCard` props: `tool: Tool` — `Card as="div" interactive` wrapping a `<Link to={tool.route}>` covering the card; `tool.icon`; `tool.name`; `tool.description`; one accent element (icon tint via `data-accent`); optional `<Kbd>` if `tool.shortcut`; "Open" + arrow (`ArrowRight`) that translates on hover; `motion` hover `y: -2` + border brighten (skipped when reduced); favorite star button top-right (`useFavorites().toggle(tool.id)`, `aria-pressed`). `layoutId={\`tool-${tool.id}\`}`.
- `QuickActions` — the six `TOOLS` as a responsive grid of `ToolCard`.
- `Dashboard` — `<main role="main">`; `data-accent` unset (neutral); `Hero`; "Quick actions" heading + `QuickActions`; then category sections (`toolsByCategory`) — for v1 `QuickActions` already covers all six, so the extra grouping is a labeled re-layout by category; Recent row when `useRecent().recent.length > 0` (as small `ToolCard`s via `getTool`).

- [ ] **Step 1: Failing test `src/routes/Dashboard.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from './Dashboard';
import { TOOLS } from '../tools/registry';

test('shows hero copy', () => {
  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  expect(screen.getByText(/your files/i)).toBeInTheDocument();
});
test('a routing card for every tool', () => {
  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  for (const t of TOOLS) {
    const links = screen.getAllByRole('link', { name: new RegExp(t.name, 'i') });
    expect(links.some((l) => l.getAttribute('href') === t.route)).toBe(true);
  }
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement.**

- [ ] **Step 4: Run → PASS. `npm run dev` — hover cards, click each. Commit**

```bash
git add -A && git commit -m "feat: dashboard — hero, tool cards, quick actions, recent

Claude-Session: https://claude.ai/code/session_01P5CGW7XmbuXSx91S6XXUfL"
```

---

## Task 24: DragToAction (TDD)

**Files:** Create `src/app/DragToAction.tsx`; modify `src/app/AppShell.tsx` (mount); test `src/app/DragToAction.test.tsx`.

**Interfaces:**
- Consumes `useHandoff().setPendingFile`, `TOOLS`, `useNavigate`, `isAccepted`, `useReducedMotion`.
- `DragToAction` — attaches window `dragenter`/`dragover`/`dragleave`/`drop`. On `dragenter` with `types` including `Files`: show a fixed overlay (brief §9): heading "What would you like to do with this file?" + a `Button` per tool whose `accept` matches the dragged item type (from `e.dataTransfer.items[0].type`; if empty/unknown, show all non-privacy tools). On button click: read the dropped `File` (captured on `drop`) — since actions render before drop, the flow is: `drop` captures `file` into state, overlay stays open showing actions, action click → `setPendingFile(file)` + `navigate(tool.route)` + close. `dragleave` to `relatedTarget === null` or Esc closes. Fade only when reduced.

- [ ] **Step 1: Failing test `src/app/DragToAction.test.tsx`**

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DragToAction } from './DragToAction';

test('shows action overlay for a pdf and hides non-matching tools', () => {
  render(<MemoryRouter><DragToAction /></MemoryRouter>);
  fireEvent.dragEnter(window, {
    dataTransfer: { types: ['Files'], items: [{ kind: 'file', type: 'application/pdf' }] },
  });
  expect(screen.getByText(/what would you like to do/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /merge/i })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /upscale/i })).toBeNull();
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement.** Mount `<DragToAction/>` in `AppShell`.

- [ ] **Step 4: Run → PASS. `npm run dev` — drag a real PDF onto the window, pick an action, land on the tool with file loaded (verified once PdfMerge consumes handoff in Task 25). Commit**

```bash
git add -A && git commit -m "feat: global drag-to-action overlay with file handoff

Claude-Session: https://claude.ai/code/session_01P5CGW7XmbuXSx91S6XXUfL"
```

---

## Task 25: PDF Merge route — first full tool, canonical pattern (TDD)

**Files:** Create `src/routes/PdfMerge.tsx`, `src/components/tool/MergeList.tsx`; modify `src/app/routes.tsx`; test `src/routes/PdfMerge.test.tsx`.

**Interfaces:**
- Consumes `useToolRunner`, `mergePdf`, `getTool('pdf-merge')`, `useHandoff`, `useRecent`, tool primitives, `StackAnim`, framer-motion `Reorder`.
- `MergeList` props: `files: File[]`, `onReorder: (next: File[]) => void`, `onRemove: (index: number) => void`, `onAdd: (f: File[]) => void` — `Reorder.Group` of cards, each "PDF NN" + filename + remove `Button` (`aria-label={\`Remove ${name}\`}`); an "Add more" `FileDropzone multiple` tile; footer "`{files.length}` documents".
- `PdfMerge` — default export. `ToolHeader tool={tool} title="Bring documents together."`. On mount: `const f = useHandoff().consume(); if (f) runner.selectFile([f])`. `useToolRunner(mergePdf, {})`. `StepFlow` views:
  - `select`: `FileDropzone accept={tool.accept} multiple mode={tool.processing} onFile={runner.selectFile}`
  - `configure`: `MergeList` + "Merge PDFs" primary `Button` `disabled={runner.files.length < 2}` `onClick={runner.run}`
  - `process`: `ProcessingState phase={runner.progress?.phase ?? ''} ratio={runner.progress?.ratio}` with `<StackAnim count={runner.files.length} reduced={reduced} />`
  - `result`: `ResultCard result={runner.result!} successVerb="PDFs merged" onReset={runner.reset}` — `meta.pages`/`meta.documents` render as chips "12 pages" / "3 documents"; call `useRecent().push('pdf-merge')` in an effect when `step === 'result'`
  - `error`: `ErrorState message={runner.error!} onRetry={runner.run}`

- [ ] **Step 1: Failing test `src/routes/PdfMerge.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { readFileSync } from 'node:fs';
import PdfMerge from './PdfMerge';

const pdf = (p: string, n: string) =>
  new File([readFileSync(new URL(p, import.meta.url))], n, { type: 'application/pdf' });

test('merges two PDFs to the result state', async () => {
  render(<MemoryRouter><PdfMerge /></MemoryRouter>);
  await userEvent.upload(document.querySelector('input[type=file]') as HTMLInputElement, [
    pdf('../test/fixtures/a.pdf', 'a.pdf'),
    pdf('../test/fixtures/b.pdf', 'b.pdf'),
  ]);
  await userEvent.click(await screen.findByRole('button', { name: /^merge pdfs/i }));
  expect(await screen.findByText(/PDFs merged/i)).toBeInTheDocument();
  expect(screen.getByText(/5 pages/i)).toBeInTheDocument();
});
test('merge disabled with one file', async () => {
  render(<MemoryRouter><PdfMerge /></MemoryRouter>);
  await userEvent.upload(
    document.querySelector('input[type=file]') as HTMLInputElement,
    [pdf('../test/fixtures/a.pdf', 'a.pdf')],
  );
  expect(await screen.findByRole('button', { name: /^merge pdfs/i })).toBeDisabled();
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement** (~130 lines). This file is the template Tasks 26–29 copy structurally.

- [ ] **Step 4: Run → PASS. `npm run dev` — full flow; download the merged PDF; open it; verify page order. Commit**

```bash
git add -A && git commit -m "feat: PDF Merge tool (real, full SELECT->RESULT flow, canonical pattern)

Claude-Session: https://claude.ai/code/session_01P5CGW7XmbuXSx91S6XXUfL"
```

---

## Task 26: Image Compress route — real (TDD)

**Files:** Create `src/routes/ImageCompress.tsx`; modify `src/app/routes.tsx`; test `src/routes/ImageCompress.test.tsx`.

**Interfaces:**
- Consumes `useToolRunner`, `compressImage`, `estimateCompressedImage`, `BeforeAfterComparison`, `Slider`, `Segmented`, `Input`, `PixelGridAnim`, `getTool('image-compress')`, `useHandoff`, `useObjectUrl`.
- Config: `{ quality: number; format: 'image/jpeg'|'image/png'|'image/webp'; maxBytes?: number }`, initial `{ quality: 0.7, format: 'image/jpeg' }`.
- `ImageCompress` — `ToolHeader title="Smaller images. Same feeling."`. `StepFlow`:
  - `select`: `FileDropzone accept={tool.accept} mode="local"`
  - `configure`: large `FilePreview`; `Slider` quality 0.1–1 step 0.05 `leftLabel="Smaller"` `rightLabel="Better quality"`; `Segmented` format JPG/PNG/WEBP; optional target-size `Input` (number, KB) → `maxBytes`; live "Estimated `formatBytes(estimateCompressedImage(file.size, quality, format))`" in mono; "Compress" primary `Button`
  - `process`: `ProcessingState` + `<PixelGridAnim reduced={reduced} />`
  - `result`: `BeforeAfterComparison before={<img src={originalUrl}/>} after={<img src={resultUrl}/>} beforeLabel={\`ORIGINAL · ${formatBytes(originalBytes)}\`} afterLabel={\`COMPRESSED · ${formatBytes(outputBytes)}\`}` then `ResultCard successVerb="Image compressed"`
  - `error`: `ErrorState`

- [ ] **Step 1: Failing test `src/routes/ImageCompress.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ImageCompress from './ImageCompress';

vi.mock('../services/image.encode', () => ({
  encode: async (_f: File, format: string) => new Blob([new Uint8Array(64)], { type: format }),
}));

test('compresses an image and shows a smaller size', async () => {
  render(<MemoryRouter><ImageCompress /></MemoryRouter>);
  await userEvent.upload(
    document.querySelector('input[type=file]') as HTMLInputElement,
    new File([new Uint8Array(4096)], 'p.jpg', { type: 'image/jpeg' }),
  );
  await userEvent.click(await screen.findByRole('button', { name: /compress/i }));
  expect(await screen.findByText(/smaller/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run → FAIL.** — [ ] **Step 3: Implement.** — [ ] **Step 4: Run → PASS. `npm run dev` — real photo; check before/after drag; commit.**

```bash
git add -A && git commit -m "feat: Image Compress tool (real, before/after)

Claude-Session: https://claude.ai/code/session_01P5CGW7XmbuXSx91S6XXUfL"
```

---

## Task 27: PDF Security route — honest demo (TDD)

**Files:** Create `src/routes/PdfSecurity.tsx`; modify `src/app/routes.tsx`; test `src/routes/PdfSecurity.test.tsx`.

**Interfaces:**
- Consumes `useToolRunner`, `protectPdf`, `Segmented`, `Input`, `Badge`, `LockAnim`, `getTool('pdf-security')`, `useHandoff`.
- Config: `{ mode: 'add' | 'remove'; password: string }`, initial `{ mode: 'add', password: '' }`.
- `PdfSecurity` — `ToolHeader title="Secure your PDF." subtitle="Protect or unlock PDF files without unnecessary uploads."`; `<Badge tone="warn">Demo — encryption engine not yet connected</Badge>` above the flow. `StepFlow`:
  - `select`: `FileDropzone` with a vault `glyph`
  - `configure`: `FilePreview`; `Segmented` mode `add`/`remove` (labels "Add password" / "Remove password"); password `Input type={show?'text':'password'}` with a show/hide trailing `Button` (`aria-label="Show password"`); static "Encryption: AES-256" line; submit `Button` label `mode === 'add' ? 'Protect PDF' : 'Remove password'`
  - `process`: `ProcessingState` + `<LockAnim mode={runner.config.mode === 'add' ? 'add' : 'remove'} reduced={reduced} />`
  - `result`: `ResultCard result={runner.result!} successVerb="Protection updated" onReset={runner.reset}` — `demo` true → honest line; download offers the original file, labeled "Original file (demo made no changes)"
  - `error`: `ErrorState` — empty password → "Enter a password first."

- [ ] **Step 1: Failing test `src/routes/PdfSecurity.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { readFileSync } from 'node:fs';
import PdfSecurity from './PdfSecurity';

const pdf = () =>
  new File([readFileSync(new URL('../test/fixtures/a.pdf', import.meta.url))], 'a.pdf', { type: 'application/pdf' });

test('shows a demo disclaimer', () => {
  render(<MemoryRouter><PdfSecurity /></MemoryRouter>);
  expect(screen.getByText(/demo/i)).toBeInTheDocument();
});
test('empty password → friendly error', async () => {
  render(<MemoryRouter><PdfSecurity /></MemoryRouter>);
  await userEvent.upload(document.querySelector('input[type=file]') as HTMLInputElement, pdf());
  await userEvent.click(await screen.findByRole('button', { name: /protect pdf/i }));
  expect(await screen.findByText(/enter a password/i)).toBeInTheDocument();
});
```

- [ ] **Step 2–4: FAIL → implement → PASS → `npm run dev` check → commit.**

```bash
git add -A && git commit -m "feat: PDF Security tool (honest demo, vault identity)

Claude-Session: https://claude.ai/code/session_01P5CGW7XmbuXSx91S6XXUfL"
```

---

## Task 28: PDF Compress route — honest demo (TDD)

**Files:** Create `src/routes/PdfCompress.tsx`; modify `src/app/routes.tsx`; test `src/routes/PdfCompress.test.tsx`.

**Interfaces:**
- Consumes `useToolRunner`, `compressPdf`, `estimateCompressedPdf`, `Slider`, `Segmented`, `Badge`, `ShrinkBarsAnim`, `getTool('pdf-compress')`, `useHandoff`.
- Config: `{ preset: 'max'|'balanced'|'high'; quality: number }`, initial `{ preset: 'balanced', quality: 0.6 }`. Preset→quality: `max`→0.25, `balanced`→0.6, `high`→0.85 (changing preset sets quality; moving the slider sets preset to a custom-ish nearest but keep it simple: slider updates `quality` only, preset buttons update both).
- `PdfCompress` — `ToolHeader title="Make PDFs lighter." subtitle="Reduce file size while keeping documents readable."`; `<Badge tone="warn">Demo — compression engine not yet connected. Sizes are estimates.</Badge>`. `StepFlow`:
  - `configure`: "Original `formatBytes(file.size)`" → arrow → "Estimated `formatBytes(estimateCompressedPdf(file.size, quality))`" (mono) + `formatPercent(file.size, estimate)`; preset `Segmented` (Maximum compression / Balanced / High quality); fine `Slider` 0.1–1; "Compress PDF" `Button`
  - `process`: `<ShrinkBarsAnim reduced={reduced} />`
  - `result`: `ResultCard` — `demo` true, `meta.estimate` set → output shows `≈ … (estimated)`, no "Saved"; download offers original unchanged (labeled)
  - `error`: `ErrorState`

- [ ] **Step 1: Failing test `src/routes/PdfCompress.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { readFileSync } from 'node:fs';
import PdfCompress from './PdfCompress';

const pdf = () =>
  new File([readFileSync(new URL('../test/fixtures/a.pdf', import.meta.url))], 'a.pdf', { type: 'application/pdf' });

test('shows estimate disclaimer up front', () => {
  render(<MemoryRouter><PdfCompress /></MemoryRouter>);
  expect(screen.getByText(/estimate/i)).toBeInTheDocument();
});
test('reaches a result labeled estimated', async () => {
  render(<MemoryRouter><PdfCompress /></MemoryRouter>);
  await userEvent.upload(document.querySelector('input[type=file]') as HTMLInputElement, pdf());
  await userEvent.click(await screen.findByRole('button', { name: /compress pdf/i }));
  expect(await screen.findByText(/estimated/i)).toBeInTheDocument();
});
```

- [ ] **Step 2–4: FAIL → implement → PASS → `npm run dev` check → commit.**

```bash
git add -A && git commit -m "feat: PDF Compress tool (honest estimate demo)

Claude-Session: https://claude.ai/code/session_01P5CGW7XmbuXSx91S6XXUfL"
```

---

## Task 29: Image Upscale route + Privacy Center (TDD)

**Files:** Create `src/routes/ImageUpscale.tsx`, `src/routes/Privacy.tsx`, `src/components/privacy/{PrivacyBoard,PrivateIndicator}.tsx`; modify `src/app/routes.tsx`; test `src/routes/{ImageUpscale,Privacy}.test.tsx`.

**Interfaces:**
- `ImageUpscale` consumes `useToolRunner`, `upscaleImage`, `Segmented`, `Slider` (×3), `Tooltip`, `Badge`, `ScanBeamAnim`, `BeforeAfterComparison`, `getTool('image-upscale')`, `useHandoff`.
  - Config: `{ scale: 2 | 4; sharpness: number; noise: number; face: number }`, initial `{ scale: 2, sharpness: 0.5, noise: 0.3, face: 0.5 }`.
  - `ToolHeader title="From pixels to clarity." subtitle="Enhance image resolution while preserving important detail."`; `<Badge tone="warn">Demo — real AI enhancement not yet connected. Preview uses bicubic scaling.</Badge>`.
  - `configure`: `Segmented` scale `2×`/`4×`; three `Slider`s (sharpness / noise reduction / face detail) each `disabled` wrapped in `Tooltip content="Available when the AI engine is connected"`; "Enhance" `Button`.
  - `process`: `<ScanBeamAnim reduced={reduced}><FilePreview file={runner.file!} /></ScanBeamAnim>` + phase text from `runner.progress` (Analyzing image → … → Reconstructing pixels).
  - `result`: `BeforeAfterComparison` (before = original `<img>`, after = upscaled `<img>`), labels from `meta.from`/`meta.to`; `ResultCard successVerb="Enhancement complete"` — `demo` true.
  - `error`: `ErrorState`.
- `PrivacyBoard` consumes `privacyStatus()`, `usePrefs` (`telemetry`, `setTelemetry`, `privacyMode`, `setPrivacyMode`).
  - Brief §17 sections: PROCESSING MODE ("Local whenever supported"), FILE STORAGE ("No cloud storage"), TEMPORARY DATA ("Removed when you reset or leave"), TELEMETRY (toggle → `setTelemetry`, default off, label "Off — nothing about your files is collected"), PRIVACY MODE (toggle → `setPrivacyMode`; helper text: "Everything already runs locally where supported; this is a reminder indicator").
  - Per-tool table: `privacyStatus()` rows → tool name, mode `Badge`, note.
- `PrivateIndicator` — animated `◉ PRIVATE` ring + `ParticlesAnim` behind; static frame when reduced. Sub-copy: "Your files remain on your device for local operations."
- `Privacy` route — `<main role="main">`; custom header `<h1>` "Your privacy, by design."; `PrivateIndicator`; `PrivacyBoard`; `<section id="preferences">` (Settings link target) holding the telemetry + privacy-mode toggles.

- [ ] **Step 1: Failing tests**

`ImageUpscale.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ImageUpscale from './ImageUpscale';

test('honest that AI is not connected', () => {
  render(<MemoryRouter><ImageUpscale /></MemoryRouter>);
  expect(screen.getByText(/not yet connected|bicubic|demo/i)).toBeInTheDocument();
});
```

`Privacy.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Privacy from './Privacy';

test('lists each tool with its mode', () => {
  render(<MemoryRouter><Privacy /></MemoryRouter>);
  expect(screen.getByText('PDF Security')).toBeInTheDocument();
  expect(screen.getAllByText(/local|demo|server|preview/i).length).toBeGreaterThan(3);
});
test('does not claim everything is fully local', () => {
  render(<MemoryRouter><Privacy /></MemoryRouter>);
  expect(screen.queryByText(/all operations are fully local/i)).toBeNull();
});
```

- [ ] **Step 2–4: FAIL → implement → PASS → `npm run dev` check both routes → commit.**

```bash
git add -A && git commit -m "feat: Image Upscale (demo showcase) + Privacy Center

Claude-Session: https://claude.ai/code/session_01P5CGW7XmbuXSx91S6XXUfL"
```

---

## Task 30: Dev design-system route `/_ds`

**Files:** Create `src/routes/DesignSystem.tsx`; confirm `src/app/routes.tsx` registers it only under `import.meta.env.DEV`.

**Interfaces:** One scrollable `<main>` rendering every `ui/` primitive in all variants, every `tool/` primitive with mock props, and every `anims/` component. A checkbox toggles a `reduced` boolean passed to all anims and to a `MotionConfig` wrapper.

- [ ] **Step 1: Implement the gallery page.**
- [ ] **Step 2: `npm run dev` → `/_ds` → eyeball every component in dark; toggle `reduced`; confirm each animation freezes to a static frame.**
- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "chore: dev-only /_ds design-system gallery

Claude-Session: https://claude.ai/code/session_01P5CGW7XmbuXSx91S6XXUfL"
```

---

## Task 31: Responsive + reduced-motion + a11y pass

**Files:** Modify components with gaps found (expect `Sidebar`, `MobileNav`, tool route layouts, `BeforeAfterComparison`, dashboard grid, `tokens.css`). Create `src/a11y.test.tsx`.

- [ ] **Step 1: Reduced-motion audit** — force `useReducedMotion` true (temp dev flag or OS setting); walk all 7 routes + palette + drag-to-action; confirm no looping transforms/beams/particles, opacity fades remain, nothing stuck invisible.
- [ ] **Step 2: Responsive audit** at 375 / 768 / 1024 / 1440: sidebar ↔ rail ↔ sheet; bottom nav <768; tool controls stack; before/after drags with touch emulation; no horizontal page scroll; dropzones tappable.
- [ ] **Step 3: Keyboard audit** — Tab every route: visible focus everywhere; palette fully operable; dialogs trap + restore focus; `Segmented` / `Slider` / `BeforeAfterComparison` arrow-operable; skip-to-content works.
- [ ] **Step 4: Screen-reader smoke** — processing phases announce via `aria-live`; icon-only buttons have `aria-label`; `<img>` have `alt`.
- [ ] **Step 5: Theme audit** — walk `/_ds` and all 7 routes in **Light (Porcelain)** and **Dark (Carbon)**; confirm nothing borrows the wrong theme's color (the tell: a literal outside `tokens.css`), the theme toggle takes effect live, and `system` follows the OS setting.
- [ ] **Step 6: Contrast** — in each theme check `--text-dim` on `--bg` and on `--surface-hi`, and each accent token where it carries text/icon meaning, against WCAG AA (4.5:1 body, 3:1 large/icon). Dark Carbon `#9A9082` on `#0A0908` ≈ 6.5:1 OK; Light Porcelain `#625D54` on `#F7F6F3` ≈ 5.6:1 OK; Light accents were pre-darkened for this — re-verify and nudge the token lightness (not per-component overrides) if any fails. Note any change in a `tokens.css` comment.
- [ ] **Step 7: `src/a11y.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { routeObjects } from './app/routes';

test('dashboard has one h1 and a main', async () => {
  render(<RouterProvider router={createMemoryRouter(routeObjects, { initialEntries: ['/'] })} />);
  expect(await screen.findByRole('main')).toBeInTheDocument();
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
});
test('every button on the merge route has an accessible name', async () => {
  render(<RouterProvider router={createMemoryRouter(routeObjects, { initialEntries: ['/pdf/merge'] })} />);
  await screen.findByRole('main');
  for (const b of screen.getAllByRole('button')) {
    expect(b).toHaveAccessibleName();
  }
});
```

- [ ] **Step 8: Fix findings, re-walk, commit**

```bash
git add -A && git commit -m "fix: responsive, reduced-motion, accessibility pass across all routes

Claude-Session: https://claude.ai/code/session_01P5CGW7XmbuXSx91S6XXUfL"
```

---

## Task 32: Final gates + consistency sweep + README

**Files:** Modify whatever the sweep finds; create `README.md`.

- [ ] **Step 1: Consistency sweep** against brief §28 — every route: identical `ToolHeader` rhythm; exactly one accent element per view; mono for all numbers; empty/loading/error/success all present + styled; "Process another" wording identical; breadcrumb format identical; `Badge` demo disclaimers on all three demo tools.
- [ ] **Step 2:** `npm run typecheck` → clean (fix any `any` / unused).
- [ ] **Step 3:** `npm run lint` → clean.
- [ ] **Step 4:** `npm run test` → all green.
- [ ] **Step 5:** `npm run build` → succeeds; `npm run preview` → walk every route, palette, drag-to-action; one real merge + one real image compress end to end; download both outputs and open them.
- [ ] **Step 6:** `README.md` — what it is; `npm i && npm run dev`; table of which tools are real vs demo; privacy stance; "add a tool" pointer to `src/tools/registry.ts`.
- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "chore: final gates, consistency sweep, README

Claude-Session: https://claude.ai/code/session_01P5CGW7XmbuXSx91S6XXUfL"
```

---

## Self-Review

**Spec coverage**

| Spec / brief section | Task(s) |
|---|---|
| Application shell, collapsible sidebar | 15, 16 |
| Command palette ⌘K, keyboard nav, instant filter | 17 |
| Dashboard hero + quick actions | 23 |
| Dashboard tool cards (icon, name, desc, accent, shortcut, hover) | 23 |
| Drag-and-drop file-action mode | 24 |
| Global privacy indicator (honest, per-operation) | 4 (copy), 18 |
| Tool page pattern SELECT→CONFIGURE→PROCESS→RESULT | 11, 21, 25 |
| 12 named reusable components | 19, 20, 21 (+ ConfigPanel folded into ProcessingState/route layout — see note) |
| PDF Security (vault, add/remove, demo, lock anim) | 7, 22, 27 |
| PDF Compressor (slider, presets, live estimate, shrink anim, demo) | 7, 22, 28 |
| PDF Merge (multi-upload, reorder, remove, add, real, stack anim) | 7, 22, 25 |
| Image Compressor (before/after, formats, target size, live estimate, real) | 8, 22, 26 |
| Image Upscaler (2×/4×, sliders, scan beam, phase list, honest demo) | 8, 22, 29 |
| Privacy Center (board, animated indicator, honest per-tool table) | 6, 29 |
| Premium result experience | 20 (`ResultCard`) |
| Animation system + `prefers-reduced-motion` | 14, 22, 31 |
| Responsive desktop/tablet/mobile + touch drag | 15, 16, 21, 31 |
| Accessibility (kbd, focus, ARIA, live regions, contrast) | 12, 13, 19, 21, 31 |
| Tech architecture (TS/React/Router/Tailwind/hooks/state) | 1, 3, 9, 14 |
| Local-first processing + Web Workers | 7, 8 (worker file as documented headroom) |
| Security/privacy rules (no logging, revoke URLs, no sensitive storage) | 4, 9, 10, 11 |
| Future tool architecture (registry-driven) | 5 |
| Polished empty states | 19 |
| Error states, no stack traces | 11, 20 |
| Design system tokens + components | 3, 12, 13 |
| Iconography (one library, no emoji) | 5, enforced in 32 |
| Dashboard IA (Home/PDF/Image/Privacy/Favorites/Recent/Settings) | 16 |
| Demo/MVP honesty (service abstraction, no fake transforms) | 6, 7, 8, 27, 28, 29 |
| Quality bar / final polish | 30, 31, 32 |

**Note on `ConfigPanel`:** the spec names it as a reusable component. In this plan tool-specific controls live directly in each route's `configure` view (they differ enough per tool that a wrapper adds little). If the Task 32 sweep finds the routes duplicating layout scaffolding, extract a thin `ConfigPanel` (title + children + submit-row slot) then — a 1-file addition, not a blocker. Recorded here so it is a deliberate choice, not an omission.

**Placeholder scan:** No "TBD"/"TODO"/"add error handling"/"write tests for the above". Presentational component tasks (12, 13, 19, 20, 22, 23, 25–30) that don't quote every JSX line carry: exact interface contracts, the failing test verbatim, and layout specifics; full token/style detail is in the design spec §5–6. Acceptable — each is test-anchored and independently reviewable.

**Type consistency:**
- `ToolService.process(input, config, onProgress, signal)` — identical across Tasks 6, 7, 8, 11.
- `FileResult` fields `{ blob, filename, originalBytes, outputBytes?, meta?, demo? }` — consistent Tasks 6–8, 20, 25–29.
- `Progress { phase, ratio? }` — consistent Tasks 6, 11, 20.
- `useToolRunner` return keys `{ step, file, files, config, setConfig, progress, result, error, selectFile, run, cancel, reset }` — consumed with these exact names Tasks 25–29.
- `ProcessingMode` `'local' | 'local-partial' | 'server'` — one definition in `lib/privacyCopy.ts`, re-exported by `tools/registry.ts`; used Tasks 4, 5, 6, 18, 19.
- `PRIVACY_COPY[mode].{short,long}` — Tasks 4, 6, 18.
- `privacyStatus()` row `{ toolId, name, mode, note }` — Tasks 6, 29.
- Anim components: common `{ reduced?: boolean }` + `LockAnim` `mode`, `StackAnim` `count`, `ScanBeamAnim` `children` — Tasks 22, 25, 27, 29.

**Scope check:** One application, one plan. 32 tasks, each with an independently testable deliverable and its own commit.
