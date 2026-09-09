import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CodeEditor } from './CodeEditor';

function Controlled({
  onChange,
  ...props
}: Partial<React.ComponentProps<typeof CodeEditor>> & { onChange?: (v: string) => void }) {
  const [v, setV] = useState('');
  return (
    <CodeEditor
      label="Input"
      {...props}
      value={v}
      onChange={(x) => {
        setV(x);
        onChange?.(x);
      }}
    />
  );
}

test('renders a labelled textarea and emits changes', async () => {
  const onChange = vi.fn();
  render(<Controlled onChange={onChange} placeholder="paste here" />);
  const ta = screen.getByLabelText('Input', { selector: 'textarea' });
  await userEvent.type(ta, 'hi');
  expect(onChange).toHaveBeenLastCalledWith('hi');
});

test('readOnly textarea does not accept typing', async () => {
  const onChange = vi.fn();
  render(<CodeEditor value="locked" readOnly label="Output" />);
  const ta = screen.getByLabelText('Output', { selector: 'textarea' }) as HTMLTextAreaElement;
  expect(ta).toHaveAttribute('readonly');
  await userEvent.type(ta, 'x');
  expect(onChange).not.toHaveBeenCalled();
});
