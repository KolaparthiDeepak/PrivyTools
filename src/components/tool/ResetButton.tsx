import { Button } from '../ui';

export function ResetButton({
  onClick,
  children = 'Process another',
}: {
  onClick: () => void;
  children?: React.ReactNode;
}) {
  return (
    <Button variant="ghost" onClick={onClick}>
      {children}
    </Button>
  );
}
