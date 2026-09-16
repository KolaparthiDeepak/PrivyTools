import { getTool } from '../../tools/registry';
import { ToolHeader } from '../../components/tool/ToolHeader';
import { DiffTool } from '../../components/dev/DiffTool';
import { diffText } from '../../services/dev/text-diff';

const tool = getTool('dev-diff')!;

export default function Diff() {
  return (
    <main role="main" className="mx-auto flex max-w-5xl flex-col gap-8 p-6 sm:p-10">
      <ToolHeader tool={tool} title="Compare two texts." subtitle="Line-by-line diff, entirely in the browser." />
      <DiffTool toolId={tool.id} diff={diffText} />
    </main>
  );
}
