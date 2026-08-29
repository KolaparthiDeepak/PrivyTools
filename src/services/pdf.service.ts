import { PDFDocument } from 'pdf-lib';
import type { FileResult, Progress, ToolService } from './types';
import { ToolError } from './types';

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

const wait = (ms: number, signal: AbortSignal) =>
  new Promise<void>((res, rej) => {
    const t = setTimeout(res, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(t);
      rej(new ToolError('Cancelled.'));
    });
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
    const phases =
      config.mode === 'add'
        ? ['Preparing document', 'Encrypting', 'Sealing']
        : ['Reading document', 'Validating password', 'Unlocking'];
    for (const phase of phases) {
      onProgress({ phase });
      await wait(600, signal);
    }
    return { blob: file, filename: file.name, originalBytes: file.size, demo: true };
  },
};
