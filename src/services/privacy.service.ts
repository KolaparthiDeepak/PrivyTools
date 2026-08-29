import { TOOLS } from '../tools/registry';
import { PRIVACY_COPY, type ProcessingMode } from '../lib/privacyCopy';

export interface PrivacyRow {
  toolId: string;
  name: string;
  mode: ProcessingMode;
  note: string;
}

export function privacyStatus(): PrivacyRow[] {
  return TOOLS.filter((t) => t.id !== 'privacy-center').map((t) => ({
    toolId: t.id,
    name: t.name,
    mode: t.processing,
    note:
      t.status === 'demo' && t.processing !== 'server'
        ? PRIVACY_COPY['local-partial'].long
        : PRIVACY_COPY[t.processing].long,
  }));
}
