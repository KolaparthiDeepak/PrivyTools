import { usePrefs } from './prefs.store';

beforeEach(() => {
  localStorage.clear();
  usePrefs.setState({ favorites: [], theme: 'system', telemetry: false });
});

test('toggleFavorite adds then removes', () => {
  usePrefs.getState().toggleFavorite('pdf-merge');
  expect(usePrefs.getState().favorites).toEqual(['pdf-merge']);
  usePrefs.getState().toggleFavorite('pdf-merge');
  expect(usePrefs.getState().favorites).toEqual([]);
});
test('persists theme', () => {
  usePrefs.getState().setTheme('dark');
  expect(localStorage.getItem('privytools:prefs')!).toMatch(/dark/);
});
test('never stores file-shaped data', () => {
  usePrefs.getState().toggleFavorite('pdf-merge');
  expect(localStorage.getItem('privytools:prefs')!).not.toMatch(/blob:|data:|ArrayBuffer/);
});
