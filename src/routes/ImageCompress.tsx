import { useEffect } from 'react';
import { getTool } from '../tools/registry';
import { useToolRunner } from '../hooks/useToolRunner';
import { useHandoff } from '../store/handoff.store';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useObjectUrl } from '../hooks/useObjectUrl';
import { compressImage, estimateCompressedImage } from '../services/image.service';
import { formatBytes } from '../lib/formatBytes';
import { ToolHeader } from '../components/tool/ToolHeader';
import { FileDropzone } from '../components/tool/FileDropzone';
import { FilePreview } from '../components/tool/FilePreview';
import { ProcessingState } from '../components/tool/ProcessingState';
import { ResultCard } from '../components/tool/ResultCard';
import { ErrorState } from '../components/tool/ErrorState';
import { StepFlow } from '../components/tool/StepFlow';
import { BeforeAfterComparison } from '../components/tool/BeforeAfterComparison';
import PixelGridAnim from '../components/tool/anims/PixelGridAnim';
import { Button, Segmented, Slider } from '../components/ui';

const tool = getTool('image-compress')!;
type Fmt = 'image/jpeg' | 'image/png' | 'image/webp';
interface Config {
  quality: number;
  format: Fmt;
}

export default function ImageCompress() {
  const runner = useToolRunner<Config>(compressImage, { quality: 0.7, format: 'image/jpeg' }, tool.id);
  const consume = useHandoff((s) => s.consume);
  const reduced = useReducedMotion();
  const originalUrl = useObjectUrl(runner.file);
  const resultUrl = useObjectUrl(runner.result?.blob ?? null);

  useEffect(() => {
    const f = consume();
    if (f) runner.selectFile(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const est = runner.file
    ? estimateCompressedImage(runner.file.size, runner.config.quality, runner.config.format)
    : 0;

  return (
    <main role="main" className="mx-auto flex max-w-3xl flex-col gap-8 p-6 sm:p-10">
      <ToolHeader
        tool={tool}
        title="Smaller images. Same feeling."
        subtitle="Reduce image weight while keeping it looking right."
      />
      <StepFlow
        step={runner.step}
        views={{
          select: (
            <FileDropzone
              accept={tool.accept}
              mode={tool.processing}
              onFile={runner.selectFile}
              headline="Drop an image here"
              hint="JPG, PNG or WebP."
            />
          ),
          configure: runner.file ? (
            <div className="flex flex-col gap-5">
              <FilePreview file={runner.file} />
              <div className="flex flex-col gap-2">
                <label className="font-mono text-[10.5px] uppercase tracking-widest text-dim">Quality</label>
                <Slider
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={runner.config.quality}
                  onChange={(q) => runner.setConfig({ quality: q })}
                  leftLabel="Smaller"
                  rightLabel="Better quality"
                  aria-label="Quality"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-mono text-[10.5px] uppercase tracking-widest text-dim">Output format</label>
                <Segmented
                  aria-label="Output format"
                  value={runner.config.format}
                  onChange={(f) => runner.setConfig({ format: f })}
                  options={[
                    { value: 'image/jpeg', label: 'JPG' },
                    { value: 'image/png', label: 'PNG' },
                    { value: 'image/webp', label: 'WEBP' },
                  ]}
                />
              </div>
              <p className="font-mono text-xs text-dim">
                {formatBytes(runner.file.size)} \u2192 estimated {formatBytes(est)}
              </p>
              <Button variant="primary" className="self-start" onClick={runner.run}>
                Compress image
              </Button>
            </div>
          ) : null,
          process: (
            <ProcessingState
              phase={runner.progress?.phase ?? 'Compressing'}
              ratio={runner.progress?.ratio}
              onCancel={runner.cancel}
            >
              <PixelGridAnim reduced={reduced} />
            </ProcessingState>
          ),
          result:
            runner.result && runner.file ? (
              <div className="flex flex-col gap-5">
                {originalUrl && resultUrl && (
                  <BeforeAfterComparison
                    before={<img src={originalUrl} alt="Original" className="size-full object-cover" />}
                    after={<img src={resultUrl} alt="Compressed" className="size-full object-cover" />}
                    beforeLabel={`ORIGINAL \u00b7 ${formatBytes(runner.result.originalBytes)}`}
                    afterLabel={`COMPRESSED \u00b7 ${formatBytes(runner.result.outputBytes ?? 0)}`}
                  />
                )}
                <ResultCard result={runner.result} successVerb="Image compressed" onReset={runner.reset} />
              </div>
            ) : null,
          error: <ErrorState message={runner.error ?? ''} onRetry={runner.run} />,
        }}
      />
    </main>
  );
}
