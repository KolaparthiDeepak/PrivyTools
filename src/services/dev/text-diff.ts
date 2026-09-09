import { diffLines } from 'diff';

export interface DiffLine {
  kind: 'add' | 'remove' | 'context';
  text: string;
}

export function diffText(a: string, b: string): DiffLine[] {
  const out: DiffLine[] = [];
  for (const part of diffLines(a, b)) {
    const kind: DiffLine['kind'] = part.added ? 'add' : part.removed ? 'remove' : 'context';
    for (const line of part.value.replace(/\n$/, '').split('\n')) {
      out.push({ kind, text: line });
    }
  }
  return out;
}
