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
  await userEvent.type(screen.getByPlaceholderText(/what do you want to do/i), 'security');
  expect(screen.getByText(/PDF Security/i)).toBeInTheDocument();
  expect(screen.queryByText(/Merge PDF/i)).toBeNull();
});

test('finds a developer tool by name under its sub-group', async () => {
  render(
    <MemoryRouter>
      <CommandPalette open onOpenChange={() => {}} />
    </MemoryRouter>,
  );
  await userEvent.type(screen.getByPlaceholderText(/what do you want to do/i), 'JWT');
  expect(screen.getByText(/JWT Decoder/i)).toBeInTheDocument();
  expect(screen.getByText('Encoders / Decoders')).toBeInTheDocument();
});
