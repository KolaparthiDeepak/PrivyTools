import { render, screen } from '@testing-library/react';
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
const findOutput = () => screen.findByLabelText(/output/i, { selector: 'textarea' });

test('live transforms input to output', async () => {
  render(<SplitTool directions={dirs} />);
  await userEvent.type(input(), 'abc');
  expect(await findOutput()).toHaveValue('ABC');
});

test('shows error banner on bad input, keeps last output', async () => {
  render(<SplitTool directions={dirs} />);
  await userEvent.type(input(), 'ok');
  expect(await findOutput()).toHaveValue('OK');
  await userEvent.clear(input());
  await userEvent.type(input(), 'boom');
  expect(await screen.findByRole('alert')).toHaveTextContent('nope');
  expect(output()).toHaveValue('OK');
});

test('swap moves output into input and flips direction', async () => {
  render(<SplitTool directions={dirs} />);
  await userEvent.type(input(), 'aa');
  expect(await findOutput()).toHaveValue('AA');
  await userEvent.click(screen.getByRole('button', { name: /swap/i }));
  expect(input()).toHaveValue('AA');
  expect(await findOutput()).toHaveValue('aa');
});
