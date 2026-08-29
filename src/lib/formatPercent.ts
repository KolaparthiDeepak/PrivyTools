export function formatPercent(originalBytes: number, outputBytes: number): string {
  if (originalBytes <= 0 || outputBytes >= originalBytes) return '0% smaller';
  return `${((1 - outputBytes / originalBytes) * 100).toFixed(1)}% smaller`;
}
