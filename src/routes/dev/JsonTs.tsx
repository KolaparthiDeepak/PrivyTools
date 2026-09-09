import { getTool } from '../../tools/registry';
import { ToolHeader } from '../../components/tool/ToolHeader';
import { SplitTool, type Direction } from '../../components/dev/SplitTool';
import { jsonToTs } from '../../services/dev/json-ts';

const tool = getTool('dev-json-ts')!;

const directions: Direction[] = [
  {
    id: 'ts',
    label: 'JSON → TS',
    transform: jsonToTs,
    inputLanguage: 'json',
    outputLanguage: 'text',
    downloadName: 'types.ts',
    downloadType: 'text/plain',
  },
];

export default function JsonTs() {
  return (
    <main role="main" className="mx-auto flex max-w-5xl flex-col gap-8 p-6 sm:p-10">
      <ToolHeader tool={tool} title="Generate TypeScript types from JSON." subtitle="One sample in, interfaces out. Best-effort — check the result." />
      <SplitTool directions={directions} inputPlaceholder='{"paste":"json sample"}' />
    </main>
  );
}
