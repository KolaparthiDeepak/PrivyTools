import { useCallback, useMemo, useState } from 'react';
import { ArrowLeftRight, Copy, Check, Download, Upload } from 'lucide-react';
import { Button, Segmented } from '../ui';
import { CodeEditor } from './CodeEditor';
import { useDevTransform } from '../../hooks/useDevTransform';
import { downloadBlob } from '../../lib/download';
import { cn } from '../../lib/cn';

export interface Direction {
  id: string;
  label: string;
  transform: (input: string) => string;
  inputLanguage: 'json' | 'yaml' | 'text';
  outputLanguage: 'json' | 'yaml' | 'text';
  downloadName: string;
  downloadType: string;
}

interface SplitToolProps {
  toolId: string;
  directions: Direction[];
  inputPlaceholder?: string;
  acceptFile?: boolean;
  fileAsBytes?: boolean;
}

export function SplitTool({
  toolId,
  directions,
  inputPlaceholder,
  acceptFile = true,
  fileAsBytes = false,
}: SplitToolProps) {
  const [dirId, setDirId] = useState(directions[0].id);
  const dir = useMemo(
    () => directions.find((d) => d.id === dirId) ?? directions[0],
    [directions, dirId],
  );
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);

  const { output, error, pending } = useDevTransform(dir.transform, input, { toolId });
  const outStr = output ?? '';

  const swap = useCallback(() => {
    if (directions.length !== 2) return;
    const other = directions.find((d) => d.id !== dirId);
    if (!other) return;
    setInput(outStr);
    setDirId(other.id);
  }, [directions, dirId, outStr]);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(outStr);
    } catch {
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }, [outStr]);

  const download = useCallback(() => {
    downloadBlob(new Blob([outStr], { type: dir.downloadType }), dir.downloadName);
  }, [outStr, dir]);

  const readFile = useCallback(
    async (file: File) => {
      if (fileAsBytes) {
        const buf = new Uint8Array(await file.arrayBuffer());
        let bin = '';
        buf.forEach((b) => {
          bin += String.fromCharCode(b);
        });
        setInput(btoa(bin));
      } else {
        setInput(await file.text());
      }
    },
    [fileAsBytes],
  );

  return (
    <div className="flex flex-col gap-4">
      {directions.length === 2 && (
        <div className="flex items-center gap-2">
          <Segmented
            options={directions.map((d) => ({ value: d.id, label: d.label }))}
            value={dirId}
            onChange={setDirId}
            aria-label="Conversion direction"
          />
          <Button variant="ghost" onClick={swap} aria-label="Swap input and output">
            <ArrowLeftRight className="size-4" />
          </Button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-dim/70">Input</span>
            {acceptFile && (
              <label className="flex cursor-pointer items-center gap-1 text-xs text-dim hover:text-text">
                <Upload className="size-3.5" /> Open file
                <input
                  type="file"
                  className="sr-only"
                  onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0])}
                />
              </label>
            )}
          </div>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) readFile(f);
            }}
          >
            <CodeEditor
              label="Input"
              value={input}
              onChange={setInput}
              language={dir.inputLanguage}
              placeholder={inputPlaceholder}
            />
          </div>
          {error && (
            <p
              role="alert"
              className="rounded-md border border-border bg-sunken px-3 py-2 text-xs text-[hsl(var(--danger))]"
            >
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-dim/70">Output</span>
            <div className="flex gap-1">
              <Button variant="ghost" onClick={copy} aria-label="Copy output">
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              </Button>
              <Button variant="ghost" onClick={download} aria-label="Download output">
                <Download className="size-3.5" />
              </Button>
            </div>
          </div>
          <CodeEditor
            label="Output"
            value={outStr}
            readOnly
            language={dir.outputLanguage}
            placeholder="Output appears here"
            className={cn((pending || error) && 'opacity-50 transition-opacity')}
          />
        </div>
      </div>
    </div>
  );
}
