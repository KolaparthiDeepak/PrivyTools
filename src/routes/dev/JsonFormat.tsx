import { getTool } from '../../tools/registry';
import { ToolHeader } from '../../components/tool/ToolHeader';
import { SplitTool, type Direction } from '../../components/dev/SplitTool';
import { prettyJson, minifyJson } from '../../services/dev/json-format';

const tool = getTool('dev-json-format')!;

const directions: Direction[] = [
  {
    id: 'pretty', label: 'Prettify',
    transform: prettyJson,
    inputLanguage: 'json', outputLanguage: 'json',
    downloadName: 'formatted.json', downloadType: 'application/json',
  },
  {
    id: 'minify', label: 'Minify',
    transform: minifyJson,
    inputLanguage: 'json', outputLanguage: 'json',
    downloadName: 'formatted.json', downloadType: 'application/json',
  },
];

export default function JsonFormat() {
  return (
    <main role="main" className="mx-auto flex max-w-5xl flex-col gap-8 p-6 sm:p-10">
      <ToolHeader
        tool={tool}
        title="Format JSON."
        subtitle="Prettify or minify. Invalid JSON is flagged with the parser's message."
      />
      <SplitTool toolId={tool.id} directions={directions} inputPlaceholder='{"paste":"json here"}' />
    </main>
  );
}
