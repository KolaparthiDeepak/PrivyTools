# PrivyTools

A privacy-first daily file utility suite. One application shell, one dashboard,
seven tool experiences that share a design system, routing, and on-device
processing.

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
MuPDF wasm (encrypt / optimize), canvas (image compress / enlarge). Fonts
(Space Grotesk, Geist Mono) are self-hosted via `@fontsource` - no CDN calls.

## Tools - all real, all on-device

| Tool | Route | Engine |
|---|---|---|
| PDF Merge | `/pdf/merge` | pdf-lib - combine + reorder in the browser |
| PDF Security | `/pdf/security` | MuPDF wasm - real AES-256 add / password-verified remove |
| PDF Compress | `/pdf/compress` | MuPDF wasm - image + font + stream recompression, garbage collection; never returns a file larger than the input |
| Image Compress | `/image/compress` | canvas re-encode to JPG / PNG / WebP with a quality + target-size |
| Image Upscale | `/image/upscale` | stepped high-quality canvas resample (2x hops) + 3x3 unsharp-mask sharpen. No AI. |
| Privacy Center | `/privacy` | reads the registry |

The heavy wasm/engine for each tool is lazy-loaded only when you open that
route (MuPDF wasm is ~10MB).

## Privacy

- No backend, no analytics, no runtime network calls. Nothing is uploaded.
- `localStorage` holds only: favourite tool ids, recent tool ids, theme mode,
  telemetry toggle (off by default), sidebar state. Never file bytes or names.
- Object URLs are revoked on unmount, new file, and reset.
- PDF Security passwords cannot contain `,` or `=` (a limit of the MuPDF
  option interface) - the UI says so.

## Adding a tool

Append one entry to `src/tools/registry.ts` and add one lazy route in
`src/app/routes.tsx`. The registry drives the sidebar, dashboard cards, command
palette, breadcrumbs, and the privacy pill. Each tool page is `ToolHeader` + a
`StepFlow` state machine (`useToolRunner`) wired to a `ToolService`.

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
