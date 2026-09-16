import { encodeBase64, decodeBase64 } from './base64';

test('encodes unicode text', () => {
  expect(encodeBase64('héllo')).toBe('aMOpbGxv');
});
test('decodes back', () => {
  expect(decodeBase64('aMOpbGxv')).toBe('héllo');
});
test('round-trips', () => {
  const s = 'The quick brown 🦊';
  expect(decodeBase64(encodeBase64(s))).toBe(s);
});
test('rejects non-base64', () => {
  expect(() => decodeBase64('not*valid')).toThrow('Not valid Base64');
});
