import { RouterProvider } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { makeTestRouter } from './routes';
import { TOOLS } from '../tools/registry';

const mountAt = (path: string) => render(<RouterProvider router={makeTestRouter([path])} />);

test('every tool route renders a main', async () => {
  for (const t of TOOLS) {
    mountAt(t.route);
    expect(await screen.findByRole('main')).toBeInTheDocument();
  }
});
test('unknown route shows NotFound', async () => {
  mountAt('/nope');
  expect(await screen.findByText(/can.?t find that/i)).toBeInTheDocument();
});
