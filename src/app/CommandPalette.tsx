import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES, TOOLS, type Category, type Tool } from '../tools/registry';
import { DEV_GROUP_ORDER, DEV_GROUPS, toolsInDevGroup } from '../tools/devGroups';

const GROUP_ORDER: Category[] = ['pdf', 'image', 'ai'];

const GROUP_CLASS =
  'px-1 py-1 font-mono text-[10px] uppercase tracking-widest text-dim/70 [&_[cmdk-group-items]]:mt-1';
const ITEM_CLASS =
  'flex items-center gap-2.5 rounded px-2.5 py-2 text-[13px] text-dim data-[selected=true]:bg-surface-hi data-[selected=true]:text-text';

function GroupItems({ tools, go }: { tools: Tool[]; go: (route: string) => void }) {
  return (
    <>
      {tools.map((t) => (
        <Command.Item
          key={t.id}
          value={`${t.name} ${t.description}`}
          onSelect={() => go(t.route)}
          className={ITEM_CLASS}
        >
          <t.icon className="size-3.5" />
          {t.name}
        </Command.Item>
      ))}
    </>
  );
}

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const navigate = useNavigate();

  const go = (route: string) => {
    onOpenChange(false);
    navigate(route);
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Command palette"
      overlayClassName="fixed inset-0 z-50 bg-black/50"
      contentClassName="fixed left-1/2 top-[12vh] z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2"
    >
      <div className="w-full overflow-hidden rounded-lg border border-border-hi bg-surface shadow-1">
        <Command.Input
          placeholder="What do you want to do?"
          className="h-12 w-full border-b border-border bg-transparent px-4 text-sm text-text outline-none placeholder:text-dim"
        />
        <Command.List className="max-h-80 overflow-auto p-1.5">
          <Command.Empty className="px-3 py-6 text-center text-sm text-dim">
            No tools match.
          </Command.Empty>
          {GROUP_ORDER.map((cat) => {
            const list = TOOLS.filter((t) => t.category === cat);
            if (!list.length) return null;
            return (
              <Command.Group key={cat} heading={CATEGORIES[cat].label} className={GROUP_CLASS}>
                <GroupItems tools={list} go={go} />
              </Command.Group>
            );
          })}
          {DEV_GROUP_ORDER.map((g) => (
            <Command.Group key={g} heading={DEV_GROUPS[g].label} className={GROUP_CLASS}>
              <GroupItems tools={toolsInDevGroup(g)} go={go} />
            </Command.Group>
          ))}
          <Command.Group heading={CATEGORIES.privacy.label} className={GROUP_CLASS}>
            <GroupItems tools={TOOLS.filter((t) => t.category === 'privacy')} go={go} />
          </Command.Group>
        </Command.List>
      </div>
    </Command.Dialog>
  );
}
