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
test('demo tools described honestly', () => {
  const sec = privacyStatus().find((r) => r.toolId === 'pdf-security')!;
  expect(sec.note.toLowerCase()).toMatch(/demo|preview|not yet|pending/);
});
