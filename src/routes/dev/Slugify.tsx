import { getTool } from '../../tools/registry';
import { ToolHeader } from '../../components/tool/ToolHeader';
import { FieldTool } from '../../components/dev/FieldTool';
import { slugify } from '../../services/dev/slugify';

const tool = getTool('dev-slug')!;

export default function Slugify() {
  return (
    <main role="main" className="mx-auto flex max-w-3xl flex-col gap-8 p-6 sm:p-10">
      <ToolHeader tool={tool} title="Slugify text." subtitle="URL-safe slugs: lowercase, no accents, hyphenated." />
      <FieldTool
        toolId={tool.id}
        inputLabel="Text to slugify"
        placeholder="Hello, World!"
        compute={(s) => [{ label: 'Slug', value: slugify(s) }]}
      />
    </main>
  );
}
