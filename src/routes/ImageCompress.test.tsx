import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ImageCompress from './ImageCompress';

vi.mock('../services/image.encode', () => ({
  encode: async (_f: File, format: string) => new Blob([new Uint8Array(64)], { type: format }),
}));

test('compresses an image and shows a smaller size', async () => {
  render(
    <MemoryRouter>
      <ImageCompress />
    </MemoryRouter>,
  );
  await userEvent.upload(
    document.querySelector('input[type=file]') as HTMLInputElement,
    new File([new Uint8Array(4096)], 'p.jpg', { type: 'image/jpeg' }),
  );
  await userEvent.click(await screen.findByRole('button', { name: /compress/i }));
  expect(await screen.findByText(/% smaller/i)).toBeInTheDocument();
});
