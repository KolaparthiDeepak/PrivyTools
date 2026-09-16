import { privacyStatus } from '../../services/privacy.service';
import { usePrefs } from '../../store/prefs.store';

const SECTIONS = [
  { k: 'Processing mode', v: 'Local whenever supported' },
  { k: 'File storage', v: 'No cloud storage' },
  { k: 'Temporary data', v: 'Removed when you reset or leave' },
];

function Toggle({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: (b: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`inline-flex h-5 w-9 items-center rounded-full border transition-colors ${
        on ? 'border-[hsl(var(--accent-privacy))] bg-[hsl(var(--accent-privacy)/0.3)]' : 'border-border bg-track'
      }`}
    >
      <span className={`mx-0.5 size-3.5 rounded-full bg-text transition-transform ${on ? 'translate-x-4' : ''}`} />
    </button>
  );
}

export function PrivacyBoard() {
  const rows = privacyStatus();
  const telemetry = usePrefs((s) => s.telemetry);
  const setTelemetry = usePrefs((s) => s.setTelemetry);
  const privacyMode = usePrefs((s) => s.privacyMode);
  const setPrivacyMode = usePrefs((s) => s.setPrivacyMode);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid overflow-hidden rounded-lg border border-border sm:grid-cols-2">
        {SECTIONS.map((s) => (
          <div key={s.k} className="flex flex-col gap-1 border-b border-border p-4 last:border-b-0 sm:[&:nth-last-child(2)]:border-b-0">
            <span className="font-mono text-[10px] uppercase tracking-widest text-dim/70">{s.k}</span>
            <span className="text-sm text-text">{s.v}</span>
          </div>
        ))}
        <div className="flex items-center justify-between gap-3 border-b border-border p-4 sm:border-b-0">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-dim/70">Telemetry</span>
            <span className="text-sm text-text">
              {telemetry ? 'On - counts which tools you use, on this device only' : 'Off - nothing about your files is collected'}
            </span>
          </div>
          <Toggle on={telemetry} onChange={setTelemetry} label="Telemetry" />
        </div>
      </div>

      <section id="preferences" className="flex items-center justify-between gap-3 rounded-lg border border-border p-4">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-widest text-dim/70">Privacy mode</span>
          <span className="max-w-md text-xs text-dim">
            Everything already runs locally where supported; this is a reminder indicator, not a switch that changes behaviour.
          </span>
        </div>
        <Toggle on={privacyMode} onChange={setPrivacyMode} label="Privacy mode" />
      </section>

      <div className="overflow-hidden rounded-lg border border-border">
        <p className="border-b border-border p-3 font-mono text-[10px] uppercase tracking-widest text-dim/70">
          Per-tool processing
        </p>
        {rows.map((r) => (
          <div key={r.toolId} className="flex items-center gap-3 border-b border-border p-3 text-xs last:border-b-0">
            <span className="flex-1 text-text">{r.name}</span>
            <span
              className={`rounded-full border px-2 py-0.5 font-mono text-[10px] ${
                r.mode === 'local'
                  ? 'border-[hsl(var(--accent-privacy)/0.35)] text-[hsl(var(--accent-privacy))]'
                  : 'border-amber-500/35 text-amber-500'
              }`}
            >
              {r.mode === 'local' ? 'local' : 'demo'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
