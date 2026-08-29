import { isAccepted, rejectionReason } from './fileValidation';

const pdf = { type: 'application/pdf', name: 'x.pdf' };
const png = { type: 'image/png', name: 'x.png' };

test('mime match', () => expect(isAccepted(pdf, ['application/pdf'])).toBe(true));
test('ext fallback', () =>
  expect(isAccepted({ type: '', name: 'x.pdf' }, ['application/pdf'])).toBe(true));
test('rejects wrong', () => expect(isAccepted(png, ['application/pdf'])).toBe(false));
test('friendly reason', () => {
  const r = rejectionReason(png, ['application/pdf'])!;
  expect(r).toMatch(/PDF/);
  expect(r).not.toMatch(/application\//);
});
test('null when ok', () => expect(rejectionReason(pdf, ['application/pdf'])).toBeNull());
