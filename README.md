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
+ js-yaml + papaparse + diff + cronstrue / cron-parser + node-forge (developer
tools, all lazy-loaded per route). Fonts
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

Paste-in / copy-out text tools. Most use the split-editor layout (`SplitTool`)
with live conversion via `useDevTransform`; the CodeMirror 6 editor is
lazy-loaded per route. In the sidebar each group below is its own collapsible
section (one open at a time); the groups come from `src/tools/devGroups.ts`.

| Group | Tool | Route | Engine |
|---|---|---|---|
| Converters | JSON Formatter | `/dev/json-format` | native - prettify / minify / validate |
| Converters | JSON &lt;-&gt; YAML | `/dev/json-yaml` | js-yaml |
| Converters | JSON &lt;-&gt; CSV | `/dev/json-csv` | papaparse |
| Encoders / Decoders | Base64 | `/dev/base64` | native - UTF-8 safe encode / decode |
| Encoders / Decoders | URL Encode | `/dev/url` | native - `encodeURIComponent` / decode |
| Encoders / Decoders | JWT Decoder | `/dev/jwt` | native - header / payload / claims; signature NOT verified |
| Encryption | Jasypt | `/dev/jasypt` | node-forge - Jasypt-compatible PBE encrypt / decrypt |
| Encryption | AES / DES Cipher | `/dev/cipher` | node-forge - OpenSSL / CryptoJS passphrase format, or raw key + IV |
| Text Utilities | Text Diff | `/dev/diff` | diff (jsdiff) - line-by-line |
| Date & Schedule | Timestamp Converter | `/dev/timestamp` | native - Unix epoch (s/ms) &lt;-&gt; ISO / UTC / relative |
| Date & Schedule | Cron Explainer | `/dev/cron` | cronstrue + cron-parser - plain English + next 5 runs (UTC) |

Timestamp and Cron use the `FieldTool` layout (input -&gt; labelled result rows);
JWT (`JwtTool`) and Diff (`DiffTool`) have their own layouts.

#### Encryption tools

- **Jasypt** matches `StandardPBEStringEncryptor` byte for byte:
  `PBEWITHHMACSHA{1,256,384,512}ANDAES_{128,256}` (jasypt-spring-boot 3.x
  default: `PBEWITHHMACSHA512ANDAES_256`, 1000 iterations, random IV),
  `PBEWithMD5AndDES` (Jasypt 1.9 default, no IV) and `PBEWithMD5AndTripleDES`.
  Settable: password, iterations, random vs no IV generator, Base64 / hex
  output, `ENC(...)` wrapping (pasted `ENC(...)` values are unwrapped).
  SHA-224 variants are not offered (node-forge has no SHA-224).
- **AES / DES Cipher** - AES-128/192/256 (CBC, GCM, CTR, CFB, OFB, ECB) and
  DES / 3DES (CBC, ECB). Passphrase mode reads and writes `openssl enc`
  output (`Salted__` header; PBKDF2-SHA256 / PBKDF2-SHA512 or legacy EVP-MD5,
  which is also what `CryptoJS.AES.encrypt(text, passphrase)` uses). Raw mode
  takes a hex key and IV; GCM output is ciphertext followed by the 16-byte tag.
- The tests check against ciphertexts from real Jasypt 1.9.3 on JDK 21 and
  from `openssl enc`, not only against round-trips.

The heavy wasm/engine for each tool is lazy-loaded only when you open that
route (MuPDF wasm is ~10MB; the CodeMirror editor chunk is ~105KB gzipped;
cron parsing ~36KB gzipped; node-forge for the encryption tools ~76KB gzipped).

## Privacy

- No backend, no analytics, no runtime network calls. Nothing is uploaded.
- `localStorage` holds only: favourite tool ids, recent tool ids, theme mode,
  telemetry toggle (off by default), sidebar collapsed / expanded, and - only while telemetry
  is on - a per-tool action count (`{toolId: number}`, never file names or
  input text). Never file bytes or names.
- Object URLs are revoked on unmount, new file, and reset.
- Encryption passwords, passphrases and keys live only in component state:
  never stored, logged, or put in the URL.
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
  `Error` with a human message on bad input. Also add the tool id to exactly
  one group in `src/tools/devGroups.ts` (a test enforces this); that group
  decides where it shows in the sidebar, command palette and dashboard.

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
