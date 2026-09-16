import { RouterProvider } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { makeTestRouter } from './routes';
import { TOOLS } from '../tools/registry';

const mountAt = (path: string) => render(<RouterProvider router={makeTestRouter([path])} />);

test.each(TOOLS.map((t) => [t.route] as const))('route %s renders a main', async (route) => {
  const { unmount } = mountAt(route);
  expect(await screen.findByRole('main')).toBeInTheDocument();
  expect(screen.queryByText(/can.?t find that page/i)).toBeNull();
  unmount();
});
test('unknown route shows NotFound', async () => {
  mountAt('/nope');
  expect(await screen.findByText(/can.?t find that/i)).toBeInTheDocument();
});
