import { processLines, type LineOptions } from './lines';

const base: LineOptions = {
  sort: 'none', unique: false, trim: false, caseInsensitive: false, removeBlank: false, reverse: false,
};

test('sorts ascending', () => {
  expect(processLines('b\na\nc', { ...base, sort: 'asc' })).toBe('a\nb\nc');
});
test('sorts descending', () => {
  expect(processLines('b\na\nc', { ...base, sort: 'desc' })).toBe('c\nb\na');
});
test('dedupes preserving first occurrence', () => {
  expect(processLines('a\nb\na', { ...base, unique: true })).toBe('a\nb');
});
test('case-insensitive unique', () => {
  expect(processLines('a\nA', { ...base, unique: true, caseInsensitive: true })).toBe('a');
});
test('removeBlank and trim', () => {
  expect(processLines('  a  \n\n b ', { ...base, trim: true, removeBlank: true })).toBe('a\nb');
});
test('reverse', () => {
  expect(processLines('a\nb\nc', { ...base, reverse: true })).toBe('c\nb\na');
});
test('order of ops: unique before sort, reverse last', () => {
  expect(processLines('b\na\nb', { ...base, unique: true, sort: 'asc', reverse: true })).toBe('b\na');
});
test('never throws on empty input', () => {
  expect(() => processLines('', { ...base, sort: 'asc', unique: true })).not.toThrow();
});
