# PrivyTools — Home & Sidebar Navigation Polish

**Status:** Approved design
**Date:** 2026-09-15
**Builds on:** `2026-08-29-privytools-dashboard-design.md`, `2026-09-09-dev-tools-design.md`

## 1. Goal

The dev-tools suite (`2026-09-09-dev-tools-design.md`) grew the tool count from 8 to
23 without touching navigation or the dashboard. The Developer category now dumps 15
tools into one flat sidebar list, one flat `⌘K` group, and one flat 22-card dashboard
grid (23 minus Privacy Center, which this spec also removes from the grid). This spec
fixes that:

1. Sub-group the 15 Developer tools into 4 named groups, consistently, everywhere
   they're listed: sidebar, command palette, dashboard.
2. Remove the Privacy Center card from the dashboard grid (it stays reachable via the
   sidebar's Privacy item and the mobile nav's Privacy tab — both unchanged).
3. Reorganize the dashboard's tool grid into the same grouped-sections shape as the
   sidebar, instead of one flat grid.

No new tools, no registry schema change, no behavior change to any individual tool.

## 2. Scope

### In scope
- `src/tools/devGroups.ts` — new lookup mapping 4 group ids to a label + ordered tool-id list.
- `src/app/Sidebar.tsx` — Developer section renders 4 sub-headed groups instead of a flat list.
- `src/app/CommandPalette.tsx` — the 4 dev groups replace the single `dev` entry in `GROUP_ORDER`, each its own `Command.Group`.
- `src/components/dashboard/QuickActions.tsx` (and however it's decomposed) — sections: PDF, Image, Developer (with its 4 sub-groups nested inside), no Privacy section.
- `src/tools/registry.test.ts` — invariant: every `dev` tool id appears in exactly one `DEV_GROUPS` entry, no orphans, no duplicates.

### Out of scope
- `src/app/MobileNav.tsx` — bottom nav stays coarse (Home / PDF / Image / Privacy); no Developer tab, no sub-grouping. Out of scope for this pass.
- `ToolCard.tsx` — visual design of an individual card is unchanged.
- Any change to a tool's own route/page.
- Favorites/recents surfacing — not requested, not added.
- The `/dev/*` route paths, tool ids, icons — unchanged.

## 3. Architecture

### 3.1 `src/tools/devGroups.ts`

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

export const toolsInDevGroup = (g: DevGroup): Tool[] =>
  DEV_GROUPS[g].toolIds.map(getTool).filter((t): t is Tool => t !== undefined);
```

This is the single source of truth for the grouping. Sidebar, CommandPalette, and
QuickActions all import from it — no surface defines its own copy of the mapping.

### 3.2 Registry invariant

`src/tools/registry.test.ts` gets one new test:

```ts
test('every dev tool belongs to exactly one DEV_GROUPS entry', () => {
  const devIds = TOOLS.filter((t) => t.category === 'dev').map((t) => t.id);
  const grouped = DEV_GROUP_ORDER.flatMap((g) => DEV_GROUPS[g].toolIds);
  expect(new Set(grouped).size).toBe(grouped.length); // no duplicates across groups
  expect(grouped.sort()).toEqual(devIds.sort());       // exact match, no orphans
});
```

This is the guardrail that keeps the map honest — add a 16th dev tool without adding
its id to `DEV_GROUPS`, and this test fails immediately.

### 3.3 Sidebar

`Sidebar.tsx`'s `NAV_SECTIONS` array currently assumes one flat `tools()` list per
section. The Developer entry is replaced with an explicit two-level render (not
folded into the generic `NAV_SECTIONS` shape, since it's the only section that
nests):

```
DEVELOPER                        <- existing section-header style
  Converters                     <- new sub-header: smaller, dimmer, indented one more step
    JSON Formatter
    JSON ⇄ YAML
    JSON ⇄ CSV
    JSON → TypeScript
    Query String ⇄ JSON
  Encoders / Decoders
    Base64
    URL Encode
    HTML Entities
    JWT Decoder
  Text Utilities
    Case Converter
    Slugify
    Sort / Dedupe Lines
    Text Diff
  Date & Schedule
    Timestamp Converter
    Cron Explainer
```

- PDF and Image sections are untouched — same `NAV_SECTIONS`-driven flat render as today.
- Collapsed sidebar: sub-headings hide the same way top-level headings already do
  today (`!collapsed &&`); only icons show, exactly current collapsed behavior for
  every other section.
- `Item` component (icon + label + `NavLink`) is reused unchanged for dev tools.
- Existing `favorites` section (unchanged) still lists any favorited dev tool by id,
  regardless of group — favoriting isn't group-aware, which is correct (it's a
  cross-cutting shortcut list).

### 3.4 CommandPalette

`GROUP_ORDER: Category[]` currently is `['pdf', 'image', 'ai', 'dev', 'privacy']`.
The `dev` entry is removed from this list. Instead, immediately after the existing
`ai` group and before `privacy`, four additional `Command.Group`s render — one per
`DEV_GROUP_ORDER` entry, heading = the group's `label`, items = `toolsInDevGroup(g)`.
This is a small, explicit addition to the render function (not a generic "some
categories have sub-groups" abstraction — one category needing this is not worth
generalizing the type).

Fuzzy search (`Command.Input`) is unaffected — it already filters `Command.Item`s
by their `value` regardless of which group renders them; splitting one group into
four changes only the headings shown above matching results.

### 3.5 Dashboard `QuickActions`

Current `QuickActions.tsx` maps every `Tool` into one flat grid. Replaced with
grouped sections, same visual language as the existing `Dashboard.tsx`
`SectionLabel` (`font-mono text-xs uppercase tracking-widest text-dim`):

```
QUICK ACTIONS
  PDF                                    <- SectionLabel
    [card] [card] [card] [card]          <- existing grid, same ToolCard
  IMAGE
    [card] [card] [card]
  DEVELOPER
    Converters                            <- smaller sub-label, same style as sidebar's
      [card] [card] [card] [card] [card]
    Encoders / Decoders
      [card] [card] [card] [card]
    Text Utilities
      [card] [card] [card] [card]
    Date & Schedule
      [card] [card]
```

- `privacy-center` is filtered out entirely — no Privacy section, no Privacy card,
  anywhere on the dashboard.
- `ToolCard` is unchanged; only the container/grouping around it changes.
- `ai` category (currently merged into "Image" wherever it's grouped, per Sidebar's
  existing `[...toolsByCategory('image'), ...toolsByCategory('ai')]` pattern) follows
  the same convention here — merged into the Image section, not its own section,
  since there's currently no `ai` tool live to test against and Sidebar already
  treats it this way.
- `Dashboard.tsx`'s outer `SectionLabel` ("Quick actions") stays as the one
  top-level heading; PDF/Image/Developer become sub-sections beneath it, matching
  how the sidebar nests groups beneath "Developer" rather than introducing a new
  heading level pattern.

## 4. Data flow

No new state, no new store, no new persistence. `DEV_GROUPS`/`DEV_GROUP_ORDER` are
static, imported wherever needed. Existing `usePrefs` (favorites, sidebar-collapsed)
and `useFavorites` are unaffected.

## 5. Error handling

None needed — this is static navigation/layout data with a compile-time-checked
shape (`Record<DevGroup, …>` — TypeScript itself rejects a missing or misspelled
group key) plus the runtime registry-invariant test for tool-id drift.

## 6. Testing

| Layer | Test |
|---|---|
| `devGroups.ts` invariant | Registry test above — every `dev` tool in exactly one group. |
| `Sidebar.test.tsx` | Existing "a link for every tool" test (iterates all `TOOLS`) continues to pass unchanged — it doesn't care about grouping, only that every tool has a link. Add one assertion that a sub-heading (e.g. "Converters") renders as text when the sidebar isn't collapsed. |
| `CommandPalette.test.tsx` | Existing filter-by-query test unaffected. Add one test: searching a dev-tool name (e.g. "JWT") still surfaces it, now under its subgroup heading — assert the tool item renders (heading text is secondary, not the assertion's point). |
| `Dashboard.test.tsx` | Add: "Privacy Center" card is absent from the dashboard. Add: a known dev tool (e.g. "JSON Formatter") and a known PDF tool (e.g. "Merge PDF") both still render as cards. |
| `registry.test.ts` | The new grouping-invariant test (§3.2). |

No new component files need their own test file — the changes live inside
`Sidebar.tsx`, `CommandPalette.tsx`, and `QuickActions.tsx`, exercised by their
existing test files plus the additions above.

## 7. Open questions

None blocking. Sub-heading visual treatment (font size, indent, color) is an
implementation-time choice — match the sidebar's existing top-level `SectionLabel`
pattern one step down in visual weight.
