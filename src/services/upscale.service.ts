import type { FileResult, ToolService } from './types';
import { ToolError } from './types';

const PHASES = ['Analyzing image', 'Detecting details', 'Enhancing resolution', 'Reconstructing pixels'];

export const upscaleImage: ToolService<
  { scale: 2 | 4; sharpness: number; noise: number; face: number },
  FileResult
> = {
  async process(input, config, onProgress, signal) {
    const file = Array.isArray(input) ? input[0] : input;
    const bitmap = await createImageBitmap(file).catch(() => {
      throw new ToolError('This image could not be processed.');
    });
    for (let i = 0; i < PHASES.length; i++) {
      if (signal.aborted) throw new ToolError('Cancelled.');
      onProgress({ phase: PHASES[i], ratio: (i + 1) / PHASES.length });
      await new Promise((r) => setTimeout(r, 700));
    }
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width * config.scale;
    canvas.height = bitmap.height * config.scale;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const from = `${bitmap.width}\u00d7${bitmap.height}`;
    const to = `${canvas.width}\u00d7${canvas.height}`;
    bitmap.close();
    const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), 'image/png'));
    const stem = file.name.replace(/\.[^.]+$/, '');
    return {
      blob,
      filename: `${stem}@${config.scale}x.png`,
      originalBytes: file.size,
      outputBytes: blob.size,
      demo: true,
      meta: { from, to, note: 'Preview upscale (bicubic). AI enhancement engine not yet connected.' },
    };
  },
};
