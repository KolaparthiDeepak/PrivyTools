import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DiffTool } from './DiffTool';
import { diffText } from '../../services/dev/text-diff';

const field = (name: RegExp) => screen.getByLabelText(name, { selector: 'textarea' });

test('shows a changed line in the diff panel', async () => {
  render(<DiffTool diff={diffText} />);
  await userEvent.type(field(/original/i), 'hello');
  await userEvent.type(field(/changed/i), 'world');
  const panel = await screen.findByTestId('diff-output');
  expect(panel).toHaveTextContent('hello');
  expect(panel).toHaveTextContent('world');
});

test('summary counts added and removed lines', async () => {
  render(<DiffTool diff={diffText} />);
  await userEvent.type(field(/original/i), 'a{Enter}b');
  await userEvent.type(field(/changed/i), 'a{Enter}B');
  expect(screen.getByText('+1')).toBeInTheDocument();
  expect(screen.getByText('−1')).toBeInTheDocument();
});
