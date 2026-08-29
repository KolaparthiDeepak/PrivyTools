import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ImageUpscale from './ImageUpscale';

test('is explicit that there is no AI', () => {
  render(
    <MemoryRouter>
      <ImageUpscale />
    </MemoryRouter>,
  );
  expect(screen.getByText(/no ai/i)).toBeInTheDocument();
});
