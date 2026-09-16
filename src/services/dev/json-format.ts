function parse(input: string): unknown {
  try {
    return JSON.parse(input);
  } catch (e) {
    throw new Error(`Invalid JSON: ${e instanceof Error ? e.message : String(e)}`, { cause: e });
  }
}

export function prettyJson(input: string): string {
  return JSON.stringify(parse(input), null, 2);
}

export function minifyJson(input: string): string {
  return JSON.stringify(parse(input));
}
