import { useEffect, useState } from 'react';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { getTool } from '../tools/registry';
import { useToolRunner } from '../hooks/useToolRunner';
import { useHandoff } from '../store/handoff.store';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { protectPdf } from '../services/pdf.service';
import { ToolHeader } from '../components/tool/ToolHeader';
import { FileDropzone } from '../components/tool/FileDropzone';
import { FilePreview } from '../components/tool/FilePreview';
import { ProcessingState } from '../components/tool/ProcessingState';
import { ResultCard } from '../components/tool/ResultCard';
import { ErrorState } from '../components/tool/ErrorState';
import { StepFlow } from '../components/tool/StepFlow';
import LockAnim from '../components/tool/anims/LockAnim';
import { Button, Input, Segmented } from '../components/ui';

const tool = getTool('pdf-security')!;
interface Config {
  mode: 'add' | 'remove';
  password: string;
}

export default function PdfSecurity() {
  const runner = useToolRunner<Config>(protectPdf, { mode: 'add', password: '' }, tool.id);
  const consume = useHandoff((s) => s.consume);
  const reduced = useReducedMotion();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const f = consume();
    if (f) runner.selectFile(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <main role="main" className="mx-auto flex max-w-3xl flex-col gap-8 p-6 sm:p-10">
      <ToolHeader
        tool={tool}
        title="Secure your PDF."
        subtitle="Add or remove an AES-256 password. Runs entirely on your device."
      />
      <StepFlow
        step={runner.step}
        views={{
          select: (
            <FileDropzone
              accept={tool.accept}
              mode={tool.processing}
              onFile={runner.selectFile}
              glyph={<ShieldCheck className="size-8" />}
              headline="Secure your PDF"
              hint="Drop a PDF to add or remove a password."
            />
          ),
          configure: runner.file ? (
            <div className="flex flex-col gap-5">
              <FilePreview file={runner.file} />
              <Segmented
                aria-label="Mode"
                value={runner.config.mode}
                onChange={(m) => runner.setConfig({ mode: m })}
                options={[
                  { value: 'add', label: 'Add password' },
                  { value: 'remove', label: 'Remove password' },
                ]}
              />
              <div className="flex flex-col gap-2">
                <label className="font-mono text-[10.5px] uppercase tracking-widest text-dim">Password</label>
                <Input
                  type={show ? 'text' : 'password'}
                  value={runner.config.password}
                  onChange={(e) => runner.setConfig({ password: e.target.value })}
                  aria-label="Password"
                  trailing={
                    <button
                      type="button"
                      aria-label={show ? 'Hide password' : 'Show password'}
                      onClick={() => setShow((s) => !s)}
                      className="text-dim hover:text-text"
                    >
                      {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  }
                />
              </div>
              <p className="font-mono text-xs text-dim">Encryption: AES-256</p>
              <Button variant="primary" className="self-start" onClick={runner.run}>
                {runner.config.mode === 'add' ? 'Protect PDF' : 'Remove password'}
              </Button>
            </div>
          ) : null,
          process: (
            <ProcessingState
              phase={runner.progress?.phase ?? 'Working'}
              ratio={runner.progress?.ratio}
              onCancel={runner.cancel}
            >
              <LockAnim mode={runner.config.mode} reduced={reduced} />
            </ProcessingState>
          ),
          result: runner.result ? (
            <ResultCard result={runner.result} successVerb="Protection updated" onReset={runner.reset} />
          ) : null,
          error: <ErrorState message={runner.error ?? ''} onRetry={runner.run} />,
        }}
      />
    </main>
  );
}
