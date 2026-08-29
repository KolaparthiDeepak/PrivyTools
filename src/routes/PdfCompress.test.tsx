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

test('shows estimate disclaimer up front', () => {
  render(
    <MemoryRouter>
      <PdfCompress />
    </MemoryRouter>,
  );
  expect(screen.getByText(/Sizes are estimates/i)).toBeInTheDocument();
});

test('reaches a result labeled estimated', async () => {
  render(
    <MemoryRouter>
      <PdfCompress />
    </MemoryRouter>,
  );
  await userEvent.upload(document.querySelector('input[type=file]') as HTMLInputElement, pdf());
  await userEvent.click(await screen.findByRole('button', { name: /compress pdf/i }));
  expect(await screen.findByText(/estimated/i)).toBeInTheDocument();
});
