import { render } from '@testing-library/react';
import { act } from 'react';
import { ThemeProvider } from './ThemeProvider';
import { usePrefs } from '../store/prefs.store';

test('sets data-mode from prefs.theme', () => {
  act(() => usePrefs.setState({ theme: 'light' }));
  render(
    <ThemeProvider>
      <div />
    </ThemeProvider>,
  );
  expect(document.documentElement.dataset.mode).toBe('light');
  act(() => usePrefs.setState({ theme: 'dark' }));
  expect(document.documentElement.dataset.mode).toBe('dark');
});
