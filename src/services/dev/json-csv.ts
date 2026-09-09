import Papa from 'papaparse';

export function jsonToCsv(input: string): string {
  let value: unknown;
  try {
    value = JSON.parse(input);
  } catch (e) {
    throw new Error(`Invalid JSON: ${e instanceof Error ? e.message : String(e)}`, { cause: e });
  }
  if (!Array.isArray(value) || value.some((r) => typeof r !== 'object' || r === null)) {
    throw new Error('Expected a JSON array of objects');
  }
  const rows = (value as Record<string, unknown>[]).map((r) => {
    const flat: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(r)) {
      flat[k] = typeof v === 'object' && v !== null ? JSON.stringify(v) : v;
    }
    return flat;
  });
  return Papa.unparse(rows);
}

export function csvToJson(input: string): string {
  const parsed = Papa.parse<Record<string, string>>(input.trim(), { header: true, skipEmptyLines: true });
  if (parsed.errors.length) {
    throw new Error(`Could not parse CSV: ${parsed.errors[0].message}`);
  }
  return JSON.stringify(parsed.data, null, 2);
}
