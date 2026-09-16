export interface LineOptions {
  sort: 'none' | 'asc' | 'desc';
  unique: boolean;
  trim: boolean;
  caseInsensitive: boolean;
  removeBlank: boolean;
  reverse: boolean;
}

export function processLines(input: string, opts: LineOptions): string {
  let lines = input.split('\n');
  if (opts.trim) lines = lines.map((l) => l.trim());
  if (opts.removeBlank) lines = lines.filter((l) => l !== '');

  if (opts.unique) {
    const seen = new Set<string>();
    lines = lines.filter((l) => {
      const key = opts.caseInsensitive ? l.toLowerCase() : l;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  if (opts.sort !== 'none') {
    const cmp = (a: string, b: string) => {
      const x = opts.caseInsensitive ? a.toLowerCase() : a;
      const y = opts.caseInsensitive ? b.toLowerCase() : b;
      return x < y ? -1 : x > y ? 1 : 0;
    };
    lines.sort(opts.sort === 'asc' ? cmp : (a, b) => cmp(b, a));
  }

  if (opts.reverse) lines.reverse();
  return lines.join('\n');
}
