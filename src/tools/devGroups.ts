import { getTool, type Tool } from './registry';

export type DevGroup = 'converters' | 'encoders' | 'text' | 'schedule';

export const DEV_GROUP_ORDER: DevGroup[] = ['converters', 'encoders', 'text', 'schedule'];

export const DEV_GROUPS: Record<DevGroup, { label: string; toolIds: string[] }> = {
  converters: {
    label: 'Converters',
    toolIds: ['dev-json-format', 'dev-json-yaml', 'dev-json-csv', 'dev-json-ts', 'dev-query-json'],
  },
  encoders: {
    label: 'Encoders / Decoders',
    toolIds: ['dev-base64', 'dev-url', 'dev-html-entities', 'dev-jwt'],
  },
  text: {
    label: 'Text Utilities',
    toolIds: ['dev-case', 'dev-slug', 'dev-lines', 'dev-diff'],
  },
  schedule: {
    label: 'Date & Schedule',
    toolIds: ['dev-timestamp', 'dev-cron'],
  },
};

export function toolsInDevGroup(g: DevGroup): Tool[] {
  return DEV_GROUPS[g].toolIds.map(getTool).filter((t): t is Tool => t !== undefined);
}
