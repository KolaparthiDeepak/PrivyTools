import { ProgressIndicator } from './ProgressIndicator';
import { Button } from '../ui';

export function ProcessingState({
  phase,
  ratio,
  onCancel,
  children,
}: {
  phase: string;
  ratio?: number;
  onCancel?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-6 py-6 text-center">
      <div className="w-full">{children}</div>
      <ProgressIndicator ratio={ratio} label={phase} />
      {onCancel && (
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      )}
    </div>
  );
}
