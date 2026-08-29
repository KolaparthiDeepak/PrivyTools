import { AlertTriangle } from 'lucide-react';
import { Button } from '../ui';

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <span className="grid size-11 place-items-center rounded-full border border-amber-500/40 text-amber-500">
        <AlertTriangle className="size-5" />
      </span>
      <h2 className="text-lg font-semibold text-text">Something went wrong.</h2>
      <p className="max-w-xs text-sm text-dim">{message || "We couldn't process this file."}</p>
      <p className="text-xs text-dim/70">The original file is untouched.</p>
      <Button variant="primary" className="mt-1" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
