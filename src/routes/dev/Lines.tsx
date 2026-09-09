import { getTool } from '../../tools/registry';
import { ToolHeader } from '../../components/tool/ToolHeader';
import { LinesTool } from '../../components/dev/LinesTool';

const tool = getTool('dev-lines')!;

export default function Lines() {
  return (
    <main role="main" className="mx-auto flex max-w-5xl flex-col gap-8 p-6 sm:p-10">
      <ToolHeader tool={tool} title="Sort and dedupe lines." subtitle="Sort, unique, trim, filter — live." />
      <LinesTool />
    </main>
  );
}
