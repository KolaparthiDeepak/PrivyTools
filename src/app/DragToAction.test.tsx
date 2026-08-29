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
