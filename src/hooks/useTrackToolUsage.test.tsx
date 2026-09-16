import { renderHook } from '@testing-library/react';
import { useTrackToolUsage } from './useTrackToolUsage';
import { usePrefs } from '../store/prefs.store';
import { useUsage } from '../store/usage.store';

beforeEach(() => {
  usePrefs.setState({ telemetry: false });
  useUsage.setState({ counts: {} });
});

test('does nothing when telemetry is off', () => {
  renderHook(() => useTrackToolUsage('pdf-merge', true));
  expect(useUsage.getState().counts).toEqual({});
});

test('increments once when telemetry is on and succeeded is true', () => {
  usePrefs.setState({ telemetry: true });
  renderHook(() => useTrackToolUsage('pdf-merge', true));
  expect(useUsage.getState().counts).toEqual({ 'pdf-merge': 1 });
});

test('does not increment a second time on a second true render within the same mount', () => {
  usePrefs.setState({ telemetry: true });
  const { rerender } = renderHook(({ succeeded }) => useTrackToolUsage('pdf-merge', succeeded), {
    initialProps: { succeeded: true },
  });
  rerender({ succeeded: false });
  rerender({ succeeded: true });
  expect(useUsage.getState().counts).toEqual({ 'pdf-merge': 1 });
});

test('does nothing when toolId is undefined', () => {
  usePrefs.setState({ telemetry: true });
  renderHook(() => useTrackToolUsage(undefined, true));
  expect(useUsage.getState().counts).toEqual({});
});
