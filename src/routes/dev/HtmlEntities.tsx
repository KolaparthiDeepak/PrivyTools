import { getTool } from '../../tools/registry';
import { ToolHeader } from '../../components/tool/ToolHeader';
import { SplitTool, type Direction } from '../../components/dev/SplitTool';
import { encodeEntities, decodeEntities } from '../../services/dev/html-entities';

const tool = getTool('dev-html-entities')!;

const directions: Direction[] = [
  {
    id: 'enc',
    label: 'Encode',
    transform: encodeEntities,
    inputLanguage: 'text',
    outputLanguage: 'text',
    downloadName: 'entities.txt',
    downloadType: 'text/plain',
  },
  {
    id: 'dec',
    label: 'Decode',
    transform: decodeEntities,
    inputLanguage: 'text',
    outputLanguage: 'text',
    downloadName: 'entities.txt',
    downloadType: 'text/plain',
  },
];

export default function HtmlEntities() {
  return (
    <main role="main" className="mx-auto flex max-w-5xl flex-col gap-8 p-6 sm:p-10">
      <ToolHeader tool={tool} title="Encode and decode HTML entities." />
      <SplitTool directions={directions} inputPlaceholder="paste HTML or entities" />
    </main>
  );
}
