import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dialog } from './Dialog';

test('Esc closes', async () => {
  const onClose = vi.fn();
  render(
    <Dialog open title="T" onClose={onClose}>
      <p>body</p>
    </Dialog>,
  );
  await userEvent.keyboard('{Escape}');
  expect(onClose).toHaveBeenCalled();
});
test('no children when closed', () => {
  render(
    <Dialog open={false} title="T" onClose={() => {}}>
      <p>body</p>
    </Dialog>,
  );
  expect(screen.queryByText('body')).toBeNull();
});
