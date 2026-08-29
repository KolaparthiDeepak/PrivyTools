import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BeforeAfterComparison } from './BeforeAfterComparison';

test('arrow keys change split', async () => {
  render(<BeforeAfterComparison before={<div>B</div>} after={<div>A</div>} initial={0.5} />);
  const handle = screen.getByRole('slider');
  handle.focus();
  await userEvent.keyboard('{ArrowRight}{ArrowRight}');
  expect(Number(handle.getAttribute('aria-valuenow'))).toBeGreaterThan(50);
});
test('renders labels', () => {
  render(
    <BeforeAfterComparison
      before={<div>B</div>}
      after={<div>A</div>}
      beforeLabel="ORIGINAL"
      afterLabel="COMPRESSED"
    />,
  );
  expect(screen.getByText('ORIGINAL')).toBeInTheDocument();
  expect(screen.getByText('COMPRESSED')).toBeInTheDocument();
});
