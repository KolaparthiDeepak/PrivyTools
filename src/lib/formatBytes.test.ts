import { formatBytes } from './formatBytes';

test('zero', () => expect(formatBytes(0)).toBe('0 B'));
test('bytes', () => expect(formatBytes(820)).toBe('820 B'));
test('MB', () => expect(formatBytes(42.8 * 1024 ** 2)).toBe('42.8 MB'));
test('rounds', () => expect(formatBytes(8.44 * 1024 ** 2)).toBe('8.4 MB'));
test('GB', () => expect(formatBytes(1.3 * 1024 ** 3)).toBe('1.3 GB'));
