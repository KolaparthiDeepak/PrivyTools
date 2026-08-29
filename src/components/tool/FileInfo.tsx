import { formatBytes } from '../../lib/formatBytes';

const LABEL: Record<string, string> = {
  'application/pdf': 'PDF',
  'image/png': 'PNG',
  'image/jpeg': 'JPG',
  'image/webp': 'WebP',
};

export function FileInfo({ file, pages }: { file: File; pages?: number }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-dim">
      <span className="text-text">{file.name}</span>
      <span>{formatBytes(file.size)}</span>
      <span>{LABEL[file.type] ?? 'file'}</span>
      {pages != null && <span>{pages} pages</span>}
    </div>
  );
}
