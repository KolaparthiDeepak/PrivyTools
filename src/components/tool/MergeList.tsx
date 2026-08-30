import { Reorder } from 'framer-motion';
import { GripVertical, X, Plus } from 'lucide-react';
import { useDropzone } from '../../hooks/useDropzone';

export function MergeList({
  files,
  onReorder,
  onRemove,
  onAdd,
  accept,
  itemLabel = 'FILE',
  countLabel = 'files',
}: {
  files: File[];
  onReorder: (next: File[]) => void;
  onRemove: (index: number) => void;
  onAdd: (f: File[]) => void;
  accept: string[];
  itemLabel?: string;
  countLabel?: string;
}) {
  const dz = useDropzone({
    accept,
    multiple: true,
    onFile: (f) => onAdd(Array.isArray(f) ? f : [f]),
  });
  return (
    <div className="flex flex-col gap-2">
      <Reorder.Group axis="y" values={files} onReorder={onReorder} className="flex flex-col gap-2">
        {files.map((file, i) => (
          <Reorder.Item
            key={`${file.name}-${i}`}
            value={file}
            className="flex items-center gap-3 rounded-md border border-border bg-surface-hi px-3 py-2.5"
          >
            <GripVertical className="size-3.5 cursor-grab text-dim/60" />
            <span className="font-mono text-[11px] text-accent">
              {itemLabel} {String(i + 1).padStart(2, '0')}
            </span>
            <span className="flex-1 truncate text-xs text-dim">{file.name}</span>
            <button
              type="button"
              aria-label={`Remove ${file.name}`}
              onClick={() => onRemove(i)}
              className="text-dim/60 hover:text-text"
            >
              <X className="size-3.5" />
            </button>
          </Reorder.Item>
        ))}
      </Reorder.Group>
      <button
        type="button"
        onClick={dz.open}
        className="flex items-center justify-center gap-2 rounded-md border border-dashed border-border-hi px-3 py-2.5 text-xs text-dim hover:text-text"
      >
        <input {...dz.inputProps} />
        <Plus className="size-3.5" /> Add more
      </button>
      <p className="font-mono text-[11px] text-dim/70">
        {files.length} {countLabel}
      </p>
    </div>
  );
}
