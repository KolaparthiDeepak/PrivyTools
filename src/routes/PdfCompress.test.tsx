import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import PdfCompress from './PdfCompress';

const pdf = () =>
  new File([readFileSync(resolve(__dirname, '../test/fixtures/a.pdf'))], 'a.pdf', {
    type: 'application/pdf',
  });

test('renders the compressor', () => {
  render(
    <MemoryRouter>
      <PdfCompress />
    </MemoryRouter>,
  );
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/lighter/i);
});

test('offers compression controls after a file is chosen', async () => {
  render(
    <MemoryRouter>
      <PdfCompress />
    </MemoryRouter>,
  );
  await userEvent.upload(document.querySelector('input[type=file]') as HTMLInputElement, pdf());
  expect(await screen.findByRole('button', { name: /compress pdf/i })).toBeInTheDocument();
  expect(screen.getByRole('radiogroup', { name: /preset/i })).toBeInTheDocument();
});
