import { PrivateIndicator } from '../components/privacy/PrivateIndicator';
import { PrivacyBoard } from '../components/privacy/PrivacyBoard';

export default function Privacy() {
  return (
    <main role="main" className="mx-auto flex max-w-2xl flex-col gap-10 p-6 sm:p-10">
      <div className="flex flex-col gap-3" data-accent="privacy">
        <h1
          className="text-3xl font-semibold text-text sm:text-4xl"
          style={{ letterSpacing: 'var(--tracking-display)' }}
        >
          Your privacy, by design.
        </h1>
        <p className="text-sm text-dim">
          What happens to a file when you use PrivyTools - stated plainly, tool by tool.
        </p>
      </div>
      <PrivateIndicator />
      <PrivacyBoard />
    </main>
  );
}
