import { useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { useDropzone } from '../../hooks/useDropzone';
import { PrivacyIndicator } from './PrivacyIndicator';
import { Button } from '../ui';
import type { ProcessingMode } from '../../lib/privacyCopy';
import { cn } from '../../lib/cn';

interface Props {
  accept: string[];
  multiple?: boolean;
  onFile: (f: File | File[]) => void;
  mode: ProcessingMode;
  glyph?: React.ReactNode;
  headline?: string;
  hint?: string;
  className?: string;
}

export function FileDropzone({
  accept,
  multiple,
  onFile,
  mode,
  glyph,
  headline = 'Ready when you are.',
  hint = 'Drop a file here to start working.',
  className,
}: Props) {
  const [reason, setReason] = useState<string | null>(null);
  const dz = useDropzone({
    accept,
    multiple,
    onFile: (f) => {
      setReason(null);
      onFile(f);
    },
    onReject: setReason,
  });
  return (
    <div
      {...dz.rootProps}
      role="button"
      tabIndex={0}
      onClick={dz.open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          dz.open();
        }
      }}
      aria-label={hint}
      className={cn(
        'flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-dashed border-border-hi',
        'bg-surface-hi/40 px-6 py-14 text-center transition-colors',
        dz.isDragging && 'border-accent bg-accent/5',
        className,
      )}
    >
      <input {...dz.inputProps} />
      <span className="text-dim">{glyph ?? <UploadCloud className="size-8" />}</span>
      <div className="flex flex-col gap-1">
        <p className="font-semibold text-text">{headline}</p>
        <p className="text-sm text-dim">{hint}</p>
      </div>
      <Button type="button" onClick={(e) => { e.stopPropagation(); dz.open(); }}>
        Browse files
      </Button>
      {reason && (
        <p role="alert" aria-live="polite" className="text-sm text-amber-500">
          {reason}
        </p>
      )}
      <PrivacyIndicator mode={mode} compact />
    </div>
  );
}
