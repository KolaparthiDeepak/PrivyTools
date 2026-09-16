import { getTool } from '../../tools/registry';
import { ToolHeader } from '../../components/tool/ToolHeader';
import { FieldTool } from '../../components/dev/FieldTool';
import { convertCases } from '../../services/dev/case-convert';

const tool = getTool('dev-case')!;

export default function CaseConvert() {
  return (
    <main role="main" className="mx-auto flex max-w-3xl flex-col gap-8 p-6 sm:p-10">
      <ToolHeader tool={tool} title="Convert text case." subtitle="camelCase, snake_case, kebab-case, CONSTANT_CASE, Title Case, Sentence case, and PascalCase." />
      <FieldTool
        toolId={tool.id}
        inputLabel="Text to convert"
        placeholder="helloWorld example"
        compute={(s) => {
          const r = convertCases(s);
          return [
            { label: 'camelCase', value: r.camel },
            { label: 'PascalCase', value: r.pascal },
            { label: 'snake_case', value: r.snake },
            { label: 'kebab-case', value: r.kebab },
            { label: 'CONSTANT_CASE', value: r.constant },
            { label: 'Title Case', value: r.title },
            { label: 'Sentence case', value: r.sentence },
          ];
        }}
      />
    </main>
  );
}
