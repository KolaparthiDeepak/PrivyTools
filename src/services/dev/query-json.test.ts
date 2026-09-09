import { queryToJson, jsonToQuery } from './query-json';

test('query to json, repeated key becomes array', () => {
  expect(queryToJson('?a=1&b=x&b=y')).toBe('{\n  "a": "1",\n  "b": [\n    "x",\n    "y"\n  ]\n}');
});
test('json to query', () => {
  expect(jsonToQuery('{"a":"1","b":["x","y"]}')).toBe('a=1&b=x&b=y');
});
test('json to query rejects nested objects', () => {
  expect(() => jsonToQuery('{"a":{"deep":1}}')).toThrow(/must be strings/);
});
test('json to query rejects bad json', () => {
  expect(() => jsonToQuery('{bad')).toThrow(/Invalid JSON/);
});
