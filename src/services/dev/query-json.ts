export function queryToJson(input: string): string {
  const params = new URLSearchParams(input.replace(/^\?/, ''));
  const out: Record<string, string | string[]> = {};
  for (const key of new Set(params.keys())) {
    const all = params.getAll(key);
    out[key] = all.length > 1 ? all : all[0];
  }
  return JSON.stringify(out, null, 2);
}

export function jsonToQuery(input: string): string {
  let value: unknown;
  try {
    value = JSON.parse(input);
  } catch (e) {
    throw new Error(`Invalid JSON: ${e instanceof Error ? e.message : String(e)}`, { cause: e });
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Query values must be strings, numbers, or arrays of them');
  }
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    const items = Array.isArray(v) ? v : [v];
    for (const item of items) {
      if (typeof item === 'object' && item !== null) {
        throw new Error('Query values must be strings, numbers, or arrays of them');
      }
      params.append(k, String(item));
    }
  }
  return params.toString();
}
