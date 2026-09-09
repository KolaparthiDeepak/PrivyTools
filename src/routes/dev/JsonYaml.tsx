import { getTool } from '../../tools/registry';
import { ToolHeader } from '../../components/tool/ToolHeader';
import { SplitTool, type Direction } from '../../components/dev/SplitTool';
import { jsonToYaml, yamlToJson } from '../../services/dev/json-yaml';

const tool = getTool('dev-json-yaml')!;

const directions: Direction[] = [
  {
    id: 'j2y',
    label: 'JSON → YAML',
    transform: jsonToYaml,
    inputLanguage: 'json',
    outputLanguage: 'yaml',
    downloadName: 'converted.yaml',
    downloadType: 'text/yaml',
  },
  {
    id: 'y2j',
    label: 'YAML → JSON',
    transform: yamlToJson,
    inputLanguage: 'yaml',
    outputLanguage: 'json',
    downloadName: 'converted.json',
    downloadType: 'application/json',
  },
];

export default function JsonYaml() {
  return (
    <main role="main" className="mx-auto flex max-w-5xl flex-col gap-8 p-6 sm:p-10">
      <ToolHeader tool={tool} title="Convert JSON and YAML." subtitle="Both directions, live, on your device." />
      <SplitTool directions={directions} inputPlaceholder='{"paste":"json or yaml"}' />
    </main>
  );
}
