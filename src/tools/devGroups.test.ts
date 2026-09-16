import { toolsInDevGroup } from './devGroups';

test('toolsInDevGroup resolves ids to real Tool objects', () => {
  const tools = toolsInDevGroup('converters');
  expect(tools.length).toBe(5);
  expect(tools.map((t) => t.id)).toContain('dev-json-format');
  expect(tools.every((t) => t.category === 'dev')).toBe(true);
});
