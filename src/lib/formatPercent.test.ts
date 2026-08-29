import { formatPercent } from './formatPercent';

test('smaller', () =>
  expect(formatPercent(42.8 * 1024 ** 2, 8.4 * 1024 ** 2)).toBe('80.4% smaller'));
test('no gain', () => expect(formatPercent(100, 120)).toBe('0% smaller'));
