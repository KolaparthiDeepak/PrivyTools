import { convertCases } from './case-convert';

test('converts from mixed input', () => {
  const r = convertCases('hello world-example_string');
  expect(r.camel).toBe('helloWorldExampleString');
  expect(r.pascal).toBe('HelloWorldExampleString');
  expect(r.snake).toBe('hello_world_example_string');
  expect(r.kebab).toBe('hello-world-example-string');
  expect(r.constant).toBe('HELLO_WORLD_EXAMPLE_STRING');
  expect(r.title).toBe('Hello World Example String');
});
test('splits camelCase humps', () => {
  expect(convertCases('getHTTPResponseCode').snake).toBe('get_http_response_code');
});
