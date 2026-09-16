import { slugify } from './slugify';

test('lowercases, strips accents, hyphenates', () => {
  expect(slugify('Héllo, World!')).toBe('hello-world');
});
test('collapses separators and trims', () => {
  expect(slugify('  a __ b -- c  ')).toBe('a-b-c');
});
test('keeps numbers', () => {
  expect(slugify('Top 10 Tips')).toBe('top-10-tips');
});
