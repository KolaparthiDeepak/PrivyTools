import { Download } from 'lucide-react';
import { Button } from '../ui';
import { downloadBlob } from '../../lib/download';

export function DownloadButton({ blob, filename }: { blob: Blob; filename: string }) {
  return (
    <Button variant="primary" onClick={() => downloadBlob(blob, filename)}>
      <Download className="size-4" /> Download file
    </Button>
  );
}
