import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Segmented } from './Segmented';

const opts = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B' },
  { value: 'c', label: 'C' },
];

test('click calls onChange', async () => {
  const fn = vi.fn();
  render(<Segmented options={opts} value="a" onChange={fn} aria-label="x" />);
  await userEvent.click(screen.getByRole('radio', { name: 'B' }));
  expect(fn).toHaveBeenCalledWith('b');
});
test('arrow key moves', async () => {
  const fn = vi.fn();
  render(<Segmented options={opts} value="a" onChange={fn} aria-label="x" />);
  screen.getByRole('radio', { name: 'A' }).focus();
  await userEvent.keyboard('{ArrowRight}');
  expect(fn).toHaveBeenCalledWith('b');
});
