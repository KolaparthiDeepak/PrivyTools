// @vitest-environment node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { mergePdf, estimateCompressedPdf, protectPdf, compressPdf, imagesToPdf, pdfToImages } from './pdf.service';
import { loadMuPdf } from './mupdf';

const fx = (name: string) =>
  new File([readFileSync(resolve(__dirname, '../test/fixtures', name))], name, {
    type: 'application/pdf',
  });

const fxImg = (name: string, type: string) =>
  new File([readFileSync(resolve(__dirname, '../test/fixtures', name))], name, { type });

const sig = () => new AbortController().signal;

test('merge sums pages, returns valid pdf, reports phases', async () => {
  const phases: string[] = [];
  const res = await mergePdf.process([fx('a.pdf'), fx('b.pdf')], {}, (p) => phases.push(p.phase), sig());
  expect(res.meta!.pages).toBe(5);
  expect(res.meta!.documents).toBe(2);
  expect((await PDFDocument.load(await res.blob.arrayBuffer())).getPageCount()).toBe(5);
  expect(phases.length).toBeGreaterThan(0);
});

test('merge rejects single file', async () => {
  await expect(mergePdf.process([fx('a.pdf')], {}, () => {}, sig())).rejects.toMatchObject({
    userMessage: expect.stringMatching(/two/i),
  });
});

test('estimate monotonic in quality', () => {
  expect(estimateCompressedPdf(1000, 0.2)).toBeLessThan(estimateCompressedPdf(1000, 0.9));
});

test('protect: real AES-256 round-trip', async () => {
  const enc = await protectPdf.process(fx('a.pdf'), { mode: 'add', password: 'hunter2' }, () => {}, sig());
  const mupdf = await loadMuPdf();
  const doc = mupdf.PDFDocument.openDocument(new Uint8Array(await enc.blob.arrayBuffer()), 'application/pdf');
  expect(doc.needsPassword()).toBe(true);
  expect(doc.authenticatePassword('wrong')).toBe(0);
  expect(doc.authenticatePassword('hunter2')).toBeGreaterThan(0);

  const encFile = new File([await enc.blob.arrayBuffer()], 'a-protected.pdf', { type: 'application/pdf' });
  const dec = await protectPdf.process(encFile, { mode: 'remove', password: 'hunter2' }, () => {}, sig());
  const decDoc = mupdf.PDFDocument.openDocument(new Uint8Array(await dec.blob.arrayBuffer()), 'application/pdf');
  expect(decDoc.needsPassword()).toBe(false);
});

test('protect: wrong password on remove is a friendly error', async () => {
  const enc = await protectPdf.process(fx('a.pdf'), { mode: 'add', password: 'right' }, () => {}, sig());
  const encFile = new File([await enc.blob.arrayBuffer()], 'x.pdf', { type: 'application/pdf' });
  await expect(
    protectPdf.process(encFile, { mode: 'remove', password: 'nope' }, () => {}, sig()),
  ).rejects.toMatchObject({ userMessage: expect.stringMatching(/did not unlock/i) });
});

test('protect: empty password rejected', async () => {
  await expect(
    protectPdf.process(fx('a.pdf'), { mode: 'add', password: '' }, () => {}, sig()),
  ).rejects.toMatchObject({ userMessage: expect.stringMatching(/password/i) });
});

test('compress: output is a valid PDF with pages preserved', async () => {
  const res = await compressPdf.process(fx('b.pdf'), { preset: 'balanced', quality: 0.6 }, () => {}, sig());
  const doc = await PDFDocument.load(await res.blob.arrayBuffer());
  expect(doc.getPageCount()).toBe(3);
  expect(res.outputBytes).toBeLessThanOrEqual(res.originalBytes);
});

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

test('pdfToImages zips one PNG per page at 150 DPI', async () => {
  const res = await pdfToImages.process(fx('a.pdf'), {}, () => {}, sig());
  expect(res.meta!.pages).toBe(2);
  const zip = await JSZip.loadAsync(await res.blob.arrayBuffer());
  const names = Object.keys(zip.files);
  expect(names.length).toBe(2);
  const png = await zip.files[names[0]].async('uint8array');
  expect(png[0]).toBe(0x89); // PNG signature byte
});
