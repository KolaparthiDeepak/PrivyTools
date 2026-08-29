import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main role="main" className="grid min-h-[60vh] place-items-center p-8 text-center">
      <div className="flex flex-col items-center gap-3">
        <p className="font-mono text-xs uppercase tracking-widest text-dim">404</p>
        <h1 className="text-2xl font-semibold">We can't find that page.</h1>
        <Link to="/" className="text-sm text-accent underline">
          Back to the dashboard
        </Link>
      </div>
    </main>
  );
}
