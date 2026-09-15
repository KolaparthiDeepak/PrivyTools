# Home & Sidebar Navigation Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sub-group the 15 Developer tools into 4 named groups everywhere they're listed (sidebar, command palette, dashboard), remove Privacy Center from the dashboard grid, and reorganize the dashboard into grouped sections instead of one flat 22-card grid.

**Architecture:** One new static lookup (`src/tools/devGroups.ts`) is the single source of truth for the 4 Developer sub-groups. `Sidebar.tsx`, `CommandPalette.tsx`, and `QuickActions.tsx` each read from it to render their own grouped view — no shared rendering component, since each surface's markup is already different (nav links vs. `cmdk` groups vs. tool-card grids).

**Tech Stack:** React 19, TypeScript (strict), Tailwind v4, Vitest + Testing Library, `cmdk`, `lucide-react`.

## Global Constraints

- No registry schema change. `Tool` (`src/tools/registry.ts`) is untouched; grouping is a separate lookup keyed by tool id. (spec §3.1)
- `DEV_GROUPS`/`DEV_GROUP_ORDER` are the single source of truth — no surface defines its own copy of the mapping. (spec §3.1)
- A registry test enforces that every `dev`-category tool id appears in exactly one `DEV_GROUPS` entry — no orphans, no duplicates. (spec §3.2)
- `MobileNav.tsx` is out of scope — no change. (spec §2)
- `ToolCard.tsx` visual design is unchanged — only what groups/wraps it changes. (spec §2)
- Privacy Center stays reachable via the sidebar's Privacy nav item and the mobile nav's Privacy tab — both unchanged. Only the dashboard grid loses it. (spec §1, §3.5)
- TypeScript strict, `noUnusedLocals`, `noUnusedParameters`. `npm run typecheck` must stay clean throughout.
- Test env: Vitest + jsdom, Testing Library. Existing test files (`Sidebar.test.tsx`, `CommandPalette.test.tsx`, `Dashboard.test.tsx`, `registry.test.ts`) must stay green; extend them, don't replace their existing assertions.

---

## File Structure

**Created:**
- `src/tools/devGroups.ts` — `DevGroup` type, `DEV_GROUP_ORDER`, `DEV_GROUPS` map, `toolsInDevGroup()` helper
- `src/tools/devGroups.test.ts` — one test for `toolsInDevGroup()`

**Modified:**
- `src/tools/registry.test.ts` — new grouping-invariant test
- `src/app/Sidebar.tsx` — Developer section renders 4 nested sub-groups
- `src/app/Sidebar.test.tsx` — assert a sub-heading renders
- `src/app/CommandPalette.tsx` — `dev` category split into 4 `Command.Group`s
- `src/app/CommandPalette.test.tsx` — assert a dev tool is still found by search
- `src/components/dashboard/QuickActions.tsx` — grouped sections (PDF, Image, Developer w/ 4 sub-groups); Privacy Center excluded
- `src/routes/Dashboard.test.tsx` — exclude `privacy-center` from the per-tool loop; add a test asserting it's absent

---

## Task 1: `devGroups.ts` lookup + registry invariant

**Files:**
- Create: `src/tools/devGroups.ts`
- Create: `src/tools/devGroups.test.ts`
- Modify: `src/tools/registry.test.ts`

**Interfaces:**
- Consumes: `getTool`, `Tool`, `TOOLS` from `src/tools/registry.ts`.
- Produces:
  ```ts
  export type DevGroup = 'converters' | 'encoders' | 'text' | 'schedule';
  export const DEV_GROUP_ORDER: DevGroup[];
  export const DEV_GROUPS: Record<DevGroup, { label: string; toolIds: string[] }>;
  export function toolsInDevGroup(g: DevGroup): Tool[];
  ```
  Later tasks (Sidebar, CommandPalette, QuickActions) import all four.

- [ ] **Step 1: Write the failing test**

`src/tools/devGroups.test.ts`:

```ts
import { toolsInDevGroup } from './devGroups';

test('toolsInDevGroup resolves ids to real Tool objects', () => {
  const tools = toolsInDevGroup('converters');
  expect(tools.length).toBe(5);
  expect(tools.map((t) => t.id)).toContain('dev-json-format');
  expect(tools.every((t) => t.category === 'dev')).toBe(true);
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npm test -- src/tools/devGroups.test.ts`
Expected: FAIL — `Cannot find module './devGroups'`.

