import { usePrefs } from './prefs.store';

beforeEach(() => {
  localStorage.clear();
  usePrefs.setState({ favorites: [], recent: [], theme: 'system', telemetry: false });
});

test('toggleFavorite adds then removes', () => {
  usePrefs.getState().toggleFavorite('pdf-merge');
  expect(usePrefs.getState().favorites).toEqual(['pdf-merge']);
  usePrefs.getState().toggleFavorite('pdf-merge');
  expect(usePrefs.getState().favorites).toEqual([]);
});
test('pushRecent caps 5, recent-first, deduped', () => {
  ['a', 'b', 'c', 'd', 'e', 'f', 'b'].forEach((id) => usePrefs.getState().pushRecent(id));
  expect(usePrefs.getState().recent).toEqual(['b', 'f', 'e', 'd', 'c']);
});
test('persists theme', () => {
  usePrefs.getState().setTheme('dark');
  expect(localStorage.getItem('privytools:prefs')!).toMatch(/dark/);
});
test('never stores file-shaped data', () => {
  usePrefs.getState().pushRecent('pdf-merge');
  expect(localStorage.getItem('privytools:prefs')!).not.toMatch(/blob:|data:|ArrayBuffer/);
});
