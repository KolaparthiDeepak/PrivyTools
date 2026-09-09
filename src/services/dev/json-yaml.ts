import yaml from 'js-yaml';

export function jsonToYaml(input: string): string {
  let value: unknown;
  try {
    value = JSON.parse(input);
  } catch (e) {
    throw new Error(`Invalid JSON: ${e instanceof Error ? e.message : String(e)}`, { cause: e });
  }
  return yaml.dump(value, { indent: 2, lineWidth: -1 });
}

export function yamlToJson(input: string): string {
  let value: unknown;
  try {
    value = yaml.load(input);
  } catch (e) {
    throw new Error(`Invalid YAML: ${e instanceof Error ? e.message : String(e)}`, { cause: e });
  }
  return JSON.stringify(value, null, 2);
}
