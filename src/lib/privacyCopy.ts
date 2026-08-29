export type ProcessingMode = 'local' | 'local-partial' | 'server';

export const PRIVACY_COPY: Record<ProcessingMode, { short: string; long: string }> = {
  local: {
    short: 'Processed on your device',
    long: 'This operation runs entirely on your device. No file upload, no cloud storage, no account.',
  },
  'local-partial': {
    short: 'Preview on your device (demo engine)',
    long: 'The preview runs on your device. The full processing engine is not yet connected, so no real transformation is applied.',
  },
  server: {
    short: 'Runs on a server',
    long: 'This operation runs on a server. Your file leaves your device for processing.',
  },
};