- [ ] **Step 3: Implement**

`src/tools/devGroups.ts`:

```ts
import { getTool, type Tool } from './registry';

export type DevGroup = 'converters' | 'encoders' | 'text' | 'schedule';

export const DEV_GROUP_ORDER: DevGroup[] = ['converters', 'encoders', 'text', 'schedule'];

export const DEV_GROUPS: Record<DevGroup, { label: string; toolIds: string[] }> = {
  converters: {
    label: 'Converters',
    toolIds: ['dev-json-format', 'dev-json-yaml', 'dev-json-csv', 'dev-json-ts', 'dev-query-json'],
  },
  encoders: {
    label: 'Encoders / Decoders',
    toolIds: ['dev-base64', 'dev-url', 'dev-html-entities', 'dev-jwt'],
  },
  text: {
    label: 'Text Utilities',
    toolIds: ['dev-case', 'dev-slug', 'dev-lines', 'dev-diff'],
  },
  schedule: {
    label: 'Date & Schedule',
    toolIds: ['dev-timestamp', 'dev-cron'],
  },
};

export function toolsInDevGroup(g: DevGroup): Tool[] {
  return DEV_GROUPS[g].toolIds.map(getTool).filter((t): t is Tool => t !== undefined);
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npm test -- src/tools/devGroups.test.ts` → Expected: PASS

- [ ] **Step 5: Add the registry invariant test**

In `src/tools/registry.test.ts`, add the import and test:

```ts
import { DEV_GROUP_ORDER, DEV_GROUPS } from './devGroups';
```

```ts
test('every dev tool belongs to exactly one DEV_GROUPS entry', () => {
  const devIds = TOOLS.filter((t) => t.category === 'dev').map((t) => t.id);
  const grouped = DEV_GROUP_ORDER.flatMap((g) => DEV_GROUPS[g].toolIds);
  expect(new Set(grouped).size).toBe(grouped.length);
  expect(grouped.sort()).toEqual(devIds.sort());
});
```

- [ ] **Step 6: Run tests, verify they pass**

Run: `npm test -- src/tools/devGroups.test.ts src/tools/registry.test.ts` → Expected: PASS
Run: `npm run typecheck` → Expected: clean

- [ ] **Step 7: Commit**

```bash
git add src/tools/devGroups.ts src/tools/devGroups.test.ts src/tools/registry.test.ts
git commit -m "feat(nav): add DEV_GROUPS lookup and registry grouping invariant"
```

---

## Task 2: Sidebar sub-grouping

**Files:**
- Modify: `src/app/Sidebar.tsx`
- Modify: `src/app/Sidebar.test.tsx`

**Interfaces:**
- Consumes: `DEV_GROUP_ORDER`, `DEV_GROUPS`, `toolsInDevGroup` from `../tools/devGroups` (Task 1).
- Produces: no new exports — internal render change only.

- [ ] **Step 1: Write the failing test**

Add to `src/app/Sidebar.test.tsx` (append; keep the existing two tests as-is):

```tsx
test('shows Developer sub-group headings', () => {
  render(
    <MemoryRouter>
      <Sidebar />
    </MemoryRouter>,
  );
  expect(screen.getByText('Converters')).toBeInTheDocument();
  expect(screen.getByText('Encoders / Decoders')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npm test -- src/app/Sidebar.test.tsx`
Expected: FAIL — `Unable to find an element with the text: Converters`.

- [ ] **Step 3: Implement**

`src/app/Sidebar.tsx` — add the import:

```ts
import { DEV_GROUP_ORDER, DEV_GROUPS, toolsInDevGroup } from '../tools/devGroups';
```

Replace the `NAV_SECTIONS.map(...)` block (the one rendering `sec.tools().map(...)`) with:

