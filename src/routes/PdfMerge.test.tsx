import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { readFileSync } from 'node:fs';
import PdfMerge from './PdfMerge';

const pdf = (p: string, n: string) =>
  new File([readFileSync(new URL(p, import.meta.url))], n, { type: 'application/pdf' });

test('merges two PDFs to the result state', async () => {
  render(
    <MemoryRouter>
      <PdfMerge />
    </MemoryRouter>,
  );
  await userEvent.upload(document.querySelector('input[type=file]') as HTMLInputElement, [
    pdf('../test/fixtures/a.pdf', 'a.pdf'),
    pdf('../test/fixtures/b.pdf', 'b.pdf'),
  ]);
  await userEvent.click(await screen.findByRole('button', { name: /^merge pdfs/i }));
  expect(await screen.findByText(/PDFs merged/i)).toBeInTheDocument();
  expect(screen.getByText(/5 pages/i)).toBeInTheDocument();
});

test('merge disabled with one file', async () => {
  render(
    <MemoryRouter>
      <PdfMerge />
    </MemoryRouter>,
  );
  await userEvent.upload(document.querySelector('input[type=file]') as HTMLInputElement, [
    pdf('../test/fixtures/a.pdf', 'a.pdf'),
  ]);
  expect(await screen.findByRole('button', { name: /^merge pdfs/i })).toBeDisabled();
});
