import type * as MuPdf from 'mupdf';

let modPromise: Promise<typeof MuPdf> | null = null;

// ponytail: single lazy import - mupdf wasm is ~10MB, only pulled on PDF tool routes.
export function loadMuPdf(): Promise<typeof MuPdf> {
  if (!modPromise) modPromise = import('mupdf');
  return modPromise;
}

export function pdfOptionValue(v: string): string {
  // mupdf save options are k=v pairs joined by commas; values cannot carry ',' or '='.
  return v;
}
