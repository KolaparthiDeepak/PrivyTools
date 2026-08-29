import { privacyStatus } from './privacy.service';

test('rows for every tool with mode + note', () => {
  const s = privacyStatus();
  expect(s.length).toBeGreaterThanOrEqual(5);
  s.forEach((r) => {
    expect(r.name).toBeTruthy();
    expect(['local', 'local-partial', 'server']).toContain(r.mode);
    expect(r.note).toBeTruthy();
  });
});
test('all processing tools now run locally', () => {
  expect(privacyStatus().every((r) => r.mode === 'local')).toBe(true);
});
