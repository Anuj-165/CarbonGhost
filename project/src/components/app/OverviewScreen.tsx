import { ArrowRight } from 'lucide-react';
import { appHash } from '@/lib/useRoute';
import { formatMs } from '@/lib/benchmark/stats';
import { useSavedRuns } from '@/components/app/HistoryScreen';

export default function OverviewScreen() {
  const state = useSavedRuns();

  return (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-12 px-5 py-10 lg:px-8 lg:py-14">
      <section className="flex flex-col gap-6 border-b border-graphite pb-12 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-sage">Overview</p>
          <h2 className="mt-4 font-display text-[clamp(2.5rem,5vw,4rem)] leading-[1.02] tracking-[-0.02em] text-paper">
            Measure a change before you keep it.
          </h2>
          <p className="mt-5 max-w-lg text-[15px] leading-[1.6] text-sage">
            Compare two implementations on the same generated input, check their outputs match, and see the timing with its
            spread and a modeled energy estimate.
          </p>
        </div>
        <a
          href={appHash('workbench')}
          className="group flex h-12 shrink-0 items-center gap-3 bg-chartreuse px-6 text-[14px] font-medium text-ink transition-[transform,opacity] duration-300 hover:-translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chartreuse"
        >
          New comparison
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
        </a>
      </section>

      <section aria-label="Scientific notes" className="grid gap-6 md:grid-cols-3">
        <Note title="Correctness first">Timing starts only after both implementations return identical results.</Note>
        <Note title="Spread, not a single number">Medians are reported with variability and the individual repetitions.</Note>
        <Note title="Estimates are labelled">Energy and CO2e use an assumed power draw and grid intensity, and are marked as modeled.</Note>
      </section>

      <section aria-label="Latest saved run" className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.16em] text-sage">Latest saved run</h3>
          <a href={appHash('history')} className="font-mono text-[12px] text-sage transition-colors duration-300 hover:text-paper">
            All history
          </a>
        </div>
        {state.status === 'loading' && <p className="text-[14px] text-sage">Loading</p>}
        {state.status === 'error' && <p role="alert" className="text-[14px] text-paper">{state.message}</p>}
        {state.status === 'ready' && state.runs.length === 0 && (
          <p className="text-[14px] leading-[1.6] text-sage">No saved runs yet. Your first completed comparison will appear here.</p>
        )}
        {state.status === 'ready' && state.runs[0] && (
          <a
            href={appHash('history', state.runs[0].id)}
            className="group grid gap-4 border-y border-graphite py-6 transition-colors duration-300 hover:bg-paper/[0.02] md:grid-cols-[1fr_auto_auto] md:items-center md:gap-12 focus-visible:outline focus-visible:outline-2 focus-visible:outline-chartreuse"
          >
            <div>
              <p className="text-[17px] text-paper group-hover:text-chartreuse">{state.runs[0].name}</p>
              <p className="mt-1 font-mono text-[11px] text-sage">{new Date(state.runs[0].createdAt).toLocaleString()}</p>
            </div>
            <p className="font-mono text-[13px] tabular-nums text-sage">
              Baseline <span className="text-paper">{state.runs[0].baselineMedianMs === null ? 'n/a' : formatMs(state.runs[0].baselineMedianMs)}</span>
            </p>
            <p className="font-mono text-[13px] tabular-nums text-sage">
              Candidate <span className="text-paper">{state.runs[0].candidateMedianMs === null ? 'n/a' : formatMs(state.runs[0].candidateMedianMs)}</span>
            </p>
          </a>
        )}
      </section>
    </div>
  );
}

function Note({ title, children }: { title: string; children: string }) {
  return (
    <div className="border-t border-chartreuse/60 pt-5">
      <h4 className="text-[14px] font-medium text-paper">{title}</h4>
      <p className="mt-2 text-[13px] leading-[1.6] text-sage">{children}</p>
    </div>
  );
}