```tsx
{NAV_SECTIONS.map((sec) => (
  <nav key={sec.label} className="flex flex-col gap-0.5">
    {!collapsed && (
      <span className="px-2.5 pb-1 pt-2 font-mono text-[10px] uppercase tracking-widest text-dim/70">
        {sec.label}
      </span>
    )}
    {sec.label === 'Developer'
      ? DEV_GROUP_ORDER.map((g) => (
          <div key={g} className="flex flex-col gap-0.5">
            {!collapsed && (
              <span className="px-2.5 pb-0.5 pt-1.5 font-mono text-[9.5px] uppercase tracking-wider text-dim/50">
                {DEV_GROUPS[g].label}
              </span>
            )}
            {toolsInDevGroup(g).map((t) => (
              <Item key={t.id} to={t.route} label={t.name} Icon={t.icon} collapsed={collapsed} />
            ))}
          </div>
        ))
      : sec.tools().map((t) => (
          <Item key={t.id} to={t.route} label={t.name} Icon={t.icon} collapsed={collapsed} />
        ))}
  </nav>
))}
```

`NAV_SECTIONS` itself is unchanged (still has a `Developer` entry with `tools: () => toolsByCategory('dev')` — that function is simply not called anymore when `sec.label === 'Developer'`, since the ternary takes the `DEV_GROUP_ORDER` branch instead. Leaving the entry as-is keeps `NAV_SECTIONS`'s shape uniform and avoids a special-cased array literal).

- [ ] **Step 4: Run test, verify it passes**

Run: `npm test -- src/app/Sidebar.test.tsx` → Expected: PASS (all 3 tests)

- [ ] **Step 5: Run typecheck and lint**

Run: `npm run typecheck` → clean
Run: `npm run lint` → clean

- [ ] **Step 6: Commit**

```bash
git add src/app/Sidebar.tsx src/app/Sidebar.test.tsx
git commit -m "feat(nav): sub-group Developer tools in the sidebar"
```

---

## Task 3: CommandPalette sub-grouping

**Files:**
- Modify: `src/app/CommandPalette.tsx`
- Modify: `src/app/CommandPalette.test.tsx`

**Interfaces:**
- Consumes: `DEV_GROUP_ORDER`, `DEV_GROUPS`, `toolsInDevGroup` from `../tools/devGroups` (Task 1); `Tool` type from `../tools/registry`.
- Produces: no new exports — internal render change only.

- [ ] **Step 1: Write the failing test**

Add to `src/app/CommandPalette.test.tsx` (append; keep the existing test as-is):

```tsx
test('finds a developer tool by name under its sub-group', async () => {
  render(
    <MemoryRouter>
      <CommandPalette open onOpenChange={() => {}} />
    </MemoryRouter>,
  );
  await userEvent.type(screen.getByPlaceholderText(/what do you want to do/i), 'JWT');
  expect(screen.getByText(/JWT Decoder/i)).toBeInTheDocument();
  expect(screen.getByText('Encoders / Decoders')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npm test -- src/app/CommandPalette.test.tsx`
Expected: FAIL — `Unable to find an element with the text: /JWT Decoder/i` (the `dev` group still renders under the flat "Developer" heading with no sub-heading, and cmdk's fuzzy match may not even resolve "JWT" the same way once we know the fixture — the concrete failure text can vary, but the test fails against the current flat rendering either way).

- [ ] **Step 3: Implement**

`src/app/CommandPalette.tsx` — full new contents:

```tsx
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
```

Note the behavior change from the original: `GROUP_ORDER` categories (`pdf`/`image`/`ai`) no longer special-case excluding `privacy-center` (the original's `t.id !== 'privacy-center'` filter) — that exclusion is unnecessary now because `privacy-center`'s category is `'privacy'`, never `'pdf'`/`'image'`/`'ai'`/`'dev'`, so it was never matched by that filter in the first place. The privacy group is now unconditional (always renders `Command.Group heading="Privacy"` with whatever tools have `category === 'privacy'` — currently just `privacy-center`), matching the original's `if (!tools.length && cat !== 'privacy') return null` intent without the roundabout double-filter.

- [ ] **Step 4: Run test, verify it passes**

Run: `npm test -- src/app/CommandPalette.test.tsx` → Expected: PASS (both tests)

- [ ] **Step 5: Run typecheck and lint**

Run: `npm run typecheck` → clean
Run: `npm run lint` → clean

- [ ] **Step 6: Commit**

```bash
git add src/app/CommandPalette.tsx src/app/CommandPalette.test.tsx
git commit -m "feat(nav): sub-group Developer tools in the command palette"
```

---

## Task 4: Dashboard grouped sections + Privacy Center removal

**Files:**
- Modify: `src/components/dashboard/QuickActions.tsx`
- Modify: `src/routes/Dashboard.test.tsx`

**Interfaces:**
- Consumes: `DEV_GROUP_ORDER`, `DEV_GROUPS`, `toolsInDevGroup` from `../../tools/devGroups` (Task 1); `toolsByCategory` from `../../tools/registry`; existing `ToolCard`.
- Produces: no new exports — internal render change only.

- [ ] **Step 1: Update the existing per-tool test to exclude Privacy Center, and add the absence test**

`src/routes/Dashboard.test.tsx` — replace the `for (const t of TOOLS)` loop with a filtered one, and add a new test:

```tsx
test('a routing card for every tool except Privacy Center', () => {
  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>,
  );
  for (const t of TOOLS.filter((t) => t.id !== 'privacy-center')) {
    const links = screen.getAllByRole('link', { name: new RegExp(t.name, 'i') });
    expect(links.some((l) => l.getAttribute('href') === t.route)).toBe(true);
  }
});
test('Privacy Center is not on the dashboard', () => {
  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>,
  );
  expect(screen.queryByRole('link', { name: /privacy center/i })).toBeNull();
});
```

(Replace the whole `test('a routing card for every tool', ...)` block with the renamed-and-filtered version above — same test, filtered loop, new name so intent is clear.)

- [ ] **Step 2: Run tests, verify they fail as expected**

Run: `npm test -- src/routes/Dashboard.test.tsx`
Expected: the renamed test PASSES already (filtering doesn't change current behavior — `privacy-center` still renders today, so its link is simply skipped by the filter, not asserted against). The new "is not on the dashboard" test FAILS: `expect(received).toBeNull()` — `privacy-center`'s card link is currently found.

- [ ] **Step 3: Implement**

`src/components/dashboard/QuickActions.tsx` — full new contents:

```tsx
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
```

`privacy-center` (`category: 'privacy'`) is never referenced by `toolsByCategory('pdf')`, the `image`/`ai` merge, or `toolsInDevGroup` — it is structurally excluded, not filtered out after the fact.

- [ ] **Step 4: Run tests, verify they pass**

Run: `npm test -- src/routes/Dashboard.test.tsx` → Expected: PASS (both tests)

- [ ] **Step 5: Full checkpoint**

```bash
npm run typecheck
npm run lint
npm test
npm run build
```
All clean. `npm test` covers `devGroups.test.ts`, `registry.test.ts`, `Sidebar.test.tsx`, `CommandPalette.test.tsx`, `Dashboard.test.tsx`, plus the entire existing suite (must stay green — nothing else changed).

- [ ] **Step 6: Commit**

```bash
git add src/components/dashboard/QuickActions.tsx src/routes/Dashboard.test.tsx
git commit -m "feat(dashboard): grouped tool sections, drop Privacy Center card"
```

---

## Self-Review

**Spec coverage:**
- §3.1 `devGroups.ts` lookup → Task 1. ✓
- §3.2 registry invariant → Task 1, Step 5. ✓
- §3.3 Sidebar nested sub-groups, collapsed-sidebar behavior preserved → Task 2. ✓
- §3.4 CommandPalette sub-groups, fuzzy search unaffected → Task 3. ✓
- §3.5 Dashboard grouped sections, Privacy Center excluded, `ai` merged into Image → Task 4. ✓
- §2 out-of-scope items (MobileNav, ToolCard, favorites/recents, route paths) → untouched by every task; no task modifies `MobileNav.tsx`, `ToolCard.tsx`, `useFavorites.ts`, or any `/dev/*` route. ✓
- §6 testing table → `devGroups.test.ts` (Task 1), `registry.test.ts` invariant (Task 1), Sidebar sub-heading assertion (Task 2), CommandPalette dev-tool-found assertion (Task 3), Dashboard Privacy-Center-absent + filtered per-tool test (Task 4). ✓

**Placeholder scan:** None found — every step shows complete file contents or exact diffs.

**Type consistency:** `DevGroup`, `DEV_GROUP_ORDER`, `DEV_GROUPS`, `toolsInDevGroup` signatures identical across Tasks 1–4. `Tool` type imported consistently from `../tools/registry` (Sidebar, CommandPalette) and `../../tools/registry` (QuickActions, correct relative depth). `GroupItems`/`GroupLabel`/`SubGroupLabel` are each defined once, in the file that uses them — no cross-file duplication introduced.
