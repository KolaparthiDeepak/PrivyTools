import { usePrefs } from '../../store/prefs.store';
import { useUsage } from '../../store/usage.store';
import { getTool, type Tool } from '../../tools/registry';

export function UsagePanel() {
  const telemetry = usePrefs((s) => s.telemetry);
  const counts = useUsage((s) => s.counts);
  const clear = useUsage((s) => s.clear);

  if (!telemetry) {
    return (
      <div className="rounded-lg border border-border p-4 text-xs text-dim">
        Turn on Telemetry above to start counting local tool usage. Nothing is counted while it's off.
      </div>
    );
  }

  const rows = Object.entries(counts)
    .map(([id, count]) => ({ tool: getTool(id), count }))
    .filter((r): r is { tool: Tool; count: number } => r.tool !== undefined)
    .sort((a, b) => b.count - a.count);
  const total = rows.reduce((sum, r) => sum + r.count, 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-dim/70">
          {total} action{total === 1 ? '' : 's'} completed
        </span>
        <button type="button" onClick={clear} className="text-xs text-dim hover:text-text">
          Clear usage data
        </button>
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-dim">No actions completed yet.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          {rows.map((r) => (
            <div
              key={r.tool.id}
              className="flex items-center gap-3 border-b border-border p-3 text-xs last:border-b-0"
            >
              <span className="flex-1 text-text">{r.tool.name}</span>
              <span className="font-mono text-dim">{r.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
