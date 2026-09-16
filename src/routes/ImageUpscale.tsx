import { useEffect } from 'react';
import { Maximize2 } from 'lucide-react';
import { getTool } from '../tools/registry';
import { useToolRunner } from '../hooks/useToolRunner';
import { useHandoff } from '../store/handoff.store';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useObjectUrl } from '../hooks/useObjectUrl';
import { upscaleImage, type ResizeConfig } from '../services/upscale.service';
import { ToolHeader } from '../components/tool/ToolHeader';
import { FileDropzone } from '../components/tool/FileDropzone';
import { FilePreview } from '../components/tool/FilePreview';
import { ProcessingState } from '../components/tool/ProcessingState';
import { ResultCard } from '../components/tool/ResultCard';
import { ErrorState } from '../components/tool/ErrorState';
import { StepFlow } from '../components/tool/StepFlow';
import { BeforeAfterComparison } from '../components/tool/BeforeAfterComparison';
import ScanBeamAnim from '../components/tool/anims/ScanBeamAnim';
import { Button, Segmented, Slider } from '../components/ui';

const tool = getTool('image-upscale')!;

export default function ImageUpscale() {
  const runner = useToolRunner<ResizeConfig>(upscaleImage, { scale: 2, sharpen: 0.4, smoothing: true }, tool.id);
  const consume = useHandoff((s) => s.consume);
  const reduced = useReducedMotion();
  const originalUrl = useObjectUrl(runner.file);
  const resultUrl = useObjectUrl(runner.result?.blob ?? null);

  useEffect(() => {
    const f = consume();
    if (f) runner.selectFile(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <main role="main" className="mx-auto flex max-w-3xl flex-col gap-8 p-6 sm:p-10">
      <ToolHeader
        tool={tool}
        title="Bigger, sharper images."
        subtitle="Enlarge with stepped high-quality resampling and an unsharp mask. No AI, runs on your device."
      />
      <StepFlow
        step={runner.step}
        views={{
          select: (
            <FileDropzone
              accept={tool.accept}
              mode={tool.processing}
              onFile={runner.selectFile}
              glyph={<Maximize2 className="size-8" />}
              headline="Drop an image to enlarge"
              hint="JPG, PNG or WebP."
            />
          ),
          configure: runner.file ? (
            <div className="flex flex-col gap-5">
              <FilePreview file={runner.file} />
              <div className="flex flex-col gap-2">
                <label className="font-mono text-[10.5px] uppercase tracking-widest text-dim">Scale</label>
                <Segmented
                  aria-label="Scale"
                  value={String(runner.config.scale)}
                  onChange={(v) => runner.setConfig({ scale: Number(v) as 2 | 4 })}
                  options={[
                    { value: '2', label: '2x' },
                    { value: '4', label: '4x' },
                  ]}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-mono text-[10.5px] uppercase tracking-widest text-dim">Sharpen</label>
                <Slider
                  min={0}
                  max={1}
                  step={0.1}
                  value={runner.config.sharpen}
                  onChange={(v) => runner.setConfig({ sharpen: v })}
                  leftLabel="Off"
                  rightLabel="Strong"
                  aria-label="Sharpen"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-dim">
                <input
                  type="checkbox"
                  checked={runner.config.smoothing}
                  onChange={(e) => runner.setConfig({ smoothing: e.target.checked })}
                />
                Smooth interpolation (off = nearest-neighbour, keeps hard pixel edges)
              </label>
              <Button variant="primary" className="self-start" onClick={runner.run}>
                Enlarge {runner.config.scale}x
              </Button>
            </div>
          ) : null,
          process: (
            <ProcessingState
              phase={runner.progress?.phase ?? 'Resampling'}
              ratio={runner.progress?.ratio}
              onCancel={runner.cancel}
            >
              {runner.file && (
                <ScanBeamAnim reduced={reduced}>
                  <FilePreview file={runner.file} className="size-full border-0" />
                </ScanBeamAnim>
              )}
            </ProcessingState>
          ),
          result:
            runner.result && runner.file ? (
              <div className="flex flex-col gap-5">
                {originalUrl && resultUrl && (
                  <BeforeAfterComparison
                    before={<img src={originalUrl} alt="Original" className="size-full object-cover" />}
                    after={<img src={resultUrl} alt="Enlarged" className="size-full object-cover" />}
                    beforeLabel={String(runner.result.meta?.from ?? 'Original')}
                    afterLabel={String(runner.result.meta?.to ?? 'Enlarged')}
                  />
                )}
                <ResultCard result={runner.result} successVerb="Image enlarged" onReset={runner.reset} />
              </div>
            ) : null,
          error: <ErrorState message={runner.error ?? ''} onRetry={runner.run} />,
        }}
      />
    </main>
  );
}
