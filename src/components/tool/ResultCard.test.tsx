import { render, screen } from '@testing-library/react';
import { ResultCard } from './ResultCard';

const base = {
  blob: new Blob(['x'], { type: 'application/pdf' }),
  filename: 'merged.pdf',
  originalBytes: 42.8 * 1024 ** 2,
  outputBytes: 8.4 * 1024 ** 2,
};

test('shows size delta and saved', () => {
  render(<ResultCard result={base} onReset={() => {}} />);
  expect(screen.getByText(/42\.8 MB/)).toBeInTheDocument();
  expect(screen.getByText(/8\.4 MB/)).toBeInTheDocument();
  expect(screen.getByText(/saved/i)).toBeInTheDocument();
});
test('demo result shows honest line, no Saved', () => {
  render(<ResultCard result={{ ...base, demo: true, meta: { estimate: 1 } }} onReset={() => {}} />);
  expect(screen.getByText(/preview|no real transformation/i)).toBeInTheDocument();
  expect(screen.getByText(/estimated/i)).toBeInTheDocument();
});
test('has download + process another', () => {
  render(<ResultCard result={base} onReset={() => {}} />);
  expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /process another/i })).toBeInTheDocument();
});
