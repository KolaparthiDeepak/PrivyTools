import { explainCron } from './cron-explain';

const from = new Date('2026-01-01T00:00:00Z');

test('describes a simple expression', () => {
  expect(explainCron('*/5 * * * *', from).description.toLowerCase()).toContain('every 5 minutes');
});
test('lists 5 upcoming runs', () => {
  const r = explainCron('0 0 * * *', from);
  expect(r.nextRuns).toHaveLength(5);
  expect(r.nextRuns[0]).toBe('2026-01-02T00:00:00.000Z');
  expect(r.nextRuns[4]).toBe('2026-01-06T00:00:00.000Z');
});
test('trims whitespace', () => {
  expect(explainCron('  0 0 * * *  ', from).nextRuns[0]).toBe('2026-01-02T00:00:00.000Z');
});
test('throws on invalid', () => {
  expect(() => explainCron('not valid', from)).toThrow();
});
