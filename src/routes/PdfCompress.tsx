import { useEffect } from 'react';
import { Minimize2 } from 'lucide-react';
import { getTool } from '../tools/registry';
import { useToolRunner } from '../hooks/useToolRunner';
import { useHandoff } from '../store/handoff.store';
import { useRecent } from '../hooks/useRecent';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { compressPdf, estimateCompressedPdf } from '../services/pdf.service';
import { formatBytes } from '../lib/formatBytes';
import { formatPercent } from '../lib/formatPercent';
import { ToolHeader } from '../components/tool/ToolHeader';
import { FileDropzone } from '../components/tool/FileDropzone';
import { ProcessingState } from '../components/tool/ProcessingState';
import { ResultCard } from '../components/tool/ResultCard';
import { ErrorState } from '../components/tool/ErrorState';
import { StepFlow } from '../components/tool/StepFlow';
import ShrinkBarsAnim from '../components/tool/anims/ShrinkBarsAnim';
import { Button, Segmented, Slider } from '../components/ui';

const tool = getTool('pdf-compress')!;
type Preset = 'max' | 'balanced' | 'high';
const PRESET_Q: Record<Preset, number> = { max: 0.25, balanced: 0.6, high: 0.85 };
interface Config {
  preset: Preset;
  quality: number;
}

export default function PdfCompress() {
  const runner = useToolRunner<Config>(compressPdf, { preset: 'balanced', quality: 0.6 });
  const consume = useHandoff((s) => s.consume);
  const { push } = useRecent();
  const reduced = useReducedMotion();

  useEffect(() => {
    const f = consume();
    if (f) runner.selectFile(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (runner.step === 'result') push('pdf-compress');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runner.step]);

  const est = runner.file ? estimateCompressedPdf(runner.file.size, runner.config.quality) : 0;

  return (
    <main role="main" className="mx-auto flex max-w-3xl flex-col gap-8 p-6 sm:p-10">
      <ToolHeader
        tool={tool}
        title="Make PDFs lighter."
        subtitle="Reduce file size while keeping documents readable."
      />
      <StepFlow
        step={runner.step}
        views={{
          select: (
            <FileDropzone
              accept={tool.accept}
              mode={tool.processing}
              onFile={runner.selectFile}
              headline="Drop a PDF here"
              hint="We'll estimate how much lighter it can get."
            />
          ),
          configure: runner.file ? (
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center gap-4 font-mono text-sm">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest text-dim/70">Original</span>
                  <span className="text-lg text-text">{formatBytes(runner.file.size)}</span>
                </div>
                <span className="text-dim/60">\u2192</span>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest text-dim/70">Projected</span>
                  <span className="text-lg text-text">\u2248 {formatBytes(est)}</span>
                  <span className="text-xs text-accent">{formatPercent(runner.file.size, est)}</span>
                </div>
              </div>
              <Segmented
                aria-label="Preset"
                value={runner.config.preset}
                onChange={(p) => runner.setConfig({ preset: p, quality: PRESET_Q[p] })}
                options={[
                  { value: 'max', label: 'Maximum compression' },
                  { value: 'balanced', label: 'Balanced' },
                  { value: 'high', label: 'High quality' },
                ]}
              />
              <Slider
                min={0.1}
                max={1}
                step={0.05}
                value={runner.config.quality}
                onChange={(q) => runner.setConfig({ quality: q })}
                leftLabel="Smaller"
                rightLabel="Better quality"
                aria-label="Compression"
              />
              <Button variant="primary" className="self-start" onClick={runner.run}>
                <Minimize2 className="size-4" /> Compress PDF
              </Button>
            </div>
          ) : null,
          process: (
            <ProcessingState
              phase={runner.progress?.phase ?? 'Compressing'}
              ratio={runner.progress?.ratio}
              onCancel={runner.cancel}
            >
              <ShrinkBarsAnim reduced={reduced} />
            </ProcessingState>
          ),
          result: runner.result ? (
            <ResultCard result={runner.result} successVerb="PDF optimized" onReset={runner.reset} />
          ) : null,
          error: <ErrorState message={runner.error ?? ''} onRetry={runner.run} />,
        }}
      />
    </main>
  );
}
