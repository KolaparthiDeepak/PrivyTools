import { compressImage, estimateCompressedImage } from './image.service';

vi.mock('./image.encode', () => ({
  encode: async (_f: File, format: string) => new Blob([new Uint8Array(128)], { type: format }),
}));

test('returns blob with requested format', async () => {
  const res = await compressImage.process(
    new File([new Uint8Array(4096)], 'p.jpg', { type: 'image/jpeg' }),
    { quality: 0.6, format: 'image/webp' }, () => {}, new AbortController().signal,
  );
  expect(res.blob.type).toBe('image/webp');
  expect(res.outputBytes).toBe(res.blob.size);
  expect(res.originalBytes).toBe(4096);
});

test('estimate decreases with quality', () => {
  expect(estimateCompressedImage(10000, 0.3, 'image/jpeg'))
    .toBeLessThan(estimateCompressedImage(10000, 0.9, 'image/jpeg'));
});
