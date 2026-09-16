import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from './Dashboard';
import { TOOLS } from '../tools/registry';

test('shows hero copy', () => {
  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>,
  );
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/your files/i);
});
test('a routing card for every tool except Privacy Center', () => {
  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>,
  );
  for (const t of TOOLS.filter((t) => t.id !== 'privacy-center')) {
    const links = screen.getAllByRole('link', { name: new RegExp(t.name, 'i') });
    expect(links.some((l) => l.getAttribute('href') === t.route)).toBe(true);
  }
});
test('Privacy Center is not on the dashboard', () => {
  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>,
  );
  expect(screen.queryByRole('link', { name: /privacy center/i })).toBeNull();
});
