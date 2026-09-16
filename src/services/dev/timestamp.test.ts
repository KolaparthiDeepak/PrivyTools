import { describeTimestamp } from './timestamp';

const now = new Date('2026-01-01T00:00:00Z');

test('parses second epoch', () => {
  const r = describeTimestamp('1735689600', now);
  expect(r.iso).toBe('2025-01-01T00:00:00.000Z');
  expect(r.unixMillis).toBe('1735689600000');
});
test('parses millisecond epoch', () => {
  expect(describeTimestamp('1735689600000', now).unixSeconds).toBe('1735689600');
});
test('parses ISO string', () => {
  expect(describeTimestamp('2026-01-01T00:00:00Z', now).unixSeconds).toBe('1767225600');
});
test('relative for one hour ago', () => {
  expect(describeTimestamp('2025-12-31T23:00:00Z', now).relative).toMatch(/hour/);
});
test('throws on garbage', () => {
  expect(() => describeTimestamp('not a date', now)).toThrow(/recognisable/);
});
