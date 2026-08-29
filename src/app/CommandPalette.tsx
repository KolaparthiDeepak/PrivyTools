import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES, TOOLS, type Category } from '../tools/registry';

const GROUP_ORDER: Category[] = ['pdf', 'image', 'ai', 'privacy'];

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
      className="fixed inset-0 z-50 grid place-items-start justify-center bg-black/50 p-4 pt-[12vh] [&_[cmdk-dialog]]:contents"
    >
      <div className="w-full max-w-md overflow-hidden rounded-lg border border-border-hi bg-surface shadow-1">
        <Command.Input
          placeholder="What do you want to do?"
          className="h-12 w-full border-b border-border bg-transparent px-4 text-sm text-text outline-none placeholder:text-dim"
        />
        <Command.List className="max-h-80 overflow-auto p-1.5">
          <Command.Empty className="px-3 py-6 text-center text-sm text-dim">
            No tools match.
          </Command.Empty>
          {GROUP_ORDER.map((cat) => {
            const tools = TOOLS.filter((t) => t.category === cat && t.id !== 'privacy-center');
            if (!tools.length && cat !== 'privacy') return null;
            const list = cat === 'privacy' ? TOOLS.filter((t) => t.category === 'privacy') : tools;
            return (
              <Command.Group
                key={cat}
                heading={CATEGORIES[cat].label}
                className="px-1 py-1 font-mono text-[10px] uppercase tracking-widest text-dim/70 [&_[cmdk-group-items]]:mt-1"
              >
                {list.map((t) => (
                  <Command.Item
                    key={t.id}
                    value={`${t.name} ${t.description}`}
                    onSelect={() => go(t.route)}
                    className="flex items-center gap-2.5 rounded px-2.5 py-2 text-[13px] text-dim data-[selected=true]:bg-surface-hi data-[selected=true]:text-text"
                  >
                    <t.icon className="size-3.5" />
                    {t.name}
                  </Command.Item>
                ))}
              </Command.Group>
            );
          })}
        </Command.List>
      </div>
    </Command.Dialog>
  );
}
