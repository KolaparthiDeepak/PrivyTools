import { getTool } from '../../tools/registry';
import { ToolHeader } from '../../components/tool/ToolHeader';
import { SplitTool, type Direction } from '../../components/dev/SplitTool';
import { encodeUrl, decodeUrl } from '../../services/dev/url-encode';

const tool = getTool('dev-url')!;

const directions: Direction[] = [
  {
    id: 'enc',
    label: 'Encode',
    transform: encodeUrl,
    inputLanguage: 'text',
    outputLanguage: 'text',
    downloadName: 'url.txt',
    downloadType: 'text/plain',
  },
  {
    id: 'dec',
    label: 'Decode',
    transform: decodeUrl,
    inputLanguage: 'text',
    outputLanguage: 'text',
    downloadName: 'url.txt',
    downloadType: 'text/plain',
  },
];

export default function UrlEncode() {
  return (
    <main role="main" className="mx-auto flex max-w-5xl flex-col gap-8 p-6 sm:p-10">
      <ToolHeader tool={tool} title="URL encode and decode." />
      <SplitTool toolId={tool.id} directions={directions} inputPlaceholder="paste URL or encoded text" />
    </main>
  );
}
