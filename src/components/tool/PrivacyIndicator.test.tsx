import { render, screen } from '@testing-library/react';
import { PrivacyIndicator } from './PrivacyIndicator';

test('local says on your device', () => {
  render(<PrivacyIndicator mode="local" />);
  expect(screen.getByText(/on your device/i)).toBeInTheDocument();
});
test('local-partial honest about demo', () => {
  render(<PrivacyIndicator mode="local-partial" />);
  expect(screen.getByText(/demo|not yet|preview/i)).toBeInTheDocument();
});
test('server explicit', () => {
  render(<PrivacyIndicator mode="server" />);
  expect(screen.getByText(/server/i)).toBeInTheDocument();
});
