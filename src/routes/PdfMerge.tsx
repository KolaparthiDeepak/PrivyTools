import { useEffect } from 'react';
import { Combine } from 'lucide-react';
import { getTool } from '../tools/registry';
import { useToolRunner } from '../hooks/useToolRunner';
import { useHandoff } from '../store/handoff.store';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { mergePdf } from '../services/pdf.service';
import { ToolHeader } from '../components/tool/ToolHeader';
import { FileDropzone } from '../components/tool/FileDropzone';
import { MergeList } from '../components/tool/MergeList';
import { ProcessingState } from '../components/tool/ProcessingState';
import { ResultCard } from '../components/tool/ResultCard';
import { ErrorState } from '../components/tool/ErrorState';
import { StepFlow } from '../components/tool/StepFlow';
import StackAnim from '../components/tool/anims/StackAnim';
import { Button } from '../components/ui';

const tool = getTool('pdf-merge')!;

export default function PdfMerge() {
  const runner = useToolRunner<Record<string, never>>(mergePdf, {}, tool.id);
  const consume = useHandoff((s) => s.consume);
  const reduced = useReducedMotion();

  useEffect(() => {
    const f = consume();
    if (f) runner.selectFile([f]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main role="main" className="mx-auto flex max-w-3xl flex-col gap-8 p-6 sm:p-10">
      <ToolHeader tool={tool} title="Bring documents together." subtitle="Combine PDFs into one, in any order." />
      <StepFlow
        step={runner.step}
        views={{
          select: (
            <FileDropzone
              accept={tool.accept}
              multiple
              mode={tool.processing}
              onFile={runner.selectFile}
              headline="Drop your PDFs here"
              hint="Add two or more PDF files to merge."
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
                itemLabel="PDF"
                countLabel="documents"
              />
              <Button
                variant="primary"
                className="self-start"
                disabled={runner.files.length < 2}
                onClick={runner.run}
              >
                <Combine className="size-4" /> Merge PDFs
              </Button>
            </div>
          ),
          process: (
            <ProcessingState
              phase={runner.progress?.phase ?? 'Merging'}
              ratio={runner.progress?.ratio}
              onCancel={runner.cancel}
            >
              <StackAnim count={runner.files.length} reduced={reduced} />
            </ProcessingState>
          ),
          result: runner.result ? (
            <ResultCard result={runner.result} successVerb="PDFs merged" onReset={runner.reset} />
          ) : null,
          error: <ErrorState message={runner.error ?? ''} onRetry={runner.run} />,
        }}
      />
    </main>
  );
}
