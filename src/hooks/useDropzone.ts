import { useCallback, useRef, useState } from 'react';
import { isAccepted, rejectionReason } from '../lib/fileValidation';

interface Opts {
  accept: string[];
  multiple?: boolean;
  onFile: (f: File | File[]) => void;
  onReject?: (reason: string) => void;
}

export function useDropzone({ accept, multiple = false, onFile, onReject }: Opts) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setDragging] = useState(false);
  const depth = useRef(0);

  const handleFiles = useCallback(
    (list: FileList | null) => {
      if (!list?.length) return;
      const files = [...list];
      const bad = files.find((f) => !isAccepted(f, accept));
      if (bad) {
        onReject?.(rejectionReason(bad, accept) ?? 'Unsupported file.');
        return;
      }
      onFile(multiple ? files : files[0]);
    },
    [accept, multiple, onFile, onReject],
  );

  return {
    isDragging,
    open: () => inputRef.current?.click(),
    inputProps: {
      ref: inputRef,
      type: 'file' as const,
      hidden: true,
      accept: accept.join(','),
      multiple,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files),
    },
    rootProps: {
      onDragEnter: (e: React.DragEvent) => {
        e.preventDefault();
        depth.current++;
        setDragging(true);
      },
      onDragOver: (e: React.DragEvent) => e.preventDefault(),
      onDragLeave: (e: React.DragEvent) => {
        e.preventDefault();
        if (--depth.current <= 0) setDragging(false);
      },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        depth.current = 0;
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      },
    },
  };
}
