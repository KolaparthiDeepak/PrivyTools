import { renderHook, act } from '@testing-library/react';
import { useDevTransform } from './useDevTransform';

const up = (s: string) => {
  if (s === 'boom') throw new Error('bad input');
  return s.toUpperCase();
};

vi.useFakeTimers();

test('transforms after debounce', () => {
  const { result, rerender } = renderHook(({ i }) => useDevTransform(up, i, { debounceMs: 100 }), {
    initialProps: { i: 'ab' },
  });
  expect(result.current.output).toBeNull();
  act(() => vi.advanceTimersByTime(100));
  expect(result.current.output).toBe('AB');
  expect(result.current.error).toBeNull();
  rerender({ i: 'cd' });
  act(() => vi.advanceTimersByTime(100));
  expect(result.current.output).toBe('CD');
});

test('error keeps last good output', () => {
  const { result, rerender } = renderHook(({ i }) => useDevTransform(up, i, { debounceMs: 0 }), {
    initialProps: { i: 'ok' },
  });
  act(() => vi.advanceTimersByTime(0));
  expect(result.current.output).toBe('OK');
  rerender({ i: 'boom' });
  act(() => vi.advanceTimersByTime(0));
  expect(result.current.error).toBe('bad input');
  expect(result.current.output).toBe('OK');
});

test('empty input is inert', () => {
  const spy = vi.fn(up);
  const { result } = renderHook(() => useDevTransform(spy, '   ', { debounceMs: 0 }));
  act(() => vi.advanceTimersByTime(0));
  expect(spy).not.toHaveBeenCalled();
  expect(result.current).toEqual({ output: null, error: null, pending: false });
});
