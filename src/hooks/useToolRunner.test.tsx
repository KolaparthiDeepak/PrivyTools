import { renderHook, act } from '@testing-library/react';
import { useToolRunner } from './useToolRunner';
import type { ToolService } from '../services/types';
import { ToolError } from '../services/types';

const ok: ToolService<{ n: number }> = {
  async process(_i, _c, onProgress) {
    onProgress({ phase: 'working', ratio: 0.5 });
    return { blob: new Blob(['x']), filename: 'o.bin', originalBytes: 1, outputBytes: 1 };
  },
};
const boom: ToolService<{ n: number }> = {
  async process() {
    throw new ToolError('nope');
  },
};

test('happy path', async () => {
  const { result } = renderHook(() => useToolRunner(ok, { n: 1 }));
  expect(result.current.step).toBe('select');
  act(() => result.current.selectFile(new File(['a'], 'a.bin')));
  expect(result.current.step).toBe('configure');
  await act(async () => {
    await result.current.run();
  });
  expect(result.current.step).toBe('result');
  expect(result.current.result?.filename).toBe('o.bin');
});

test('error path', async () => {
  const { result } = renderHook(() => useToolRunner(boom, { n: 1 }));
  act(() => result.current.selectFile(new File(['a'], 'a.bin')));
  await act(async () => {
    await result.current.run();
  });
  expect(result.current.step).toBe('error');
  expect(result.current.error).toBe('nope');
});

test('reset clears', async () => {
  const { result } = renderHook(() => useToolRunner(ok, { n: 1 }));
  act(() => result.current.selectFile(new File(['a'], 'a.bin')));
  await act(async () => {
    await result.current.run();
  });
  act(() => result.current.reset());
  expect(result.current.step).toBe('select');
  expect(result.current.result).toBeNull();
  expect(result.current.file).toBeNull();
});

test('setConfig merges', () => {
  const { result } = renderHook(() => useToolRunner(ok, { n: 1 }));
  act(() => result.current.setConfig({ n: 9 }));
  expect(result.current.config.n).toBe(9);
});
