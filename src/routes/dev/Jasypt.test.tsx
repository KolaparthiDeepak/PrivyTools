import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Jasypt from './Jasypt';

// Real ciphertext from jasypt 1.9.3, PBEWithMD5AndDES, no IV, password "s3cr3t-pass".
const LEGACY = 'ENC(bwOkDcyz3GhVauPW8uU+wHDTlqLOIn9cfZehGIYMmL71vY9coSGuCGPN8/3PYxRXnA4Y8bgTU5fUpKhz+KYZCg==)';

test('decrypts a legacy Jasypt value with the chosen password and algorithm', async () => {
  render(
    <MemoryRouter>
      <Jasypt />
    </MemoryRouter>,
  );
  await userEvent.type(screen.getByLabelText('Password'), 's3cr3t-pass');
  await userEvent.selectOptions(screen.getByLabelText('Algorithm'), 'PBEWithMD5AndDES');
  await userEvent.click(screen.getByLabelText('Random IV generator'));
  const input = screen.getByLabelText('Input', { selector: 'textarea' });
  await userEvent.click(input);
  await userEvent.paste(LEGACY);
  expect(await screen.findByDisplayValue('héllo wörld – jdbc:mysql://db/prod?pw=hunter2')).toBeInTheDocument();
});

test('asks for the password instead of failing silently', async () => {
  render(
    <MemoryRouter>
      <Jasypt />
    </MemoryRouter>,
  );
  await userEvent.type(screen.getByLabelText('Input', { selector: 'textarea' }), 'abc');
  expect(await screen.findByRole('alert')).toHaveTextContent('Enter the password');
});
