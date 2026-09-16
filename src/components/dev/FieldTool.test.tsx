import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FieldTool } from './FieldTool';

const compute = (s: string) => {
  if (s === 'bad') throw new Error('no good');
  return [{ label: 'Upper', value: s.toUpperCase() }, { label: 'Length', value: String(s.length) }];
};

test('renders computed rows', async () => {
  render(<FieldTool toolId="test-tool" compute={compute} inputLabel="Text" />);
  await userEvent.type(screen.getByLabelText('Text'), 'ab');
  expect(await screen.findByText('AB')).toBeInTheDocument();
  expect(screen.getByText('2')).toBeInTheDocument();
});

test('shows error, keeps prior rows', async () => {
  render(<FieldTool toolId="test-tool" compute={compute} inputLabel="Text" />);
  const input = screen.getByLabelText('Text');
  await userEvent.type(input, 'ok');
  await screen.findByText('OK');
  await userEvent.clear(input);
  await userEvent.type(input, 'bad');
  expect(await screen.findByRole('alert')).toHaveTextContent('no good');
  expect(screen.getByText('OK')).toBeInTheDocument();
});
