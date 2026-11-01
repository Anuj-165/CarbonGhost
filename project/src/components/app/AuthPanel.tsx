import { useState, type FormEvent } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import CarbonGhostLogo from '@/components/brand/CarbonGhostLogo';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

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
    if (!isSupabaseConfigured) return;
    setPending(true);
    setError(null);
    setNotice(null);

    const credentials = { email: email.trim(), password };
    const result = signUp
      ? await supabase.auth.signUp(credentials)
      : await supabase.auth.signInWithPassword(credentials);

    setPending(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    if (signUp && !result.data.session) {
      setNotice('Account created. Sign in with your email and password.');
      setMode('sign-in');
    }
  };

  const inputClass =
    'h-11 w-full border-b border-graphite bg-transparent text-[15px] text-paper transition-colors duration-300 placeholder:text-sage/60 focus:border-chartreuse focus:outline-none focus-visible:ring-1 focus-visible:ring-chartreuse disabled:opacity-50';

  return (
    <div className="flex min-h-screen flex-col bg-ink font-sans text-paper">
      <header className="flex h-16 items-center px-6 lg:px-10">
        <a href="#top" aria-label="CarbonGhost website" className="rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-chartreuse">
          <CarbonGhostLogo />
        </a>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 pb-16">
        <div className="w-full max-w-sm">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-sage">Workbench access</p>
          <h1 className="mt-4 font-display text-[clamp(2.5rem,5vw,3.25rem)] leading-[1.02] tracking-[-0.02em]">
            {signUp ? 'Create your account' : 'Sign in'}
          </h1>
          <p className="mt-4 text-[14px] leading-[1.6] text-sage">
            Saved comparisons are private to your account and stored in your project database.
          </p>

          {!isSupabaseConfigured && (
            <p role="alert" className="mt-8 border-l-2 border-chartreuse pl-3 text-[13px] text-paper">
              Sign-in is unavailable because the database connection is not configured.
            </p>
          )}

          <form onSubmit={submit} className="mt-10 flex flex-col gap-7" aria-label={signUp ? 'Create account' : 'Sign in'}>
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-sage">Email</span>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                disabled={pending || !isSupabaseConfigured}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-sage">Password</span>
              <input
                type="password"
                autoComplete={signUp ? 'new-password' : 'current-password'}
                required
                minLength={6}
                value={password}
                disabled={pending || !isSupabaseConfigured}
                onChange={(event) => setPassword(event.target.value)}
                className={inputClass}
              />
            </label>

            {error && (
              <p role="alert" className="border-l-2 border-chartreuse pl-3 text-[13px] text-paper">
                {error}
              </p>
            )}
            {notice && <p role="status" className="text-[13px] text-chartreuse">{notice}</p>}

            <button
              type="submit"
              disabled={pending || !isSupabaseConfigured}
              className="group flex h-12 items-center justify-between bg-chartreuse px-5 text-[14px] font-medium text-ink transition-[transform,opacity] duration-300 hover:-translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chartreuse disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? 'Working' : signUp ? 'Create account' : 'Sign in'}
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
              )}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setMode(signUp ? 'sign-in' : 'sign-up');
              setError(null);
              setNotice(null);
            }}
            className="mt-8 font-mono text-[12px] text-sage transition-colors duration-300 hover:text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-chartreuse"
          >
            {signUp ? 'Already have an account? Sign in' : 'New here? Create an account'}
          </button>
        </div>
      </main>
    </div>
  );
}
