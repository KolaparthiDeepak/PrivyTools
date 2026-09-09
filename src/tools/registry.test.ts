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
      'dev-base64', 'dev-case', 'dev-cron', 'dev-diff', 'dev-html-entities', 'dev-json-csv', 'dev-json-format', 'dev-json-ts', 'dev-json-yaml', 'dev-jwt', 'dev-lines', 'dev-query-json', 'dev-slug', 'dev-timestamp', 'dev-url',
      'image-compress', 'image-to-pdf', 'image-upscale',
      'pdf-compress', 'pdf-merge', 'pdf-security', 'pdf-to-image', 'privacy-center',
    ].sort(),
  );
});
test('all 15 dev tools are text kind, live, local, and route under /dev', () => {
  const dev = TOOLS.filter((t) => t.category === 'dev');
  expect(dev.length).toBe(15);
  for (const t of dev) {
    expect(t.kind).toBe('text');
    expect(t.status).toBe('live');
    expect(t.processing).toBe('local');
    expect(t.route.startsWith('/dev/')).toBe(true);
  }
});
