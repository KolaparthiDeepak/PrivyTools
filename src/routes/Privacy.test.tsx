import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Privacy from './Privacy';

test('lists each tool with its mode', () => {
  render(
    <MemoryRouter>
      <Privacy />
    </MemoryRouter>,
  );
  expect(screen.getByText('PDF Security')).toBeInTheDocument();
  expect(screen.getAllByText(/local|demo|server|preview/i).length).toBeGreaterThan(3);
});
test('does not claim everything is fully local', () => {
  render(
    <MemoryRouter>
      <Privacy />
    </MemoryRouter>,
  );
  expect(screen.queryByText(/all operations are fully local/i)).toBeNull();
});
