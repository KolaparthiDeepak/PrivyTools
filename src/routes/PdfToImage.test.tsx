import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { readFileSync } from 'node:fs';
import PdfToImage from './PdfToImage';

const pdf = (p: string, n: string) =>
  new File([readFileSync(new URL(p, import.meta.url))], n, { type: 'application/pdf' });

test('converts a PDF to a zip of page images', async () => {
  render(
    <MemoryRouter>
      <PdfToImage />
    </MemoryRouter>,
  );
  await userEvent.upload(
    document.querySelector('input[type=file]') as HTMLInputElement,
    pdf('../test/fixtures/a.pdf', 'a.pdf'),
  );
  await userEvent.click(await screen.findByRole('button', { name: /convert to images/i }));
  expect(await screen.findByText(/pages converted/i)).toBeInTheDocument();
  expect(screen.getByText(/2 pages/i)).toBeInTheDocument();
});
