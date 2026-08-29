import { PDFDocument } from 'pdf-lib';
import type { FileResult, Progress, ToolService } from './types';
import { ToolError } from './types';
import { loadMuPdf } from './mupdf';

// ponytail: merge runs pdf-lib on the main thread - fast enough for typical inputs
// and fully testable. src/workers/pdf.worker.ts holds the offload path if profiling demands it.
async function mergeCore(
  files: File[],
  onProgress: (p: Progress) => void,
  signal: AbortSignal,
): Promise<FileResult> {
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
    blob: new Blob([out as BlobPart], { type: 'application/pdf' }),
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

export const compressPdf: ToolService<{ preset: string; quality: number }, FileResult> = {
  async process(input, _config, onProgress, signal) {
    const file = Array.isArray(input) ? input[0] : input;
    if (signal.aborted) throw new ToolError('Cancelled.');
    onProgress({ phase: 'Analyzing document', ratio: 0.15 });
    const mupdf = await loadMuPdf();
    const bytes = new Uint8Array(await file.arrayBuffer());
    const doc = mupdf.PDFDocument.openDocument(bytes, 'application/pdf').asPDF()!;
    onProgress({ phase: 'Recompressing images and fonts', ratio: 0.55 });
    const out = doc
      .saveToBuffer('compress=yes,compress-images=yes,compress-fonts=yes,garbage=compact')
      .asUint8Array();
    onProgress({ phase: 'Rewriting structure', ratio: 0.9 });
    const smaller = out.byteLength < file.size;
    const stem = file.name.replace(/.pdf$/i, '');
    return {
      blob: smaller ? new Blob([out as BlobPart], { type: 'application/pdf' }) : file,
      filename: smaller ? `${stem}-optimized.pdf` : file.name,
      originalBytes: file.size,
      outputBytes: smaller ? out.byteLength : file.size,
      meta: smaller
        ? undefined
        : { note: 'This PDF is already about as small as lossless optimization gets.' },
    };
  },
};

export const protectPdf: ToolService<{ mode: 'add' | 'remove'; password: string }, FileResult> = {
  async process(input, config, onProgress, signal) {
    const file = Array.isArray(input) ? input[0] : input;
    if (!config.password) throw new ToolError('Enter a password first.');
    if (/[,=]/.test(config.password))
      throw new ToolError('The password cannot contain a comma or an equals sign.');
    if (signal.aborted) throw new ToolError('Cancelled.');

    onProgress({
      phase: config.mode === 'add' ? 'Preparing document' : 'Reading document',
      ratio: 0.2,
    });
    const mupdf = await loadMuPdf();
    const bytes = new Uint8Array(await file.arrayBuffer());
    const doc = mupdf.PDFDocument.openDocument(bytes, 'application/pdf').asPDF()!;
    const stem = file.name.replace(/.pdf$/i, '');

    if (config.mode === 'remove') {
      onProgress({ phase: 'Validating password', ratio: 0.5 });
      if (doc.needsPassword() && !doc.authenticatePassword(config.password))
        throw new ToolError('That password did not unlock the PDF.');
      onProgress({ phase: 'Unlocking', ratio: 0.85 });
      const out = doc.saveToBuffer('encrypt=none').asUint8Array();
      return {
        blob: new Blob([out as BlobPart], { type: 'application/pdf' }),
        filename: `${stem}-unlocked.pdf`,
        originalBytes: file.size,
        outputBytes: out.byteLength,
      };
    }

    if (doc.needsPassword())
      throw new ToolError('This PDF is already password protected. Remove the existing password first.');
    onProgress({ phase: 'Encrypting (AES-256)', ratio: 0.55 });
    const out = doc
      .saveToBuffer(
        `encrypt=aes-256,user-password=${config.password},owner-password=${config.password}`,
      )
      .asUint8Array();
    onProgress({ phase: 'Sealing', ratio: 0.9 });
    return {
      blob: new Blob([out as BlobPart], { type: 'application/pdf' }),
      filename: `${stem}-protected.pdf`,
      originalBytes: file.size,
      outputBytes: out.byteLength,
    };
  },
};
