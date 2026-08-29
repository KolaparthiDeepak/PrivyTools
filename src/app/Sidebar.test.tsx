import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TOOLS } from '../tools/registry';

test('a link for every tool', () => {
  render(
    <MemoryRouter>
      <Sidebar />
    </MemoryRouter>,
  );
  for (const t of TOOLS) {
    expect(screen.getByRole('link', { name: new RegExp(t.name, 'i') })).toHaveAttribute(
      'href',
      t.route,
    );
  }
});
test('has a Home link', () => {
  render(
    <MemoryRouter>
      <Sidebar />
    </MemoryRouter>,
  );
  expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/');
});
