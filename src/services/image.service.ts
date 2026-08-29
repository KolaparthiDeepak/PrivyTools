import type { FileResult, Progress, ToolService } from './types';
import { ToolError } from './types';
import { encode } from './image.encode';

const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export function estimateCompressedImage(originalBytes: number, quality: number, format: string): number {
  const base = format === 'image/png' ? 0.85 : 0.1 + 0.8 * quality ** 1.4;
  return Math.round(originalBytes * base);
}

export const compressImage: ToolService<
  { quality: number; format: 'image/jpeg' | 'image/png' | 'image/webp'; maxBytes?: number },
  FileResult
> = {
  async process(input, config, onProgress: (p: Progress) => void, signal) {
    const file = Array.isArray(input) ? input[0] : input;
    if (signal.aborted) throw new ToolError('Cancelled.');
    onProgress({ phase: 'Decoding image', ratio: 0.2 });
    let blob = await encode(file, config.format, config.quality).catch(() => {
      throw new ToolError('This image could not be processed.');
    });
    onProgress({ phase: 'Re-encoding', ratio: 0.7 });
    if (config.maxBytes) {
      for (let q = config.quality; q > 0.3 && blob.size > config.maxBytes; q -= 0.15) {
        blob = await encode(file, config.format, q);
      }
    }
    onProgress({ phase: 'Done', ratio: 1 });
    const stem = file.name.replace(/\.[^.]+$/, '');
    return {
      blob,
      filename: `${stem}.${EXT[config.format]}`,
      originalBytes: file.size,
      outputBytes: blob.size,
      meta: { format: EXT[config.format] },
    };
  },
};
