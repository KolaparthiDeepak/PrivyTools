import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { readFileSync } from 'node:fs';
import ImageToPdf from './ImageToPdf';

const img = (p: string, n: string, type: string) =>
  new File([readFileSync(new URL(p, import.meta.url))], n, { type });

test('combines two images into a PDF', async () => {
  render(
    <MemoryRouter>
      <ImageToPdf />
    </MemoryRouter>,
  );
  await userEvent.upload(document.querySelector('input[type=file]') as HTMLInputElement, [
    img('../test/fixtures/sample.jpg', 'a.jpg', 'image/jpeg'),
    img('../test/fixtures/sample.png', 'b.png', 'image/png'),
  ]);
  await userEvent.click(await screen.findByRole('button', { name: /create pdf/i }));
  expect(await screen.findByText(/PDF created/i)).toBeInTheDocument();
  expect(screen.getByText(/2 pages/i)).toBeInTheDocument();
});
