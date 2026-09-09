import { jsonToCsv, csvToJson } from './json-csv';

test('json array to csv', () => {
  expect(jsonToCsv('[{"a":1,"b":"x"},{"a":2,"b":"y"}]')).toBe('a,b\r\n1,x\r\n2,y');
});

test('csv to json', () => {
  expect(csvToJson('a,b\r\n1,x\r\n2,y')).toBe('[\n  {\n    "a": "1",\n    "b": "x"\n  },\n  {\n    "a": "2",\n    "b": "y"\n  }\n]');
});

test('rejects non-array json', () => {
  expect(() => jsonToCsv('{"a":1}')).toThrow(/array of objects/);
});

test('rejects bad json', () => {
  expect(() => jsonToCsv('[bad')).toThrow(/Invalid JSON/);
});
