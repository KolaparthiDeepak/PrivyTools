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
    self.postMessage({ type: 'done', bytes: out, pages: merged.getPageCount() }, [out.buffer as ArrayBuffer]);
  } catch (err) {
    self.postMessage({ type: 'error', message: (err as Error).message });
  }
};
