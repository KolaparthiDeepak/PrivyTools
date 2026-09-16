import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LinesTool } from './LinesTool';

const field = (name: RegExp) => screen.getByLabelText(name, { selector: 'textarea' });

test('applies sort option live', async () => {
  render(<LinesTool toolId="test-tool" />);
  await userEvent.type(field(/input/i), 'c\na\nb');
  await userEvent.click(screen.getByRole('radio', { name: /^A→Z$/i }));
  expect(field(/output/i)).toHaveValue('a\nb\nc');
});

test('unique checkbox dedupes', async () => {
  render(<LinesTool toolId="test-tool" />);
  await userEvent.type(field(/input/i), 'a\na\nb');
  await userEvent.click(screen.getByRole('checkbox', { name: /unique/i }));
  expect(field(/output/i)).toHaveValue('a\nb');
});

test('reverse checkbox flips order', async () => {
  render(<LinesTool toolId="test-tool" />);
  await userEvent.type(field(/input/i), 'a\nb\nc');
  await userEvent.click(screen.getByRole('checkbox', { name: /reverse/i }));
  expect(field(/output/i)).toHaveValue('c\nb\na');
});
