import { diffText } from './text-diff';

test('marks added and removed lines', () => {
  const lines = diffText('a\nb\nc\n', 'a\nB\nc\n');
  const kinds = lines.map((l) => `${l.kind}:${l.text}`);
  expect(kinds).toContain('remove:b');
  expect(kinds).toContain('add:B');
  expect(kinds).toContain('context:a');
});

test('identical input is all context', () => {
  expect(diffText('x\ny\n', 'x\ny\n').every((l) => l.kind === 'context')).toBe(true);
});

test('never throws on odd input', () => {
  expect(() => diffText('', '')).not.toThrow();
  expect(() => diffText('no newline', 'still none')).not.toThrow();
});
