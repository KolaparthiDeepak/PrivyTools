import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JwtTool } from './JwtTool';
import { decodeJwt } from '../../services/dev/jwt';

const TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiQWRhIiwiaWF0IjoxNzAwMDAwMDAwfQ.abc123';

const pane = (name: RegExp) => screen.getByLabelText(name, { selector: 'textarea' });

test('fills the three panes from a token', async () => {
  render(<JwtTool decode={decodeJwt} />);
  await userEvent.type(screen.getByLabelText(/jwt token/i), TOKEN);

  expect(pane(/header/i)).toHaveValue(JSON.stringify({ alg: 'HS256', typ: 'JWT' }, null, 2));
  expect(pane(/payload/i)).toHaveValue(
    JSON.stringify({ sub: '123', name: 'Ada', iat: 1700000000 }, null, 2),
  );
  expect(pane(/signature/i)).toHaveValue('abc123');
});

test('humanised iat claim shows below the payload', async () => {
  render(<JwtTool decode={decodeJwt} />);
  await userEvent.type(screen.getByLabelText(/jwt token/i), TOKEN);
  expect(screen.getByText('Issued at')).toBeInTheDocument();
  expect(screen.getByText(/^2023-11-14T/)).toBeInTheDocument();
});

test('always shows the not-verified note', () => {
  render(<JwtTool decode={decodeJwt} />);
  expect(
    screen.getByText('Signature is not verified. This tool only decodes.'),
  ).toBeInTheDocument();
});

test('shows an error for a bad token', async () => {
  render(<JwtTool decode={decodeJwt} />);
  await userEvent.type(screen.getByLabelText(/jwt token/i), 'a.b');
  expect(await screen.findByRole('alert')).toHaveTextContent(/expected 3/);
});
