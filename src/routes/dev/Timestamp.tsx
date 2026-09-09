import { getTool } from '../../tools/registry';
import { ToolHeader } from '../../components/tool/ToolHeader';
import { FieldTool } from '../../components/dev/FieldTool';
import { describeTimestamp } from '../../services/dev/timestamp';

const tool = getTool('dev-timestamp')!;

export default function Timestamp() {
  return (
    <main role="main" className="mx-auto flex max-w-3xl flex-col gap-8 p-6 sm:p-10">
      <ToolHeader tool={tool} title="Convert Unix timestamps." subtitle="Epoch seconds or millis, or any date string." />
      <FieldTool
        inputLabel="Timestamp or date"
        placeholder="1735689600 or 2026-01-01"
        compute={(s) => {
          const r = describeTimestamp(s, new Date());
          return [
            { label: 'Unix (s)', value: r.unixSeconds },
            { label: 'Unix (ms)', value: r.unixMillis },
            { label: 'ISO 8601', value: r.iso },
            { label: 'UTC', value: r.utc },
            { label: 'Local', value: r.local },
            { label: 'Relative', value: r.relative },
          ];
        }}
      />
    </main>
  );
}
