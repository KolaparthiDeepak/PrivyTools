import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

test('calls onClick', async () => {
  const fn = vi.fn();
  render(<Button onClick={fn}>Go</Button>);
  await userEvent.click(screen.getByRole('button', { name: 'Go' }));
  expect(fn).toHaveBeenCalled();
});
test('disabled blocks click', async () => {
  const fn = vi.fn();
  render(
    <Button disabled onClick={fn}>
      Go
    </Button>,
  );
  await userEvent.click(screen.getByRole('button'));
  expect(fn).not.toHaveBeenCalled();
});
test('variant class applied', () => {
  render(<Button variant="primary">Go</Button>);
  expect(screen.getByRole('button').className).toMatch(/bg-/);
});
