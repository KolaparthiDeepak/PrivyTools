import { getTool } from '../../tools/registry';
import { ToolHeader } from '../../components/tool/ToolHeader';
import { SplitTool, type Direction } from '../../components/dev/SplitTool';
import { encodeBase64, decodeBase64 } from '../../services/dev/base64';

const tool = getTool('dev-base64')!;

const directions: Direction[] = [
  {
    id: 'enc',
    label: 'Encode',
    transform: encodeBase64,
    inputLanguage: 'text',
    outputLanguage: 'text',
    downloadName: 'encoded.txt',
    downloadType: 'text/plain',
  },
  {
    id: 'dec',
    label: 'Decode',
    transform: decodeBase64,
    inputLanguage: 'text',
    outputLanguage: 'text',
    downloadName: 'decoded.txt',
    downloadType: 'text/plain',
  },
];

export default function Base64() {
  return (
    <main role="main" className="mx-auto flex max-w-5xl flex-col gap-8 p-6 sm:p-10">
      <ToolHeader tool={tool} title="Base64 encode and decode." subtitle="Text and text files, UTF-8 safe." />
      <SplitTool toolId={tool.id} directions={directions} inputPlaceholder="paste text or Base64" />
    </main>
  );
}
