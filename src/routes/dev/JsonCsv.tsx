import { getTool } from '../../tools/registry';
import { ToolHeader } from '../../components/tool/ToolHeader';
import { SplitTool, type Direction } from '../../components/dev/SplitTool';
import { jsonToCsv, csvToJson } from '../../services/dev/json-csv';

const tool = getTool('dev-json-csv')!;

const directions: Direction[] = [
  {
    id: 'j2c',
    label: 'JSON → CSV',
    transform: jsonToCsv,
    inputLanguage: 'json',
    outputLanguage: 'text',
    downloadName: 'data.csv',
    downloadType: 'text/csv',
  },
  {
    id: 'c2j',
    label: 'CSV → JSON',
    transform: csvToJson,
    inputLanguage: 'text',
    outputLanguage: 'json',
    downloadName: 'data.json',
    downloadType: 'application/json',
  },
];

export default function JsonCsv() {
  return (
    <main role="main" className="mx-auto flex max-w-5xl flex-col gap-8 p-6 sm:p-10">
      <ToolHeader tool={tool} title="Convert JSON and CSV." subtitle="JSON must be an array of objects. Nested values become JSON text in the cell." />
      <SplitTool directions={directions} inputPlaceholder='[{"paste":"json or csv"}]' />
    </main>
  );
}
