import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { readFileSync } from 'node:fs';
import { usePrefs } from '../store/prefs.store';
import { useUsage } from '../store/usage.store';
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

test('completing a merge with telemetry on tracks one usage for pdf-merge', async () => {
  usePrefs.setState({ telemetry: true });
  useUsage.setState({ counts: {} });
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
  await screen.findByText(/PDFs merged/i);
  expect(useUsage.getState().counts['pdf-merge']).toBe(1);
  usePrefs.setState({ telemetry: false });
});
