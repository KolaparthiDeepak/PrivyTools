import { prettyJson, minifyJson } from './json-format';

test('pretty-prints with 2-space indent', () => {
  expect(prettyJson('{"a":1,"b":[2,3]}')).toBe('{\n  "a": 1,\n  "b": [\n    2,\n    3\n  ]\n}');
});

test('minifies', () => {
  expect(minifyJson('{\n  "a": 1\n}')).toBe('{"a":1}');
});

test('throws a readable error on bad JSON', () => {
  expect(() => prettyJson('{bad}')).toThrow(/Invalid JSON/);
});
