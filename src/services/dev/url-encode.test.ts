import { encodeUrl, decodeUrl } from './url-encode';

test('encodes reserved chars', () => {
  expect(encodeUrl('a b&c=d')).toBe('a%20b%26c%3Dd');
});
test('decodes', () => {
  expect(decodeUrl('a%20b%26c')).toBe('a b&c');
});
test('throws on malformed input', () => {
  expect(() => decodeUrl('%')).toThrow('Malformed URL encoding');
});
