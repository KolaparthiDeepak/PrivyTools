import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Star, PanelLeftClose, PanelLeftOpen, Shield, ChevronRight } from 'lucide-react';
import { TOOLS, getTool, toolsByCategory, type Tool } from '../tools/registry';
import { DEV_GROUP_ORDER, DEV_GROUPS, toolsInDevGroup } from '../tools/devGroups';
import { usePrefs } from '../store/prefs.store';
import { cn } from '../lib/cn';

// Developer sub-groups are promoted to top-level sections.
const NAV_SECTIONS: { label: string; tools: () => Tool[] }[] = [
  { label: 'PDF', tools: () => toolsByCategory('pdf') },
  { label: 'Image', tools: () => [...toolsByCategory('image'), ...toolsByCategory('ai')] },
  ...DEV_GROUP_ORDER.map((g) => ({ label: DEV_GROUPS[g].label, tools: () => toolsInDevGroup(g) })),
  { label: 'Privacy', tools: () => toolsByCategory('privacy') },
];

const sectionFor = (pathname: string) =>
  NAV_SECTIONS.find((sec) => sec.tools().some((t) => t.route === pathname))?.label ?? null;

function Section({ label, open, onToggle, icon, children }: {
  label: string;
  open: boolean;
  onToggle: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  const id = `nav-${label.replace(/\W+/g, '-').toLowerCase()}`;
  return (
    <nav aria-label={label} className="flex flex-col gap-0.5">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={onToggle}
        className="flex items-center gap-1.5 rounded-md px-2.5 py-2 text-left text-[13.5px] font-semibold text-text hover:bg-surface-hi"
      >
        {icon}
        <span className="flex-1 truncate">{label}</span>
        <ChevronRight className={cn('size-3.5 text-dim transition-transform duration-200', open && 'rotate-90')} />
      </button>
      {open && (
        <div id={id} className="flex flex-col gap-0.5 pl-2">
          {children}
        </div>
      )}
    </nav>
  );
}

function Item({ to, label, Icon, collapsed }: { to: string; label: string; Icon: typeof Home; collapsed: boolean }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        cn(
          'flex items-center rounded-md text-[13.5px] text-dim hover:text-text',
          collapsed ? 'size-10 justify-center' : 'gap-2.5 px-2.5 py-2',
          isActive && 'bg-surface-hi text-text shadow-[inset_0_0_0_1px_var(--border)]',
        )
      }
      title={collapsed ? label : undefined}
    >
      <Icon className="size-4 shrink-0 opacity-80" />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  );
}

export function Sidebar() {
  const collapsed = usePrefs((s) => s.sidebarCollapsed);
  const toggle = usePrefs((s) => s.toggleSidebar);
  const favorites = usePrefs((s) => s.favorites);
  const { pathname } = useLocation();
  const [open, setOpen] = useState<string | null>(() => sectionFor(pathname));

  // Navigating elsewhere (palette, home cards) reveals that page's section.
  useEffect(() => {
    const sec = sectionFor(pathname);
    if (sec) setOpen(sec);
  }, [pathname]);

  const toggleSection = (label: string) => setOpen((o) => (o === label ? null : label));
  const favoriteTools = favorites.map((id) => getTool(id)).filter((t): t is Tool => t !== undefined);
  const item = (t: Tool) => <Item key={t.id} to={t.route} label={t.name} Icon={t.icon} collapsed={collapsed} />;

  return (
    <div className={cn('flex h-full flex-col gap-5', collapsed ? 'items-center p-2' : 'p-3.5')}>
      <div
        className={cn(
          'flex items-center',
          collapsed ? 'flex-col gap-2' : 'justify-between px-1.5',
        )}
      >
        <div className="flex items-center gap-2.5 font-semibold">
          <span className="grid size-6 place-items-center rounded-md border border-border-hi bg-raise text-accent">
            <Shield className="size-3.5" />
          </span>
          {!collapsed && 'PrivyTools'}
        </div>
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="text-dim hover:text-text"
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        </button>
      </div>

      <nav className="flex flex-col gap-1">
        <Item to="/" label="Home" Icon={Home} collapsed={collapsed} />
      </nav>

      {collapsed ? (
        // Icon rail: no headings to click, so list every tool.
        <nav aria-label="Tools" className="flex flex-col gap-0.5">
          {NAV_SECTIONS.flatMap((sec) => sec.tools()).map(item)}
        </nav>
      ) : (
        <div className="flex flex-col gap-0.5">
          {NAV_SECTIONS.map((sec) => (
            <Section key={sec.label} label={sec.label} open={open === sec.label} onToggle={() => toggleSection(sec.label)}>
              {sec.tools().map(item)}
            </Section>
          ))}
          {favoriteTools.length > 0 && (
            <Section
              label="Favorites"
              icon={<Star className="size-3.5 text-dim" />}
              open={open === 'Favorites'}
              onToggle={() => toggleSection('Favorites')}
            >
              {favoriteTools.map(item)}
            </Section>
          )}
        </div>
      )}

      <p className="sr-only">{TOOLS.length} tools available</p>
    </div>
  );
}
