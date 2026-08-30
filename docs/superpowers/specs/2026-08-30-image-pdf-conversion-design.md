# Image ↔ PDF conversion tools

## Goal
Add two tools following the existing tool pattern (registry entry + service function + route page): **Image to PDF** and **PDF to Image**.

## Image to PDF
- Category: `image`. Accept: `image/png`, `image/jpeg`, `image/webp`.
- Route: `/image/to-pdf`. Page: `ImageToPdf.tsx`, mirrors `PdfMerge.tsx` — `FileDropzone(multiple)` → `MergeList` (reorder/add/remove) → run.
- Service: `imagesToPdf` in `pdf.service.ts`. For each image, draw onto a `<canvas>` at natural pixel size and export as PNG (normalizes every input format, sidesteps pdf-lib's raw-JPEG edge cases). `pdf-lib` creates one page per image, sized to the image's pixel dimensions, and embeds the PNG.
- Output: single `application/pdf` blob, filename `images.pdf`.
- Errors: reuse `ToolError`; fail per-image with filename in the message if an image fails to decode.

## PDF to Image
- Category: `pdf`. Accept: `application/pdf`.
- Route: `/pdf/to-image`. Page: `PdfToImage.tsx`, mirrors `ImageCompress.tsx` shape but no config — dropzone → run.
- Service: `pdfToImages` in `pdf.service.ts`. Uses `loadMuPdf()`, renders every page via `page.toPixmap(scaleMatrix, DeviceRGB)` at fixed 150 DPI (matrix scale `150/72`), `.asPNG()` per page.
- Multi-page output bundles into a single ZIP (new dependency: `jszip`). Single-page PDFs still zip, for a consistent output type.
- Output: single `application/zip` blob, filename `pages.zip`. `meta: { pages: n }`.

## Wiring
- `registry.ts`: two new `Tool` entries (icons: `FileImage` for Image→PDF from lucide, `Images` for PDF→Image — whatever reads clearly, pick at implementation time).
- `routes.tsx`: two new lazy routes.
- Sidebar/dashboard/command palette pick these up automatically via the registry — no separate wiring needed there.

## Testing
- `pdf.service.test.ts`: add cases for `imagesToPdf` (page count, page size matches image) and `pdfToImages` (zip contains expected PNG count).
- Route smoke tests mirroring `PdfMerge.test.tsx` / `ImageCompress.test.tsx`.

## Explicitly out of scope
- No configurable DPI or page-fit options (fixed 150 DPI, image-native page size) — add later if asked.
- No OCR, no PDF/A, no image reordering inside PDF-to-image (page order = document order).
