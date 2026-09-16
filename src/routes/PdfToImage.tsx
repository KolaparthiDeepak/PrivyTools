import { useEffect } from 'react';
import { Images } from 'lucide-react';
import { getTool } from '../tools/registry';
import { useToolRunner } from '../hooks/useToolRunner';
import { useHandoff } from '../store/handoff.store';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { pdfToImages } from '../services/pdf.service';
import { formatBytes } from '../lib/formatBytes';
import { ToolHeader } from '../components/tool/ToolHeader';
import { FileDropzone } from '../components/tool/FileDropzone';
import { ProcessingState } from '../components/tool/ProcessingState';
import { ResultCard } from '../components/tool/ResultCard';
import { ErrorState } from '../components/tool/ErrorState';
import { StepFlow } from '../components/tool/StepFlow';
import PixelGridAnim from '../components/tool/anims/PixelGridAnim';
import { Button } from '../components/ui';

const tool = getTool('pdf-to-image')!;

export default function PdfToImage() {
  const runner = useToolRunner<Record<string, never>>(pdfToImages, {}, tool.id);
  const consume = useHandoff((s) => s.consume);
  const reduced = useReducedMotion();

  useEffect(() => {
    const f = consume();
    if (f) runner.selectFile(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main role="main" className="mx-auto flex max-w-3xl flex-col gap-8 p-6 sm:p-10">
      <ToolHeader
        tool={tool}
        title="Turn PDF pages into images."
        subtitle="Each page becomes a PNG at 150 DPI, bundled into one ZIP."
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
              hint="We'll render every page as a PNG."
            />
          ),
          configure: runner.file ? (
            <div className="flex flex-col gap-5">
              <p className="font-mono text-sm text-dim">
                {runner.file.name} · {formatBytes(runner.file.size)}
              </p>
              <Button variant="primary" className="self-start" onClick={runner.run}>
                <Images className="size-4" /> Convert to images
              </Button>
            </div>
          ) : null,
          process: (
            <ProcessingState
              phase={runner.progress?.phase ?? 'Rendering'}
              ratio={runner.progress?.ratio}
              onCancel={runner.cancel}
            >
              <PixelGridAnim reduced={reduced} />
            </ProcessingState>
          ),
          result: runner.result ? (
            <ResultCard result={runner.result} successVerb="Pages converted" onReset={runner.reset} />
          ) : null,
          error: <ErrorState message={runner.error ?? ''} onRetry={runner.run} />,
        }}
      />
    </main>
  );
}
