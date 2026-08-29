import { getTool } from '../tools/registry';
import { useRecent } from '../hooks/useRecent';
import { Hero } from '../components/dashboard/Hero';
import { QuickActions } from '../components/dashboard/QuickActions';
import { ToolCard } from '../components/dashboard/ToolCard';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 font-mono text-xs uppercase tracking-widest text-dim">{children}</h2>
  );
}

export default function Dashboard() {
  const { recent } = useRecent();
  const recentTools = recent.map((id) => getTool(id)).filter((t): t is NonNullable<typeof t> => Boolean(t));

  return (
    <main role="main" className="mx-auto flex max-w-5xl flex-col gap-12 p-6 sm:p-10">
      <Hero />
      <section>
        <SectionLabel>Quick actions</SectionLabel>
        <QuickActions />
      </section>
      {recentTools.length > 0 && (
        <section>
          <SectionLabel>Recent</SectionLabel>
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {recentTools.map((t) => (
              <ToolCard key={t.id} tool={t} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
