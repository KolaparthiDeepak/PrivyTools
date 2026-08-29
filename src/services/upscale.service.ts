import type { FileResult, ToolService } from './types';
import { ToolError } from './types';

export interface ResizeConfig {
  scale: 2 | 4;
  sharpen: number; // 0..1 unsharp-mask amount
  smoothing: boolean;
}

const PHASES = ['Decoding image', 'Resampling', 'Sharpening', 'Encoding'];

/** Real, non-AI: stepped high-quality canvas resample + optional unsharp-mask sharpening. */
export const upscaleImage: ToolService<ResizeConfig, FileResult> = {
  async process(input, config, onProgress, signal) {
    const file = Array.isArray(input) ? input[0] : input;
    onProgress({ phase: PHASES[0], ratio: 0.15 });
    const bitmap = await createImageBitmap(file).catch(() => {
      throw new ToolError('This image could not be processed.');
    });
    if (signal.aborted) throw new ToolError('Cancelled.');

    const fromW = bitmap.width;
    const fromH = bitmap.height;
    const toW = fromW * config.scale;
    const toH = fromH * config.scale;

    onProgress({ phase: PHASES[1], ratio: 0.45 });
    // Step up in 2x hops for cleaner edges than one big jump.
    let cur = document.createElement('canvas');
    cur.width = fromW;
    cur.height = fromH;
    draw(cur, bitmap, fromW, fromH, config.smoothing);
    bitmap.close();
    while (cur.width * 2 <= toW) {
      const next = document.createElement('canvas');
      next.width = cur.width * 2;
      next.height = cur.height * 2;
      draw(next, cur, next.width, next.height, config.smoothing);
      cur = next;
    }
    const canvas = document.createElement('canvas');
    canvas.width = toW;
    canvas.height = toH;
    draw(canvas, cur, toW, toH, config.smoothing);
    const ctx = canvas.getContext('2d')!;

    if (config.sharpen > 0) {
      onProgress({ phase: PHASES[2], ratio: 0.75 });
      unsharpMask(ctx, toW, toH, config.sharpen);
    }

    onProgress({ phase: PHASES[3], ratio: 0.95 });
    const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), type, 0.92));
    const stem = file.name.replace(/\.[^.]+$/, '');
    const ext = type === 'image/png' ? 'png' : 'jpg';
    return {
      blob,
      filename: stem + '@' + config.scale + 'x.' + ext,
      originalBytes: file.size,
      outputBytes: blob.size,
      meta: { from: fromW + '×' + fromH, to: toW + '×' + toH },
    };
  },
};

function draw(
  canvas: HTMLCanvasElement,
  src: CanvasImageSource,
  w: number,
  h: number,
  smoothing: boolean,
) {
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = smoothing;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, 0, 0, w, h);
}

/** 3x3 unsharp mask, amount 0..1. */
function unsharpMask(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number) {
  const src = ctx.getImageData(0, 0, w, h);
  const out = ctx.createImageData(w, h);
  const a = src.data;
  const o = out.data;
  const k = amount * 0.9;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) {
        o[i] = a[i];
        o[i + 1] = a[i + 1];
        o[i + 2] = a[i + 2];
        o[i + 3] = a[i + 3];
        continue;
      }
      for (let c = 0; c < 3; c++) {
        const center = a[i + c];
        const lap =
          a[i - 4 + c] + a[i + 4 + c] + a[i - w * 4 + c] + a[i + w * 4 + c] - 4 * center;
        const v = center - k * lap;
        o[i + c] = v < 0 ? 0 : v > 255 ? 255 : v;
      }
      o[i + 3] = a[i + 3];
    }
  }
  ctx.putImageData(out, 0, 0);
}
