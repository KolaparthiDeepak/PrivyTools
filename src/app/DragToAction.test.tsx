import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DragToAction } from './DragToAction';

test('shows action overlay for a pdf and hides non-matching tools', () => {
  render(
    <MemoryRouter>
      <DragToAction />
    </MemoryRouter>,
  );
  fireEvent.dragEnter(window, {
    dataTransfer: { types: ['Files'], items: [{ kind: 'file', type: 'application/pdf' }] },
  });
  expect(screen.getByText(/what would you like to do/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /merge/i })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /upscale/i })).toBeNull();
});

test('never offers text-only dev tools, even with an unknown drag type', () => {
  render(
    <MemoryRouter>
      <DragToAction />
    </MemoryRouter>,
  );
  fireEvent.dragEnter(window, {
    dataTransfer: { types: ['Files'], items: [{ kind: 'file', type: '' }] },
  });
  expect(screen.getByText(/what would you like to do/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /merge pdf/i })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /jwt decoder/i })).toBeNull();
  expect(screen.queryByRole('button', { name: /cron explainer/i })).toBeNull();
});
