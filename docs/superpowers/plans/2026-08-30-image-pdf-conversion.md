# Image ↔ PDF Conversion Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two tools to PrivyTools — "Image to PDF" (combine JPG/PNG images into one PDF) and "PDF to Image" (render every page of a PDF to PNG, zipped) — following the existing tool pattern exactly.

**Architecture:** Each tool is a registry entry (`src/tools/registry.ts`) + a pure service function (`src/services/pdf.service.ts`) + a route page (`src/routes/`) wired into `src/app/routes.tsx`. Both reuse existing shared components (`FileDropzone`, `MergeList`, `StepFlow`, `ResultCard`, etc.) — no new UI primitives.

**Tech Stack:** React 19, TypeScript, `pdf-lib` (image embedding + PDF authoring), `mupdf` (PDF page rasterization), new dependency `jszip` (zip bundling for multi-page image output), Vitest + Testing Library.

## Global Constraints

- Image to PDF supports JPG and PNG only (not WebP) — embedding goes straight through `pdf-lib`'s `embedJpg`/`embedPng`, no canvas re-encoding step. This keeps the whole path synchronously testable under Node (no DOM/canvas needed), matching how `pdf.service.test.ts` already runs with `@vitest-environment node`.
- PDF to Image renders at a fixed 150 DPI — no configurable DPI or page-fit options (per spec, `docs/superpowers/specs/2026-08-30-image-pdf-conversion-design.md`).
- Every new page/service follows the existing tool pattern verbatim: `ToolService<C, FileResult>` shape, `ToolError` for user-facing failures, `useToolRunner` + `StepFlow` for the page.
- All new dependencies: `jszip@^3.10.1` only.

---

### Task 1: Fix the invalid JPEG test fixture

`src/test/fixtures/sample.jpg` is currently truncated/invalid — `pdf-lib`'s `embedJpg` throws `SOI not found in JPEG` on it. Task 2 needs a real embeddable JPG fixture, so fix this first, standalone.

**Files:**
- Modify: `src/test/fixtures/sample.jpg`
- Modify: `src/test/fixtures/make-fixtures.mjs`

**Interfaces:**
- Produces: a valid 1×1 pixel JPEG at `src/test/fixtures/sample.jpg`, embeddable via `pdf-lib`'s `PDFDocument.embedJpg`.

- [ ] **Step 1: Replace the fixture with a valid minimal JPEG**

Run:
```bash
node -e "
require('fs').writeFileSync(
  'src/test/fixtures/sample.jpg',
  Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=', 'base64')
);
console.log('wrote', require('fs').statSync('src/test/fixtures/sample.jpg').size, 'bytes');
"
```
Expected: `wrote 342 bytes` (or similar — any non-zero size).

- [ ] **Step 2: Verify it actually embeds**

Run:
```bash
node -e "
const {PDFDocument} = require('pdf-lib');
(async () => {
  const doc = await PDFDocument.create();
  const img = await doc.embedJpg(require('fs').readFileSync('src/test/fixtures/sample.jpg'));
  console.log('embedded ok', img.width, img.height);
})();
"
```
Expected: `embedded ok 1 1`

- [ ] **Step 3: Update the generator script to match, for reproducibility**

In `src/test/fixtures/make-fixtures.mjs`, replace the `sample.jpg` base64 literal (the string passed to `Buffer.from(...)` on the `writeFileSync(new URL('./sample.jpg', ...))` line) with the same base64 string used in Step 1:
```js
writeFileSync(new URL('./sample.jpg', import.meta.url), Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
  'base64'));
```

- [ ] **Step 4: Commit**

```bash
git add src/test/fixtures/sample.jpg src/test/fixtures/make-fixtures.mjs
git commit -m "fix: replace invalid JPEG test fixture with a real embeddable one"
```

---

### Task 2: `imagesToPdf` service

**Files:**
- Modify: `src/services/pdf.service.ts`
- Test: `src/services/pdf.service.test.ts`

**Interfaces:**
- Consumes: `ToolService`, `FileResult`, `ToolError` from `./types` (already imported in this file); `PDFDocument` from `pdf-lib` (already imported).
- Produces: `export const imagesToPdf: ToolService<Record<string, never>, FileResult>` — same shape as the existing `mergePdf`, callable as `imagesToPdf.process(files, {}, onProgress, signal)`.

