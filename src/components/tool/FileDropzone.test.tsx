import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileDropzone } from './FileDropzone';

test('rejects wrong type with friendly message', async () => {
  const onFile = vi.fn();
  render(<FileDropzone accept={['application/pdf']} mode="local" onFile={onFile} />);
  await userEvent.upload(
    document.querySelector('input[type=file]') as HTMLInputElement,
    new File(['x'], 'x.png', { type: 'image/png' }),
  );
  expect(onFile).not.toHaveBeenCalled();
  expect(screen.getByText(/needs a PDF/i)).toBeInTheDocument();
});
test('accepts correct type', async () => {
  const onFile = vi.fn();
  render(<FileDropzone accept={['application/pdf']} mode="local" onFile={onFile} />);
  await userEvent.upload(
    document.querySelector('input[type=file]') as HTMLInputElement,
    new File(['x'], 'x.pdf', { type: 'application/pdf' }),
  );
  expect(onFile).toHaveBeenCalled();
});
