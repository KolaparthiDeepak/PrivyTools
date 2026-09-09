import { TOOLS, getTool, CATEGORIES } from './registry';

test('unique ids', () => {
  const ids = TOOLS.map((t) => t.id);
  expect(new Set(ids).size).toBe(ids.length);
});
test('routes absolute + unique', () => {
  const r = TOOLS.map((t) => t.route);
  r.forEach((x) => expect(x.startsWith('/')).toBe(true));
  expect(new Set(r).size).toBe(r.length);
});
test('categories resolve', () => {
  TOOLS.forEach((t) => expect(CATEGORIES[t.category]).toBeDefined());
});
test('file tools declare accept types', () => {
  TOOLS.filter((t) => (t.kind ?? 'file') === 'file' && t.id !== 'privacy-center').forEach((t) =>
    expect(t.accept.length).toBeGreaterThan(0),
  );
});
test('text tools carry kind and empty accept', () => {
  TOOLS.filter((t) => t.kind === 'text').forEach((t) => {
    expect(t.category).toBe('dev');
    expect(t.accept).toEqual([]);
  });
});
test('every processing tool is live and local', () => {
  for (const id of [
    'pdf-security', 'pdf-compress', 'pdf-merge', 'pdf-to-image',
    'image-compress', 'image-upscale', 'image-to-pdf',
  ]) {
    expect(getTool(id)!.status).toBe('live');
    expect(getTool(id)!.processing).toBe('local');
  }
});
test('exact tool set', () => {
  expect(TOOLS.map((t) => t.id).sort()).toEqual(
    [
      'dev-json-format',
      'image-compress', 'image-to-pdf', 'image-upscale',
      'pdf-compress', 'pdf-merge', 'pdf-security', 'pdf-to-image', 'privacy-center',
    ].sort(),
  );
});
