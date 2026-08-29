import { TOOLS } from '../../tools/registry';
import { ToolCard } from './ToolCard';

export function QuickActions() {
  return (
    <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
      {TOOLS.map((t) => (
        <ToolCard key={t.id} tool={t} />
      ))}
    </div>
  );
}
