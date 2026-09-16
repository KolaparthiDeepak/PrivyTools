# PrivyTools

A privacy-first daily utility suite - file tools and developer text tools. One
application shell, one dashboard, tool experiences that share a design system,
routing, and on-device processing.

> Your files stay yours. Every operation runs on your device.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
```

Other scripts: `npm run build`, `npm run preview`, `npm test`, `npm run lint`, `npm run typecheck`.

## Stack

Vite - React 19 - TypeScript - React Router 7 - Tailwind CSS v4 - Motion
(framer-motion) - cmdk - lucide-react - Zustand. Engines: pdf-lib (merge),
MuPDF wasm (encrypt / optimize), canvas (image compress / enlarge), CodeMirror 6
+ js-yaml + papaparse (developer tools, all lazy-loaded per route). Fonts
(Space Grotesk, Geist Mono) are self-hosted via `@fontsource` - no CDN calls.

## Tools - all real, all on-device

| Tool | Route | Engine |
|---|---|---|
| PDF Merge | `/pdf/merge` | pdf-lib - combine + reorder in the browser |
| PDF Security | `/pdf/security` | MuPDF wasm - real AES-256 add / password-verified remove |
| PDF Compress | `/pdf/compress` | MuPDF wasm - image + font + stream recompression, garbage collection; never returns a file larger than the input |
| Image Compress | `/image/compress` | canvas re-encode to JPG / PNG / WebP with a quality + target-size |
| Image Upscale | `/image/upscale` | stepped high-quality canvas resample (2x hops) + 3x3 unsharp-mask sharpen. No AI. |
| Image to PDF | `/image/to-pdf` | pdf-lib - combine JPG/PNG into one document |
| PDF to Image | `/pdf/to-image` | MuPDF wasm - render pages to PNG |
| Privacy Center | `/privacy` | reads the registry |

### Developer tools

Paste-in / copy-out text converters. Split-editor layout (`SplitTool`), live
conversion via `useDevTransform`, CodeMirror 6 editor lazy-loaded per route.

| Tool | Route | Engine |
|---|---|---|
| JSON Formatter | `/dev/json-format` | native - prettify / minify / validate |
| JSON &lt;-&gt; YAML | `/dev/json-yaml` | js-yaml |
| Base64 | `/dev/base64` | native - UTF-8 safe encode / decode |
| URL Encode | `/dev/url` | native - `encodeURIComponent` / decode |
| HTML Entities | `/dev/html-entities` | native - escape / unescape |
| Query String &lt;-&gt; JSON | `/dev/query-json` | native - `URLSearchParams` |
| JSON &lt;-&gt; CSV | `/dev/json-csv` | papaparse |
| JSON -&gt; TypeScript | `/dev/json-ts` | native - single-sample interface inference |
| Case Converter | `/dev/case` | native - camel / snake / kebab / CONSTANT / Title / sentence |
| Slugify | `/dev/slug` | native - URL-safe slug, diacritics stripped |
| Timestamp Converter | `/dev/timestamp` | native - Unix epoch (s/ms) &lt;-&gt; ISO / UTC / relative |
| Cron Explainer | `/dev/cron` | cronstrue + cron-parser - plain English + next 5 runs (UTC) |
| JWT Decoder | `/dev/jwt` | native - header / payload / claims; signature NOT verified |
| Text Diff | `/dev/diff` | diff (jsdiff) - line-by-line |
| Sort / Dedupe Lines | `/dev/lines` | native - sort, unique, trim, filter, reverse |

JWT/Timestamp/Cron use the `FieldTool` layout (input -&gt; labelled result rows);
Diff and Lines have bespoke layouts.

The heavy wasm/engine for each tool is lazy-loaded only when you open that
route (MuPDF wasm is ~10MB; the CodeMirror editor chunk is ~105KB gzipped;
cron parsing ~36KB gzipped).

## Privacy

- No backend, no analytics, no runtime network calls. Nothing is uploaded.
- `localStorage` holds only: favourite tool ids, recent tool ids, theme mode,
  telemetry toggle (off by default), sidebar state, and - only while telemetry
  is on - a per-tool action count (`{toolId: number}`, never file names or
  input text). Never file bytes or names.
- Object URLs are revoked on unmount, new file, and reset.
- PDF Security passwords cannot contain `,` or `=` (a limit of the MuPDF
  option interface) - the UI says so.

## Adding a tool

Append one entry to `src/tools/registry.ts` and add one lazy route in
`src/app/routes.tsx`. The registry drives the sidebar, dashboard cards, command
palette, breadcrumbs, and the privacy pill.

- **File tools** (`kind: 'file'`, the default): `ToolHeader` + a `StepFlow` state
  machine (`useToolRunner`) wired to a `ToolService`.
- **Developer tools** (`kind: 'text'`): `ToolHeader` + `SplitTool` with a
  `Direction[]`, backed by a pure function in `src/services/dev/` that throws
  `Error` with a human message on bad input.

## Themes

Light (Porcelain) and Dark (Carbon), both fully designed. Toggle in the top bar
(`system | light | dark`). Every colour comes from a role token in
`src/design/tokens.css`.

## Dev design-system gallery

`/_ds` (dev builds only) renders every primitive, tool component, and animation
with a reduced-motion toggle.

## Deploy (Vercel)

`vercel.json` is included: Vite framework preset, `dist` output, SPA rewrite so
client routes survive a refresh, immutable caching for hashed assets, and an
explicit `application/wasm` type for the MuPDF blob. Import the repo in Vercel
and deploy - no dashboard settings needed. Or `npx vercel`.
