import { getTool } from '../../tools/registry';
import { ToolHeader } from '../../components/tool/ToolHeader';
import { SplitTool, type Direction } from '../../components/dev/SplitTool';
import { queryToJson, jsonToQuery } from '../../services/dev/query-json';

const tool = getTool('dev-query-json')!;

const directions: Direction[] = [
  {
    id: 'q2j',
    label: 'Query → JSON',
    transform: queryToJson,
    inputLanguage: 'text',
    outputLanguage: 'json',
    downloadName: 'query.json',
    downloadType: 'application/json',
  },
  {
    id: 'j2q',
    label: 'JSON → Query',
    transform: jsonToQuery,
    inputLanguage: 'json',
    outputLanguage: 'text',
    downloadName: 'query.txt',
    downloadType: 'text/plain',
  },
];

export default function QueryJson() {
  return (
    <main role="main" className="mx-auto flex max-w-5xl flex-col gap-8 p-6 sm:p-10">
      <ToolHeader tool={tool} title="Convert query strings and JSON." />
      <SplitTool directions={directions} inputPlaceholder="paste query string or JSON" />
    </main>
  );
}
