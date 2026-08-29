export function Hero() {
  return (
    <div className="flex flex-col gap-4">
      <h1
        className="text-4xl font-semibold leading-[1.04] text-text sm:text-5xl"
        style={{ letterSpacing: 'var(--tracking-display)' }}
      >
        Your files.
        <br />
        Your device.
        <br />
        <span className="text-dim/60">Your privacy.</span>
      </h1>
      <p className="max-w-md text-sm text-dim">
        Everything you need to work with PDFs and images - processed locally whenever possible.
      </p>
    </div>
  );
}
