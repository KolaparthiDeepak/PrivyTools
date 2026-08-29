import { FileText } from 'lucide-react';
import { useObjectUrl } from '../../hooks/useObjectUrl';
import { cn } from '../../lib/cn';

export function FilePreview({ file, className }: { file: File; className?: string }) {
  const isImage = file.type.startsWith('image/');
  const url = useObjectUrl(isImage ? file : null);
  return (
    <div
      className={cn(
        'grid min-h-32 place-items-center overflow-hidden rounded-md border border-border bg-surface-hi',
        className,
      )}
    >
      {isImage && url ? (
        <img src={url} alt={file.name} className="max-h-64 w-full object-contain" />
      ) : (
        <div className="flex flex-col items-center gap-2 p-6 text-dim">
          <FileText className="size-6" />
          <span className="font-mono text-xs">{file.name}</span>
        </div>
      )}
    </div>
  );
}
