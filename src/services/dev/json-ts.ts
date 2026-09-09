// ponytail: single-sample inference — primitive unions collapsed, array element
// type from the first element only, nested objects emitted as named interfaces,
// no optional-key detection. Swap for quicktype-core if richer output is needed.

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

const pascal = (s: string) => s.replace(/(^\w|[-_ ]\w)/g, (m) => m.replace(/[-_ ]/, '').toUpperCase());

export function jsonToTs(input: string, rootName = 'Root'): string {
  let value: Json;
  try {
    value = JSON.parse(input) as Json;
  } catch (e) {
    throw new Error(`Invalid JSON: ${e instanceof Error ? e.message : String(e)}`);
  }

  const interfaces: string[] = [];

  const typeOf = (v: Json, name: string): string => {
    if (v === null) return 'null';
    if (Array.isArray(v)) return v.length ? `${typeOf(v[0], name)}[]` : 'unknown[]';
    switch (typeof v) {
      case 'string': return 'string';
      case 'number': return 'number';
      case 'boolean': return 'boolean';
      case 'object': {
        const lines = Object.entries(v).map(
          ([k, val]) => `  ${/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)}: ${typeOf(val, name + pascal(k))};`,
        );
        interfaces.push(`interface ${name} {\n${lines.join('\n')}\n}`);
        return name;
      }
      default: return 'unknown';
    }
  };

  const rootType = typeOf(value, pascal(rootName));
  if (!interfaces.length) return `type ${pascal(rootName)} = ${rootType};`;
  return interfaces.reverse().join('\n\n');
}
