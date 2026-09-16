import { jsonToYaml, yamlToJson } from './json-yaml';

test('json to yaml', () => {
  expect(jsonToYaml('{"a":1,"b":["x","y"]}')).toBe("a: 1\nb:\n  - x\n  - 'y'\n");
});

test('yaml to json', () => {
  expect(yamlToJson('a: 1\nb:\n  - x\n')).toBe('{\n  "a": 1,\n  "b": [\n    "x"\n  ]\n}');
});

test('round-trips', () => {
  const json = '{\n  "n": 5,\n  "list": [\n    1,\n    2\n  ]\n}';
  expect(yamlToJson(jsonToYaml(json))).toBe(json);
});

test('bad json throws', () => {
  expect(() => jsonToYaml('{oops')).toThrow(/Invalid JSON/);
});

test('bad yaml throws', () => {
  expect(() => yamlToJson('a:\n  - b\n - c')).toThrow(/Invalid YAML/);
});
