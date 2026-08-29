# PrivyTools

A privacy-first daily file utility suite. One application shell, one dashboard,
seven tool experiences that share a design system, routing, and honest
local-first processing.

> Your files stay yours. Processed locally whenever technically possible.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
```

Other scripts: `npm run build`, `npm run preview`, `npm test`, `npm run lint`, `npm run typecheck`.

## Stack

Vite - React 19 - TypeScript - React Router 7 - Tailwind CSS v4 - Motion
(framer-motion) - cmdk - lucide-react - Zustand - pdf-lib. Fonts (Space Grotesk,
Geist Mono) are self-hosted via `@fontsource` - no CDN calls at runtime.

## Which tools are real vs demo

| Tool | Route | Status |
|---|---|---|
| PDF Merge | `/pdf/merge` | **Real** - merges in the browser with pdf-lib |
| Image Compress | `/image/compress` | **Real** - re-encodes via canvas |
| PDF Security | `/pdf/security` | Demo - honest mock behind `ToolService`; original file returned unchanged |
| PDF Compress | `/pdf/compress` | Demo - shows a real original size and an estimate only |
| Image Upscale | `/image/upscale` | Demo - real bicubic preview, labelled; AI engine not connected |
| Privacy Center | `/privacy` | Informational - reads the registry |

Demo tools carry a visible "Demo" badge and never present a fabricated
transformation as a real one.

## Privacy

- No backend, no analytics, no runtime network calls.
- `localStorage` holds only: favourite tool ids, recent tool ids, theme mode,
  telemetry toggle (off by default), sidebar state. Never file bytes or names.
- Object URLs are revoked on unmount, new file, and reset.

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

