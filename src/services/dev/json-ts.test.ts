import { jsonToTs } from './json-ts';

test('primitives and nested object', () => {
  const out = jsonToTs('{"id":1,"name":"x","meta":{"active":true}}');
  expect(out).toContain('interface Root {');
  expect(out).toContain('id: number;');
  expect(out).toContain('name: string;');
  expect(out).toContain('meta: RootMeta;');
  expect(out).toContain('interface RootMeta {');
  expect(out).toContain('active: boolean;');
});

test('array element type from first item', () => {
  expect(jsonToTs('{"tags":["a","b"]}')).toContain('tags: string[];');
});

test('empty array is unknown[]', () => {
  expect(jsonToTs('{"x":[]}')).toContain('x: unknown[];');
});

test('bad json throws', () => {
  expect(() => jsonToTs('{bad')).toThrow(/Invalid JSON/);
});
