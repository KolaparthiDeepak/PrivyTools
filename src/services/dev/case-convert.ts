function tokens(input: string): string[] {
  return input
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((t) => t.toLowerCase());
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function convertCases(input: string) {
  const t = tokens(input);
  return {
    camel: t.map((w, i) => (i ? cap(w) : w)).join(''),
    pascal: t.map(cap).join(''),
    snake: t.join('_'),
    kebab: t.join('-'),
    constant: t.join('_').toUpperCase(),
    title: t.map(cap).join(' '),
    sentence: t.length ? cap(t.join(' ')) : '',
  };
}
