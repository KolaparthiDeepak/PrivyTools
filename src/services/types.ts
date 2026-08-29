export interface Progress {
  phase: string;
  ratio?: number;
}

export interface FileResult {
  blob: Blob;
  filename: string;
  originalBytes: number;
  outputBytes?: number;
  meta?: Record<string, string | number>;
  demo?: boolean;
}

export interface ToolService<C, R = FileResult> {
  process(
    input: File | File[],
    config: C,
    onProgress: (p: Progress) => void,
    signal: AbortSignal,
  ): Promise<R>;
}

export class ToolError extends Error {
  constructor(
    public userMessage: string,
    technical?: string,
  ) {
    super(technical ?? userMessage);
    this.name = 'ToolError';
  }
}
