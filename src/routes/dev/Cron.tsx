import { getTool } from '../../tools/registry';
import { ToolHeader } from '../../components/tool/ToolHeader';
import { FieldTool } from '../../components/dev/FieldTool';
import { explainCron } from '../../services/dev/cron-explain';

const tool = getTool('dev-cron')!;

export default function Cron() {
  return (
    <main role="main" className="mx-auto flex max-w-3xl flex-col gap-8 p-6 sm:p-10">
      <ToolHeader tool={tool} title="Explain cron expressions." subtitle="Plain English plus the next five runs (UTC)." />
      <FieldTool
        inputLabel="Cron expression"
        placeholder="*/5 * * * *"
        compute={(s) => {
          const r = explainCron(s, new Date());
          return [
            { label: 'Means', value: r.description },
            ...r.nextRuns.map((run, i) => ({ label: `Next ${i + 1}`, value: run })),
          ];
        }}
      />
    </main>
  );
}
