import { useEffect } from 'react';
import { getTool } from '../tools/registry';
import { useToolRunner } from '../hooks/useToolRunner';
import { useHandoff } from '../store/handoff.store';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { imagesToPdf } from '../services/pdf.service';
import { ToolHeader } from '../components/tool/ToolHeader';
import { FileDropzone } from '../components/tool/FileDropzone';
import { MergeList } from '../components/tool/MergeList';
import { ProcessingState } from '../components/tool/ProcessingState';
import { ResultCard } from '../components/tool/ResultCard';
import { ErrorState } from '../components/tool/ErrorState';
import { StepFlow } from '../components/tool/StepFlow';
import StackAnim from '../components/tool/anims/StackAnim';
import { Button } from '../components/ui';

const tool = getTool('image-to-pdf')!;

export default function ImageToPdf() {
  const runner = useToolRunner<Record<string, never>>(imagesToPdf, {});
  const consume = useHandoff((s) => s.consume);
  const reduced = useReducedMotion();

  useEffect(() => {
    const f = consume();
    if (f) runner.selectFile([f]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main role="main" className="mx-auto flex max-w-3xl flex-col gap-8 p-6 sm:p-10">
      <ToolHeader
        tool={tool}
        title="Turn images into a PDF."
        subtitle="Combine JPGs and PNGs into one document, in any order."
      />
      <StepFlow
        step={runner.step}
        views={{
          select: (
            <FileDropzone
              accept={tool.accept}
              multiple
              mode={tool.processing}
              onFile={runner.selectFile}
              headline="Drop your images here"
              hint="JPG or PNG. Add as many as you like."
            />
          ),
          configure: (
            <div className="flex flex-col gap-5">
              <MergeList
                files={runner.files}
                onReorder={(next) => runner.selectFile(next)}
                onRemove={(i) => runner.selectFile(runner.files.filter((_, x) => x !== i))}
                onAdd={(f) => runner.selectFile([...runner.files, ...f])}
                accept={tool.accept}
                itemLabel="IMG"
                countLabel="images"
              />
              <Button variant="primary" className="self-start" onClick={runner.run}>
                Create PDF
              </Button>
            </div>
          ),
          process: (
            <ProcessingState
              phase={runner.progress?.phase ?? 'Building PDF'}
              ratio={runner.progress?.ratio}
              onCancel={runner.cancel}
            >
              <StackAnim count={runner.files.length} reduced={reduced} />
            </ProcessingState>
          ),
          result: runner.result ? (
            <ResultCard result={runner.result} successVerb="PDF created" onReset={runner.reset} />
          ) : null,
          error: <ErrorState message={runner.error ?? ''} onRetry={runner.run} />,
        }}
      />
    </main>
  );
}
