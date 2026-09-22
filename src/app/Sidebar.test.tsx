import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TOOLS } from '../tools/registry';

const renderAt = (path = '/') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Sidebar />
    </MemoryRouter>,
  );

const heading = (name: string) => screen.getByRole('button', { name });

test('has a Home link', () => {
  renderAt();
  expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/');
});

test('shows only section headings at first, with Developer groups promoted to sections', () => {
  renderAt();
  for (const name of ['PDF', 'Image', 'Converters', 'Encoders / Decoders', 'Encryption', 'Text Utilities', 'Date & Schedule', 'Privacy']) {
    expect(heading(name)).toHaveAttribute('aria-expanded', 'false');
  }
  expect(screen.queryByText('Developer')).toBeNull();
  expect(screen.queryByRole('link', { name: /merge pdf/i })).toBeNull();
});

test('opening a heading closes the previously open one', async () => {
  renderAt();
  await userEvent.click(heading('PDF'));
  expect(screen.getByRole('link', { name: /merge pdf/i })).toBeInTheDocument();
  await userEvent.click(heading('Encryption'));
  expect(heading('PDF')).toHaveAttribute('aria-expanded', 'false');
  expect(screen.queryByRole('link', { name: /merge pdf/i })).toBeNull();
  expect(screen.getByRole('link', { name: /jasypt/i })).toHaveAttribute('href', '/dev/jasypt');
  await userEvent.click(heading('Encryption'));
  expect(screen.queryByRole('link', { name: /jasypt/i })).toBeNull();
});

test('the current page’s section starts open', () => {
  renderAt('/dev/diff');
  expect(heading('Text Utilities')).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByRole('link', { name: /text diff/i })).toBeInTheDocument();
});

test('every tool is reachable through some heading', async () => {
  renderAt();
  const sections = screen.getAllByRole('button').filter((b) => b.hasAttribute('aria-expanded'));
  const hrefs = new Set<string>();
  for (const b of sections) {
    await userEvent.click(b);
    screen.getAllByRole('link').forEach((a) => hrefs.add(a.getAttribute('href')!));
  }
  for (const t of TOOLS) expect(hrefs).toContain(t.route);
});
