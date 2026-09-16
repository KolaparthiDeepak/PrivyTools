import { useUsage } from './usage.store';

beforeEach(() => {
  useUsage.setState({ counts: {} });
});

test('increment accumulates per tool id', () => {
  useUsage.getState().increment('pdf-merge');
  useUsage.getState().increment('pdf-merge');
  useUsage.getState().increment('dev-jwt');
  expect(useUsage.getState().counts).toEqual({ 'pdf-merge': 2, 'dev-jwt': 1 });
});

test('clear resets to empty', () => {
  useUsage.getState().increment('pdf-merge');
  useUsage.getState().clear();
  expect(useUsage.getState().counts).toEqual({});
});
