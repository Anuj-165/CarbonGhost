
import { useState, type FormEvent } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import CarbonGhostLogo from '@/components/brand/CarbonGhostLogo';

type Mode = 'sign-in' | 'sign-up';

export default function AuthPanel() {
  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const signUp = mode === 'sign-up';

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError(null);
    setNotice(null);
    setPending(true);

    // Authentication integration will be added later.
    await new Promise((resolve) => setTimeout(resolve, 500));

    setPending(false);

    setNotice(
      signUp
        ? 'Your details are ready. Authentication will be available soon.'
        : 'Authentication is not connected yet. Please check back soon.'
    );
  };

  const inputClass =
    'h-11 w-full border-b border-graphite bg-transparent text-[15px] text-paper transition-colors duration-300 placeholder:text-sage/60 focus:border-chartreuse focus:outline-none focus-visible:ring-1 focus-visible:ring-chartreuse disabled:opacity-50';

  return (
    <div className="flex min-h-screen flex-col bg-ink font-sans text-paper">
      <header className="flex h-16 items-center px-6 lg:px-10">
        <a
          href="#top"
          aria-label="CarbonGhost website"
          className="rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-chartreuse"
        >
          <CarbonGhostLogo />
        </a>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 pb-16">
        <div className="w-full max-w-sm">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-sage">
            Workbench access
          </p>

          <h1 className="mt-4 font-display text-[clamp(2.5rem,5vw,3.25rem)] leading-[1.02] tracking-[-0.02em]">
            {signUp ? 'Create your account' : 'Sign in'}
          </h1>

          <p className="mt-4 text-[14px] leading-[1.6] text-sage">
            Save and manage your code comparisons in your personal workspace.
          </p>

          <p
            role="status"
            className="mt-8 border-l-2 border-chartreuse pl-3 text-[13px] text-paper"
          >
            Authentication is currently under development. Account access
            will be enabled soon.
          </p>

          <form
            onSubmit={submit}
            className="mt-10 flex flex-col gap-7"
            aria-label={signUp ? 'Create account' : 'Sign in'}
          >
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-sage">
                Email
              </span>

              <input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                value={email}
                disabled={pending}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-sage">
                Password
              </span>

              <input
                type="password"
                autoComplete={signUp ? 'new-password' : 'current-password'}
                placeholder="Enter your password"
                required
                minLength={6}
                value={password}
                disabled={pending}
                onChange={(event) => setPassword(event.target.value)}
                className={inputClass}
              />
            </label>

            {error && (
              <p
                role="alert"
                className="border-l-2 border-chartreuse pl-3 text-[13px] text-paper"
              >
                {error}
              </p>
            )}

            {notice && (
              <p role="status" className="text-[13px] text-chartreuse">
                {notice}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="group flex h-12 items-center justify-between bg-chartreuse px-5 text-[14px] font-medium text-ink transition-[transform,opacity] duration-300 hover:-translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chartreuse disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending
                ? 'Working'
                : signUp
                  ? 'Create account'
                  : 'Sign in'}

              {pending ? (
                <Loader2
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              )}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setMode(signUp ? 'sign-in' : 'sign-up');
              setError(null);
              setNotice(null);
              setPassword('');
            }}
            className="mt-8 font-mono text-[12px] text-sage transition-colors duration-300 hover:text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-chartreuse"
          >
            {signUp
              ? 'Already have an account? Sign in'
              : 'New here? Create an account'}
          </button>
        </div>
      </main>
    </div>
  );
}
