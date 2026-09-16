import { toolsByCategory } from '../../tools/registry';
import { DEV_GROUP_ORDER, DEV_GROUPS, toolsInDevGroup } from '../../tools/devGroups';
import { ToolCard } from './ToolCard';

const GRID = 'grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3';

function GroupLabel({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-2.5 font-mono text-[11px] uppercase tracking-widest text-dim">{children}</h3>;
}

function SubGroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-2 mt-4 font-mono text-[10px] uppercase tracking-wider text-dim/60 first:mt-0">
      {children}
    </h4>
  );
}

export function QuickActions() {
  const pdf = toolsByCategory('pdf');
  const image = [...toolsByCategory('image'), ...toolsByCategory('ai')];

  return (
    <div className="flex flex-col gap-8">
      {pdf.length > 0 && (
        <div>
          <GroupLabel>PDF</GroupLabel>
          <div className={GRID}>
            {pdf.map((t) => (
              <ToolCard key={t.id} tool={t} />
            ))}
          </div>
        </div>
      )}
      {image.length > 0 && (
        <div>
          <GroupLabel>Image</GroupLabel>
          <div className={GRID}>
            {image.map((t) => (
              <ToolCard key={t.id} tool={t} />
            ))}
          </div>
        </div>
      )}
      <div>
        <GroupLabel>Developer</GroupLabel>
        {DEV_GROUP_ORDER.map((g) => (
          <div key={g}>
            <SubGroupLabel>{DEV_GROUPS[g].label}</SubGroupLabel>
            <div className={GRID}>
              {toolsInDevGroup(g).map((t) => (
                <ToolCard key={t.id} tool={t} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
