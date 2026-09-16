import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UsagePanel } from './UsagePanel';
import { usePrefs } from '../../store/prefs.store';
import { useUsage } from '../../store/usage.store';

beforeEach(() => {
  usePrefs.setState({ telemetry: false });
  useUsage.setState({ counts: {} });
});

test('shows a message and no counts when telemetry is off', () => {
  useUsage.setState({ counts: { 'pdf-merge': 3 } });
  render(<UsagePanel />);
  expect(screen.getByText(/turn on telemetry/i)).toBeInTheDocument();
  expect(screen.queryByText('Merge PDF')).toBeNull();
});

test('shows total and per-tool counts when telemetry is on', () => {
  usePrefs.setState({ telemetry: true });
  useUsage.setState({ counts: { 'pdf-merge': 3, 'dev-jwt': 1 } });
  render(<UsagePanel />);
  expect(screen.getByText(/4 actions completed/i)).toBeInTheDocument();
  expect(screen.getByText('Merge PDF')).toBeInTheDocument();
  expect(screen.getByText('JWT Decoder')).toBeInTheDocument();
});

test('drops a count for a tool id that no longer exists, without crashing', () => {
  usePrefs.setState({ telemetry: true });
  useUsage.setState({ counts: { 'pdf-merge': 1, 'not-a-real-tool': 5 } });
  render(<UsagePanel />);
  expect(screen.getByText(/1 action completed/i)).toBeInTheDocument();
  expect(screen.getByText('Merge PDF')).toBeInTheDocument();
});

test('Clear usage data empties the list', async () => {
  usePrefs.setState({ telemetry: true });
  useUsage.setState({ counts: { 'pdf-merge': 3 } });
  render(<UsagePanel />);
  await userEvent.click(screen.getByRole('button', { name: /clear usage data/i }));
  expect(screen.getByText(/no actions completed yet/i)).toBeInTheDocument();
  expect(useUsage.getState().counts).toEqual({});
});

test('shows a clear button in the off state when stored data exists', () => {
  useUsage.setState({ counts: { 'pdf-merge': 3 } });
  render(<UsagePanel />);
  expect(screen.getByRole('button', { name: /clear stored usage data/i })).toBeInTheDocument();
});

test('does not show a clear button in the off state when there is nothing to clear', () => {
  render(<UsagePanel />);
  expect(screen.queryByRole('button', { name: /clear/i })).toBeNull();
});
