import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CodeEditor } from './CodeEditor';

test('renders a labelled textarea and emits changes', async () => {
  const onChange = vi.fn();
  render(<CodeEditor value="" onChange={onChange} label="Input" placeholder="paste here" />);
  const ta = screen.getByLabelText('Input');
  await userEvent.type(ta, 'hi');
  expect(onChange).toHaveBeenLastCalledWith('hi');
});

test('readOnly textarea does not accept typing', async () => {
  const onChange = vi.fn();
  render(<CodeEditor value="locked" readOnly label="Output" />);
  const ta = screen.getByLabelText('Output') as HTMLTextAreaElement;
  expect(ta).toHaveAttribute('readonly');
  await userEvent.type(ta, 'x');
  expect(onChange).not.toHaveBeenCalled();
});
