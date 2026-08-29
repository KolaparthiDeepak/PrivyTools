import { readFileSync } from 'node:fs';
import { PDFDocument } from 'pdf-lib';
import { mergePdf, estimateCompressedPdf, protectPdf } from './pdf.service';

const f = (p: string, n: string) =>
  new File([readFileSync(new URL(p, import.meta.url))], n, { type: 'application/pdf' });

test('merge sums pages, returns valid pdf, reports phases', async () => {
  const phases: string[] = [];
  const res = await mergePdf.process(
    [f('../test/fixtures/a.pdf', 'a.pdf'), f('../test/fixtures/b.pdf', 'b.pdf')],
    {}, (p) => phases.push(p.phase), new AbortController().signal,
  );
  expect(res.meta!.pages).toBe(5);
  expect(res.meta!.documents).toBe(2);
  expect((await PDFDocument.load(await res.blob.arrayBuffer())).getPageCount()).toBe(5);
  expect(phases.length).toBeGreaterThan(0);
});

test('merge rejects single file', async () => {
  await expect(
    mergePdf.process([f('../test/fixtures/a.pdf', 'a.pdf')], {}, () => {}, new AbortController().signal),
  ).rejects.toMatchObject({ userMessage: expect.stringMatching(/two/i) });
});

test('estimate monotonic in quality', () => {
  expect(estimateCompressedPdf(1000, 0.2)).toBeLessThan(estimateCompressedPdf(1000, 0.9));
});

test('protect requires a password', async () => {
  await expect(
    protectPdf.process(f('../test/fixtures/a.pdf', 'a.pdf'), { mode: 'add', password: '' },
      () => {}, new AbortController().signal),
  ).rejects.toMatchObject({ userMessage: expect.stringMatching(/password/i) });
});
