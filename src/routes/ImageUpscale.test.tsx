import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ImageUpscale from './ImageUpscale';

test('is honest that AI is not connected', () => {
  render(
    <MemoryRouter>
      <ImageUpscale />
    </MemoryRouter>,
  );
  expect(screen.getByText(/bicubic scaling/i)).toBeInTheDocument();
});
