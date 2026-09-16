import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SplitTool } from './SplitTool';

const dirs = [
  {
    id: 'up', label: 'lower → UPPER',
    transform: (s: string) => { if (s === 'boom') throw new Error('nope'); return s.toUpperCase(); },
    inputLanguage: 'text' as const, outputLanguage: 'text' as const,
    downloadName: 'out.txt', downloadType: 'text/plain',
  },
  {
    id: 'down', label: 'UPPER → lower',
    transform: (s: string) => s.toLowerCase(),
    inputLanguage: 'text' as const, outputLanguage: 'text' as const,
    downloadName: 'out.txt', downloadType: 'text/plain',
  },
];

const input = () => screen.getByLabelText(/input/i, { selector: 'textarea' });
const output = () => screen.getByLabelText(/output/i, { selector: 'textarea' });

test('live transforms input to output', async () => {
  render(<SplitTool toolId="test-tool" directions={dirs} />);
  await userEvent.type(input(), 'abc');
  await waitFor(() => expect(output()).toHaveValue('ABC'));
});

test('shows error banner on bad input, keeps last output', async () => {
  render(<SplitTool toolId="test-tool" directions={dirs} />);
  await userEvent.type(input(), 'ok');
  await waitFor(() => expect(output()).toHaveValue('OK'));
  await userEvent.clear(input());
  await userEvent.type(input(), 'boom');
  expect(await screen.findByRole('alert')).toHaveTextContent('nope');
  expect(output()).toHaveValue('OK');
});

test('swap moves output into input and flips direction', async () => {
  render(<SplitTool toolId="test-tool" directions={dirs} />);
  await userEvent.type(input(), 'aa');
  await waitFor(() => expect(output()).toHaveValue('AA'));
  await userEvent.click(screen.getByRole('button', { name: /swap/i }));
  expect(input()).toHaveValue('AA');
  await waitFor(() => expect(output()).toHaveValue('aa'));
});

test('fileAsBytes reads a file as base64 into the input', async () => {
  render(<SplitTool toolId="test-tool" directions={dirs} fileAsBytes />);
  const file = new File([new Uint8Array([1, 2, 3])], 'x.bin');
  await userEvent.upload(screen.getByLabelText(/open file/i), file);
  await waitFor(() => expect(input()).toHaveValue(btoa(String.fromCharCode(1, 2, 3))));
});
