import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { CommandPalette } from './CommandPalette';

test('filters by query', async () => {
  render(
    <MemoryRouter>
      <CommandPalette open onOpenChange={() => {}} />
    </MemoryRouter>,
  );
  await userEvent.type(screen.getByPlaceholderText(/what do you want to do/i), 'merge');
  expect(screen.getByText(/Merge PDF/i)).toBeInTheDocument();
  expect(screen.queryByText(/Upscale Image/i)).toBeNull();
});
