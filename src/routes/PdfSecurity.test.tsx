import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import PdfSecurity from './PdfSecurity';

const pdf = () =>
  new File([readFileSync(resolve(__dirname, '../test/fixtures/a.pdf'))], 'a.pdf', {
    type: 'application/pdf',
  });

test('states AES-256, on-device', () => {
  render(
    <MemoryRouter>
      <PdfSecurity />
    </MemoryRouter>,
  );
  expect(screen.getByText(/AES-256/i)).toBeInTheDocument();
});

test('empty password shows a friendly error', async () => {
  render(
    <MemoryRouter>
      <PdfSecurity />
    </MemoryRouter>,
  );
  await userEvent.upload(document.querySelector('input[type=file]') as HTMLInputElement, pdf());
  await userEvent.click(await screen.findByRole('button', { name: /protect pdf/i }));
  expect(await screen.findByText(/enter a password/i)).toBeInTheDocument();
});
