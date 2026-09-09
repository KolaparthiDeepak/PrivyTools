import { render, screen } from '@testing-library/react';
import { RouterProvider } from 'react-router-dom';
import { makeTestRouter } from './app/routes';

test('dashboard has one h1 and a main', async () => {
  render(<RouterProvider router={makeTestRouter(['/'])} />);
  expect(await screen.findByRole('main')).toBeInTheDocument();
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
});
test('every button on the merge route has an accessible name', async () => {
  render(<RouterProvider router={makeTestRouter(['/pdf/merge'])} />);
  await screen.findByRole('main');
  for (const b of screen.getAllByRole('button')) {
    expect(b).toHaveAccessibleName();
  }
});
test('a dev tool route has one h1, a main, and named buttons', async () => {
  render(<RouterProvider router={makeTestRouter(['/dev/case'])} />);
  await screen.findByRole('main');
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  for (const b of screen.getAllByRole('button')) {
    expect(b).toHaveAccessibleName();
  }
});
