import { Hero } from '../components/dashboard/Hero';
import { QuickActions } from '../components/dashboard/QuickActions';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 font-mono text-xs uppercase tracking-widest text-dim">{children}</h2>
  );
}

export default function Dashboard() {
  return (
    <main role="main" className="mx-auto flex max-w-5xl flex-col gap-12 p-6 sm:p-10">
      <Hero />
      <section>
        <SectionLabel>Quick actions</SectionLabel>
        <QuickActions />
      </section>
    </main>
  );
}
