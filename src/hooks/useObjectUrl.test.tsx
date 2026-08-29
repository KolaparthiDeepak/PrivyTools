import { renderHook } from '@testing-library/react';
import { useObjectUrl } from './useObjectUrl';

test('creates and revokes on change', () => {
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:x');
  const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  const { result, rerender } = renderHook(({ b }) => useObjectUrl(b), {
    initialProps: { b: new Blob(['a']) as Blob | null },
  });
  expect(result.current).toBe('blob:x');
  rerender({ b: null });
  expect(revoke).toHaveBeenCalledWith('blob:x');
});