- [ ] **Step 1: Write the failing tests**

Add to `src/services/pdf.service.test.ts`, alongside the existing `fx` helper:

```ts
import { imagesToPdf, pdfToImages } from './pdf.service';

const fxImg = (name: string, type: string) =>
  new File([readFileSync(resolve(__dirname, '../test/fixtures', name))], name, { type });

test('imagesToPdf creates one page per image, sized to the image', async () => {
  const res = await imagesToPdf.process(
    [fxImg('sample.jpg', 'image/jpeg'), fxImg('sample.png', 'image/png')],
    {},
    () => {},
    sig(),
  );
  const doc = await PDFDocument.load(await res.blob.arrayBuffer());
  expect(doc.getPageCount()).toBe(2);
  expect(doc.getPage(0).getSize()).toEqual({ width: 1, height: 1 });
  expect(res.meta!.pages).toBe(2);
});

test('imagesToPdf rejects unsupported image types', async () => {
  await expect(
    imagesToPdf.process([fxImg('sample.png', 'image/webp')], {}, () => {}, sig()),
  ).rejects.toMatchObject({ userMessage: expect.stringMatching(/jpg or png/i) });
});
```

(Leave the `pdfToImages` import in place but unused-error is fine — Task 3 defines it. If your editor/linter complains about the unused import before Task 3 lands, that's expected and resolves itself in the next task; do not work around it.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/services/pdf.service.test.ts -t "imagesToPdf"`
Expected: FAIL — `imagesToPdf` is not exported from `./pdf.service`.

- [ ] **Step 3: Implement `imagesToPdf`**

Add to `src/services/pdf.service.ts` (after `mergePdf`'s definition, before `estimateCompressedPdf`):

```ts
const IMAGE_EMBEDDERS: Record<string, (doc: PDFDocument, bytes: Uint8Array) => Promise<import('pdf-lib').PDFImage>> = {
  'image/jpeg': (doc, bytes) => doc.embedJpg(bytes),
  'image/png': (doc, bytes) => doc.embedPng(bytes),
};

// ponytail: JPG/PNG only, embedded directly via pdf-lib - no canvas re-encode step.
// Add WebP via canvas normalization if that's ever actually requested.
async function imagesToPdfCore(
  files: File[],
  onProgress: (p: Progress) => void,
  signal: AbortSignal,
): Promise<FileResult> {
  if (!files.length) throw new ToolError('Add at least one image.');
  const doc = await PDFDocument.create();
  let originalBytes = 0;
  for (let i = 0; i < files.length; i++) {
    if (signal.aborted) throw new ToolError('Cancelled.');
    onProgress({ phase: `Adding ${files[i].name}`, ratio: i / files.length });
    const embed = IMAGE_EMBEDDERS[files[i].type];
    if (!embed) throw new ToolError(`${files[i].name} is not a JPG or PNG.`);
    const bytes = new Uint8Array(await files[i].arrayBuffer());
    originalBytes += bytes.byteLength;
    const image = await embed(doc, bytes).catch(() => {
      throw new ToolError(`${files[i].name} could not be read as an image.`);
    });
    const page = doc.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  }
  onProgress({ phase: 'Finishing', ratio: 0.95 });
  const out = await doc.save();
  return {
    blob: new Blob([out as BlobPart], { type: 'application/pdf' }),
    filename: 'images.pdf',
    originalBytes,
    outputBytes: out.byteLength,
    meta: { pages: doc.getPageCount() },
  };
}

export const imagesToPdf: ToolService<Record<string, never>, FileResult> = {
  process: (input, _c, onProgress, signal) =>
    imagesToPdfCore(Array.isArray(input) ? input : [input], onProgress, signal),
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/services/pdf.service.test.ts -t "imagesToPdf"`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/services/pdf.service.ts src/services/pdf.service.test.ts
git commit -m "feat: add imagesToPdf service"
```

---

### Task 3: `pdfToImages` service

**Files:**
- Modify: `src/services/pdf.service.ts`
- Test: `src/services/pdf.service.test.ts`

**Interfaces:**
- Consumes: `loadMuPdf` from `./mupdf` (already imported in this file); `mupdf.PDFDocument.openDocument(bytes, 'application/pdf').asPDF()`, `.countPages()`, `.loadPage(i)`, `page.toPixmap(matrix, colorspace)`, `pixmap.asPNG()`, `mupdf.Matrix.scale(sx, sy)`, `mupdf.ColorSpace.DeviceRGB` (all confirmed against the installed `mupdf` types/runtime).
- Produces: `export const pdfToImages: ToolService<Record<string, never>, FileResult>`.

- [ ] **Step 1: Add the `jszip` dependency**

Run: `npm install jszip@^3.10.1`
Expected: `package.json` `dependencies` gains `"jszip": "^3.10.1"` (no-op if already present).

- [ ] **Step 2: Write the failing test**

Add to `src/services/pdf.service.test.ts`:

```ts
import JSZip from 'jszip';

test('pdfToImages zips one PNG per page at 150 DPI', async () => {
  const res = await pdfToImages.process(fx('a.pdf'), {}, () => {}, sig());
  expect(res.meta!.pages).toBe(2);
  const zip = await JSZip.loadAsync(await res.blob.arrayBuffer());
  const names = Object.keys(zip.files);
  expect(names.length).toBe(2);
  const png = await zip.files[names[0]].async('uint8array');
  expect(png[0]).toBe(0x89); // PNG signature byte
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/services/pdf.service.test.ts -t "pdfToImages"`
Expected: FAIL — `pdfToImages` is not exported from `./pdf.service`.

- [ ] **Step 4: Implement `pdfToImages`**

Add to `src/services/pdf.service.ts`, at the top add the import:

```ts
import JSZip from 'jszip';
```

Then add the function (after `protectPdf`'s definition, at the end of the file):

```ts
async function pdfToImagesCore(
  file: File,
  onProgress: (p: Progress) => void,
  signal: AbortSignal,
): Promise<FileResult> {
  if (signal.aborted) throw new ToolError('Cancelled.');
  onProgress({ phase: 'Opening document', ratio: 0.05 });
  const mupdf = await loadMuPdf();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const doc = mupdf.PDFDocument.openDocument(bytes, 'application/pdf').asPDF()!;
  const pageCount = doc.countPages();
  const matrix = mupdf.Matrix.scale(150 / 72, 150 / 72);
  const zip = new JSZip();
  const stem = file.name.replace(/\.pdf$/i, '');
  for (let i = 0; i < pageCount; i++) {
    if (signal.aborted) throw new ToolError('Cancelled.');
    onProgress({ phase: `Rendering page ${i + 1} of ${pageCount}`, ratio: i / pageCount });
    const page = doc.loadPage(i);
    const pixmap = page.toPixmap(matrix, mupdf.ColorSpace.DeviceRGB);
    zip.file(`${stem}-${String(i + 1).padStart(2, '0')}.png`, pixmap.asPNG());
  }
  onProgress({ phase: 'Zipping', ratio: 0.95 });
  const out = await zip.generateAsync({ type: 'uint8array' });
  return {
    blob: new Blob([out as BlobPart], { type: 'application/zip' }),
    filename: `${stem}-pages.zip`,
    originalBytes: file.size,
    outputBytes: out.byteLength,
    meta: { pages: pageCount },
  };
}

export const pdfToImages: ToolService<Record<string, never>, FileResult> = {
  process: (input, _c, onProgress, signal) =>
    pdfToImagesCore(Array.isArray(input) ? input[0] : input, onProgress, signal),
};
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/services/pdf.service.test.ts`
Expected: PASS (all tests in the file, including the new one)

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/services/pdf.service.ts src/services/pdf.service.test.ts
git commit -m "feat: add pdfToImages service"
```

---

### Task 4: Image to PDF tool (page, registry, route)

Generalizes `MergeList` to accept a configurable file type + labels (it's currently hardcoded to PDFs), then builds the page on top of it — same shape as `PdfMerge.tsx`.

**Files:**
- Modify: `src/components/tool/MergeList.tsx`
- Modify: `src/routes/PdfMerge.tsx` (update the one new required prop)
- Modify: `src/tools/registry.ts`
- Modify: `src/app/routes.tsx`
- Modify: `src/tools/registry.test.ts`
- Create: `src/routes/ImageToPdf.tsx`
- Test: `src/routes/ImageToPdf.test.tsx`

**Interfaces:**
- Consumes: `imagesToPdf` from `../services/pdf.service` (Task 2); `getTool` from `../tools/registry`; `useToolRunner`, `useHandoff`, `useReducedMotion`; shared components `ToolHeader`, `FileDropzone`, `MergeList`, `ProcessingState`, `ResultCard`, `ErrorState`, `StepFlow`, `StackAnim`, `Button`.
- Produces: registry entry `getTool('image-to-pdf')` with `route: '/image/to-pdf'`, `accept: ['image/jpeg', 'image/png']`; default export `ImageToPdf` at `src/routes/ImageToPdf.tsx`.

- [ ] **Step 1: Generalize `MergeList`**

Replace the full contents of `src/components/tool/MergeList.tsx`:

```tsx
import { Reorder } from 'framer-motion';
import { GripVertical, X, Plus } from 'lucide-react';
import { useDropzone } from '../../hooks/useDropzone';

export function MergeList({
  files,
  onReorder,
  onRemove,
  onAdd,
  accept,
  itemLabel = 'FILE',
  countLabel = 'files',
}: {
  files: File[];
  onReorder: (next: File[]) => void;
  onRemove: (index: number) => void;
  onAdd: (f: File[]) => void;
  accept: string[];
  itemLabel?: string;
  countLabel?: string;
}) {
  const dz = useDropzone({
    accept,
    multiple: true,
    onFile: (f) => onAdd(Array.isArray(f) ? f : [f]),
  });
  return (
    <div className="flex flex-col gap-2">
      <Reorder.Group axis="y" values={files} onReorder={onReorder} className="flex flex-col gap-2">
        {files.map((file, i) => (
          <Reorder.Item
            key={`${file.name}-${i}`}
            value={file}
            className="flex items-center gap-3 rounded-md border border-border bg-surface-hi px-3 py-2.5"
          >
            <GripVertical className="size-3.5 cursor-grab text-dim/60" />
            <span className="font-mono text-[11px] text-accent">
              {itemLabel} {String(i + 1).padStart(2, '0')}
            </span>
            <span className="flex-1 truncate text-xs text-dim">{file.name}</span>
            <button
              type="button"
              aria-label={`Remove ${file.name}`}
              onClick={() => onRemove(i)}
              className="text-dim/60 hover:text-text"
            >
              <X className="size-3.5" />
            </button>
          </Reorder.Item>
        ))}
      </Reorder.Group>
      <button
        type="button"
        onClick={dz.open}
        className="flex items-center justify-center gap-2 rounded-md border border-dashed border-border-hi px-3 py-2.5 text-xs text-dim hover:text-text"
      >
        <input {...dz.inputProps} />
        <Plus className="size-3.5" /> Add more
      </button>
      <p className="font-mono text-[11px] text-dim/70">
        {files.length} {countLabel}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Update `PdfMerge.tsx`'s call site to preserve its exact current behavior**

In `src/routes/PdfMerge.tsx`, find the `<MergeList` element and add the three new required/changed props so its rendered text is unchanged (`"PDF 01"` items, `"N documents"` footer):

```tsx
              <MergeList
                files={runner.files}
                onReorder={(next) => runner.selectFile(next)}
                onRemove={(i) => runner.selectFile(runner.files.filter((_, x) => x !== i))}
                onAdd={(f) => runner.selectFile([...runner.files, ...f])}
                accept={tool.accept}
                itemLabel="PDF"
                countLabel="documents"
              />
```

- [ ] **Step 3: Run existing tests to confirm nothing broke**

Run: `npx vitest run src/routes/PdfMerge.test.tsx`
Expected: PASS (both existing tests, unchanged)

- [ ] **Step 4: Add the registry entry**

In `src/tools/registry.ts`, add `Images` to the lucide-react import:

```ts
import {
  ShieldCheck, Minimize2, Combine, ImageDown, Sparkles, Lock, Images,
  type LucideIcon,
} from 'lucide-react';
```

Then add a new entry to the `TOOLS` array, after `image-upscale` and before `privacy-center`:

```ts
  {
    id: 'image-to-pdf', name: 'Image to PDF', description: 'Combine images into one document',
    route: '/image/to-pdf', category: 'image', icon: Images,
    processing: 'local', status: 'live', accept: ['image/jpeg', 'image/png'],
  },
```

- [ ] **Step 5: Update `registry.test.ts`'s exact-tool-set assertion**

In `src/tools/registry.test.ts`, update the `'exact tool set'` test's expected array:

```ts
test('exact tool set', () => {
  expect(TOOLS.map((t) => t.id).sort()).toEqual(
    [
      'image-compress', 'image-to-pdf', 'image-upscale',
      'pdf-compress', 'pdf-merge', 'pdf-security', 'privacy-center',
    ].sort(),
  );
});
```

- [ ] **Step 6: Wire the route**

In `src/app/routes.tsx`, add the lazy import alongside the others:

```ts
const ImageToPdf = lazy(() => import('../routes/ImageToPdf'));
```

And add the route entry to `children`, next to `image/upscale`:

```ts
  { path: 'image/to-pdf', element: page(<ImageToPdf />) },
```

- [ ] **Step 7: Create the page**

Create `src/routes/ImageToPdf.tsx`:

```tsx
import { useEffect } from 'react';
import { getTool } from '../tools/registry';
import { useToolRunner } from '../hooks/useToolRunner';
import { useHandoff } from '../store/handoff.store';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { imagesToPdf } from '../services/pdf.service';
import { ToolHeader } from '../components/tool/ToolHeader';
import { FileDropzone } from '../components/tool/FileDropzone';
import { MergeList } from '../components/tool/MergeList';
import { ProcessingState } from '../components/tool/ProcessingState';
import { ResultCard } from '../components/tool/ResultCard';
import { ErrorState } from '../components/tool/ErrorState';
import { StepFlow } from '../components/tool/StepFlow';
import StackAnim from '../components/tool/anims/StackAnim';
import { Button } from '../components/ui';

const tool = getTool('image-to-pdf')!;

export default function ImageToPdf() {
  const runner = useToolRunner<Record<string, never>>(imagesToPdf, {});
  const consume = useHandoff((s) => s.consume);
  const reduced = useReducedMotion();

  useEffect(() => {
    const f = consume();
    if (f) runner.selectFile([f]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main role="main" className="mx-auto flex max-w-3xl flex-col gap-8 p-6 sm:p-10">
      <ToolHeader
        tool={tool}
        title="Turn images into a PDF."
        subtitle="Combine JPGs and PNGs into one document, in any order."
      />
      <StepFlow
        step={runner.step}
        views={{
          select: (
            <FileDropzone
              accept={tool.accept}
              multiple
              mode={tool.processing}
              onFile={runner.selectFile}
              headline="Drop your images here"
              hint="JPG or PNG. Add as many as you like."
            />
          ),
          configure: (
            <div className="flex flex-col gap-5">
              <MergeList
                files={runner.files}
                onReorder={(next) => runner.selectFile(next)}
                onRemove={(i) => runner.selectFile(runner.files.filter((_, x) => x !== i))}
                onAdd={(f) => runner.selectFile([...runner.files, ...f])}
                accept={tool.accept}
                itemLabel="IMG"
                countLabel="images"
              />
              <Button variant="primary" className="self-start" onClick={runner.run}>
                Create PDF
              </Button>
            </div>
          ),
          process: (
            <ProcessingState
              phase={runner.progress?.phase ?? 'Building PDF'}
              ratio={runner.progress?.ratio}
              onCancel={runner.cancel}
            >
              <StackAnim count={runner.files.length} reduced={reduced} />
            </ProcessingState>
          ),
          result: runner.result ? (
            <ResultCard result={runner.result} successVerb="PDF created" onReset={runner.reset} />
          ) : null,
          error: <ErrorState message={runner.error ?? ''} onRetry={runner.run} />,
        }}
      />
    </main>
  );
}
```

- [ ] **Step 8: Write the failing route test**

Create `src/routes/ImageToPdf.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { readFileSync } from 'node:fs';
import ImageToPdf from './ImageToPdf';

const img = (p: string, n: string, type: string) =>
  new File([readFileSync(new URL(p, import.meta.url))], n, { type });

test('combines two images into a PDF', async () => {
  render(
    <MemoryRouter>
      <ImageToPdf />
    </MemoryRouter>,
  );
  await userEvent.upload(document.querySelector('input[type=file]') as HTMLInputElement, [
    img('../test/fixtures/sample.jpg', 'a.jpg', 'image/jpeg'),
    img('../test/fixtures/sample.png', 'b.png', 'image/png'),
  ]);
  await userEvent.click(await screen.findByRole('button', { name: /create pdf/i }));
  expect(await screen.findByText(/PDF created/i)).toBeInTheDocument();
  expect(screen.getByText(/2 pages/i)).toBeInTheDocument();
});
```

- [ ] **Step 9: Run all affected tests**

Run: `npx vitest run src/routes/ImageToPdf.test.tsx src/routes/PdfMerge.test.tsx src/tools/registry.test.ts src/app/routes.test.tsx src/services/pdf.service.test.ts`
Expected: PASS — all files, all tests.

- [ ] **Step 10: Commit**

```bash
git add src/components/tool/MergeList.tsx src/routes/PdfMerge.tsx src/tools/registry.ts \
  src/tools/registry.test.ts src/app/routes.tsx src/routes/ImageToPdf.tsx src/routes/ImageToPdf.test.tsx
git commit -m "feat: add Image to PDF tool"
```

---

### Task 5: PDF to Image tool (page, registry, route)

**Files:**
- Modify: `src/tools/registry.ts`
- Modify: `src/app/routes.tsx`
- Modify: `src/tools/registry.test.ts`
- Create: `src/routes/PdfToImage.tsx`
- Test: `src/routes/PdfToImage.test.tsx`

**Interfaces:**
- Consumes: `pdfToImages` from `../services/pdf.service` (Task 3); same shared components/hooks as Task 4, plus `PixelGridAnim` from `../components/tool/anims/PixelGridAnim` and `formatBytes` from `../lib/formatBytes`.
- Produces: registry entry `getTool('pdf-to-image')` with `route: '/pdf/to-image'`, `accept: ['application/pdf']`; default export `PdfToImage` at `src/routes/PdfToImage.tsx`.

- [ ] **Step 1: Add the registry entry**

In `src/tools/registry.ts`, add `FileImage` to the lucide-react import:

```ts
import {
  ShieldCheck, Minimize2, Combine, ImageDown, Sparkles, Lock, Images, FileImage,
  type LucideIcon,
} from 'lucide-react';
```

Add a new entry to `TOOLS`, after `pdf-merge` (keeping the pdf-category tools grouped together):

```ts
  {
    id: 'pdf-to-image', name: 'PDF to Image', description: 'Turn pages into PNGs',
    route: '/pdf/to-image', category: 'pdf', icon: FileImage,
    processing: 'local', status: 'live', accept: PDF,
  },
```

- [ ] **Step 2: Update `registry.test.ts`**

Update the `'exact tool set'` test's expected array (extends the one from Task 4):

```ts
test('exact tool set', () => {
  expect(TOOLS.map((t) => t.id).sort()).toEqual(
    [
      'image-compress', 'image-to-pdf', 'image-upscale',
      'pdf-compress', 'pdf-merge', 'pdf-security', 'pdf-to-image', 'privacy-center',
    ].sort(),
  );
});
```

Also extend the `'every processing tool is live and local'` test to cover both new tools:

```ts
test('every processing tool is live and local', () => {
  for (const id of [
    'pdf-security', 'pdf-compress', 'pdf-merge', 'pdf-to-image',
    'image-compress', 'image-upscale', 'image-to-pdf',
  ]) {
    expect(getTool(id)!.status).toBe('live');
    expect(getTool(id)!.processing).toBe('local');
  }
});
```

- [ ] **Step 3: Run registry tests**

Run: `npx vitest run src/tools/registry.test.ts`
Expected: PASS

- [ ] **Step 4: Wire the route**

In `src/app/routes.tsx`, add the lazy import:

```ts
const PdfToImage = lazy(() => import('../routes/PdfToImage'));
```

And the route entry, next to `pdf/merge`:

```ts
  { path: 'pdf/to-image', element: page(<PdfToImage />) },
```

- [ ] **Step 5: Create the page**

Create `src/routes/PdfToImage.tsx`:

```tsx
import { useEffect } from 'react';
import { Images } from 'lucide-react';
import { getTool } from '../tools/registry';
import { useToolRunner } from '../hooks/useToolRunner';
import { useHandoff } from '../store/handoff.store';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { pdfToImages } from '../services/pdf.service';
import { formatBytes } from '../lib/formatBytes';
import { ToolHeader } from '../components/tool/ToolHeader';
import { FileDropzone } from '../components/tool/FileDropzone';
import { ProcessingState } from '../components/tool/ProcessingState';
import { ResultCard } from '../components/tool/ResultCard';
import { ErrorState } from '../components/tool/ErrorState';
import { StepFlow } from '../components/tool/StepFlow';
import PixelGridAnim from '../components/tool/anims/PixelGridAnim';
import { Button } from '../components/ui';

const tool = getTool('pdf-to-image')!;

export default function PdfToImage() {
  const runner = useToolRunner<Record<string, never>>(pdfToImages, {});
  const consume = useHandoff((s) => s.consume);
  const reduced = useReducedMotion();

  useEffect(() => {
    const f = consume();
    if (f) runner.selectFile(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main role="main" className="mx-auto flex max-w-3xl flex-col gap-8 p-6 sm:p-10">
      <ToolHeader
        tool={tool}
        title="Turn PDF pages into images."
        subtitle="Each page becomes a PNG at 150 DPI, bundled into one ZIP."
      />
      <StepFlow
        step={runner.step}
        views={{
          select: (
            <FileDropzone
              accept={tool.accept}
              mode={tool.processing}
              onFile={runner.selectFile}
              headline="Drop a PDF here"
              hint="We'll render every page as a PNG."
            />
          ),
          configure: runner.file ? (
            <div className="flex flex-col gap-5">
              <p className="font-mono text-sm text-dim">
                {runner.file.name} · {formatBytes(runner.file.size)}
              </p>
              <Button variant="primary" className="self-start" onClick={runner.run}>
                <Images className="size-4" /> Convert to images
              </Button>
            </div>
          ) : null,
          process: (
            <ProcessingState
              phase={runner.progress?.phase ?? 'Rendering'}
              ratio={runner.progress?.ratio}
              onCancel={runner.cancel}
            >
              <PixelGridAnim reduced={reduced} />
            </ProcessingState>
          ),
          result: runner.result ? (
            <ResultCard result={runner.result} successVerb="Pages converted" onReset={runner.reset} />
          ) : null,
          error: <ErrorState message={runner.error ?? ''} onRetry={runner.run} />,
        }}
      />
    </main>
  );
}
```

- [ ] **Step 6: Write the failing route test**

Create `src/routes/PdfToImage.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { readFileSync } from 'node:fs';
import PdfToImage from './PdfToImage';

const pdf = (p: string, n: string) =>
  new File([readFileSync(new URL(p, import.meta.url))], n, { type: 'application/pdf' });

test('converts a PDF to a zip of page images', async () => {
  render(
    <MemoryRouter>
      <PdfToImage />
    </MemoryRouter>,
  );
  await userEvent.upload(
    document.querySelector('input[type=file]') as HTMLInputElement,
    pdf('../test/fixtures/a.pdf', 'a.pdf'),
  );
  await userEvent.click(await screen.findByRole('button', { name: /convert to images/i }));
  expect(await screen.findByText(/pages converted/i)).toBeInTheDocument();
  expect(screen.getByText(/2 pages/i)).toBeInTheDocument();
});
```

- [ ] **Step 7: Run all affected tests**

Run: `npx vitest run src/routes/PdfToImage.test.tsx src/tools/registry.test.ts src/app/routes.test.tsx`
Expected: PASS — all files, all tests.

- [ ] **Step 8: Run the full test suite, typecheck, and lint**

Run:
```bash
npx vitest run
npx tsc --noEmit
npx eslint "src/**/*.{ts,tsx}"
```
Expected: all three green — full test suite passes, no type errors, no lint errors.

- [ ] **Step 9: Commit**

```bash
git add src/tools/registry.ts src/tools/registry.test.ts src/app/routes.tsx \
  src/routes/PdfToImage.tsx src/routes/PdfToImage.test.tsx
git commit -m "feat: add PDF to Image tool"
```
