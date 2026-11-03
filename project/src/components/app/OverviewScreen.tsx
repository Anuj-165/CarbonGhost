
import { ArrowRight, Activity, Clock3, Zap, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { appHash } from '@/lib/useRoute';
import { formatMs } from '@/lib/benchmark/stats';
import { useSavedRuns } from '@/components/app/HistoryScreen';

export default function OverviewScreen() {
  const state = useSavedRuns();

  const runs = state.status === 'ready' ? state.runs : [];

  const today = new Date().toDateString();

  const todayRuns = runs.filter(
    (run) => new Date(run.createdAt).toDateString() === today
  ).length;

  const latest = runs[0];

  const improvement = latest &&
    latest.baselineMedianMs !== null &&
    latest.candidateMedianMs !== null &&
    latest.baselineMedianMs > 0
      ? ((latest.baselineMedianMs - latest.candidateMedianMs) /
          latest.baselineMedianMs) * 100
      : null;

  const faster =
    improvement === null ? null : improvement > 0;

  const recentRuns = runs.slice(0, 12);

  return (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-12 px-5 py-10 lg:px-8 lg:py-14">

      {/* HERO */}
      <section className="flex flex-col gap-6 border-b border-graphite pb-12 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-sage">
            Overview
          </p>

          <h2 className="mt-4 font-display text-[clamp(2.5rem,5vw,4rem)] leading-[1.02] tracking-[-0.02em] text-paper">
            Measure a change before you keep it.
          </h2>

          <p className="mt-5 max-w-lg text-[15px] leading-[1.6] text-sage">
            Compare two implementations on the same generated input,
            check their outputs match, and see the timing with its
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

      {/* SCIENTIFIC NOTES */}
      <section aria-label="Scientific notes" className="grid gap-6 md:grid-cols-3">
        <Note title="Correctness first">
          Timing starts only after both implementations return identical results.
        </Note>

        <Note title="Spread, not a single number">
          Medians are reported with variability and the individual repetitions.
        </Note>

        <Note title="Estimates are labelled">
          Energy and CO2e use an assumed power draw and grid intensity, and are marked as modeled.
        </Note>
      </section>

      {/* STATISTICS */}
      <section aria-label="Benchmark statistics" className="grid gap-4 sm:grid-cols-3">

        <StatCard
          label="Total comparisons"
          value={state.status === 'loading' ? '—' : state.status === 'error' ? '—' : runs.length.toString()}
          description="Saved benchmark runs"
          icon={<Activity className="h-4 w-4" />}
        />

        <StatCard
          label="Today's activity"
          value={state.status === 'ready' ? todayRuns.toString() : '—'}
          description="Comparisons completed today"
          icon={<Clock3 className="h-4 w-4" />}
        />

        <StatCard
          label="Latest improvement"
          value={
            improvement === null
              ? '—'
              : `${Math.abs(improvement).toFixed(1)}%`
          }
          description={
            improvement === null
              ? 'Waiting for a comparable run'
              : faster
                ? 'Candidate is faster'
                : improvement < 0
                  ? 'Baseline is faster'
                  : 'Equal performance'
          }
          icon={
            improvement === null
              ? <Minus className="h-4 w-4" />
              : faster
                ? <TrendingDown className="h-4 w-4" />
                : <TrendingUp className="h-4 w-4" />
          }
        />

      </section>

      {/* ACTIVITY + LATEST RESULT */}
      <section className="grid gap-10 lg:grid-cols-[1fr_1fr]">

        {/* RECENT ACTIVITY */}
        <div className="flex min-w-0 flex-col gap-5">

          <div className="flex items-center justify-between">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.16em] text-sage">
              Recent activity
            </h3>

            <span className="font-mono text-[10px] text-sage">
              LAST 12 RUNS
            </span>
          </div>

          <div className="border-y border-graphite py-6">

            {state.status === 'loading' && (
              <p className="text-[13px] text-sage">Loading activity...</p>
            )}

            {state.status === 'error' && (
              <p role="alert" className="text-[13px] text-paper">
                {state.message}
              </p>
            )}

            {state.status === 'ready' && recentRuns.length === 0 && (
              <div className="flex flex-col gap-3 py-5">
                <Activity className="h-6 w-6 text-chartreuse" />

                <p className="text-[15px] text-paper">
                  Your benchmark activity starts here.
                </p>

                <p className="max-w-xs text-[13px] leading-[1.6] text-sage">
                  Run your first comparison to start building a record
                  of performance experiments.
                </p>

                <a
                  href={appHash('workbench')}
                  className="mt-2 inline-flex w-fit items-center gap-2 text-[12px] text-chartreuse hover:text-paper"
                >
                  Start experimenting
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            )}

            {state.status === 'ready' && recentRuns.length > 0 && (
              <div className="flex flex-col gap-5">

                {recentRuns.map((run) => {
                  const hasBoth =
                    run.baselineMedianMs !== null &&
                    run.candidateMedianMs !== null;

                  const candidateFaster =
                    hasBoth &&
                    run.candidateMedianMs! < run.baselineMedianMs!;

                  return (
                    <a
                      key={run.id}
                      href={appHash('history', run.id)}
                      className="group flex items-center gap-4"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-graphite text-sage transition-colors group-hover:border-chartreuse group-hover:text-chartreuse">
                        <Activity className="h-4 w-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] text-paper transition-colors group-hover:text-chartreuse">
                          {run.name}
                        </p>

                        <p className="mt-1 font-mono text-[10px] text-sage">
                          {new Date(run.createdAt).toLocaleDateString()}
                          {' · '}
                          {run.inputSize.toLocaleString()} records
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="font-mono text-[11px] tabular-nums text-paper">
                          {hasBoth
                            ? formatMs(run.candidateMedianMs!)
                            : 'n/a'}
                        </p>

                        <p className="mt-1 font-mono text-[9px] text-sage">
                          {hasBoth
                            ? candidateFaster
                              ? 'CANDIDATE FASTER'
                              : run.candidateMedianMs === run.baselineMedianMs
                                ? 'EQUAL'
                                : 'BASELINE FASTER'
                            : 'INCOMPLETE'}
                        </p>
                      </div>
                    </a>
                  );
                })}

              </div>
            )}

          </div>

          {runs.length > 0 && (
            <a
              href={appHash('history')}
              className="flex items-center gap-2 font-mono text-[11px] text-sage transition-colors hover:text-chartreuse"
            >
              View all experiments
              <ArrowRight className="h-3 w-3" />
            </a>
          )}

        </div>

        {/* LATEST RESULT */}
        <div className="flex min-w-0 flex-col gap-5">

          <div className="flex items-center justify-between">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.16em] text-sage">
              Latest saved run
            </h3>

            <span className="font-mono text-[10px] text-sage">
              {latest ? 'MOST RECENT' : 'NO DATA'}
            </span>
          </div>

          {state.status === 'loading' && (
            <p className="border-y border-graphite py-6 text-[13px] text-sage">
              Loading latest result...
            </p>
          )}

          {state.status === 'error' && (
            <p role="alert" className="border-y border-graphite py-6 text-[13px] text-paper">
              {state.message}
            </p>
          )}

          {state.status === 'ready' && !latest && (
            <div className="flex flex-1 flex-col justify-center border-y border-graphite py-8">
              <Zap className="mb-4 h-6 w-6 text-chartreuse" />

              <p className="text-[16px] text-paper">
                No experiments recorded yet.
              </p>

              <p className="mt-2 max-w-xs text-[13px] leading-[1.6] text-sage">
                Your first completed and saved benchmark will appear here
                with its performance comparison.
              </p>
            </div>
          )}

          {state.status === 'ready' && latest && (
            <a
              href={appHash('history', latest.id)}
              className="group flex flex-1 flex-col justify-between border-y border-graphite py-6 transition-colors duration-300 hover:bg-paper/[0.02]"
            >

              <div>
                <p className="text-[17px] text-paper transition-colors group-hover:text-chartreuse">
                  {latest.name}
                </p>

                <p className="mt-2 font-mono text-[10px] text-sage">
                  {new Date(latest.createdAt).toLocaleString()}
                </p>

                <div className="mt-7 grid grid-cols-2 gap-5">

                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-sage">
                      Baseline
                    </p>

                    <p className="mt-2 font-display text-[clamp(1.4rem,3vw,2rem)] text-paper tabular-nums">
                      {latest.baselineMedianMs === null
                        ? 'n/a'
                        : formatMs(latest.baselineMedianMs)}
                    </p>
                  </div>

                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-sage">
                      Candidate
                    </p>

                    <p className="mt-2 font-display text-[clamp(1.4rem,3vw,2rem)] text-paper tabular-nums">
                      {latest.candidateMedianMs === null
                        ? 'n/a'
                        : formatMs(latest.candidateMedianMs)}
                    </p>
                  </div>

                </div>
              </div>

              <div className="mt-7 flex items-center justify-between border-t border-graphite pt-5">

                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-sage">
                    Performance difference
                  </p>

                  <p className="mt-2 text-[13px] text-chartreuse">
                    {improvement === null
                      ? 'Not available'
                      : improvement > 0
                        ? `${improvement.toFixed(2)}% faster`
                        : improvement < 0
                          ? `${Math.abs(improvement).toFixed(2)}% slower`
                          : 'No difference'}
                  </p>
                </div>

                <ArrowRight className="h-4 w-4 text-sage transition-transform group-hover:translate-x-1 group-hover:text-chartreuse" />
              </div>

            </a>
          )}

        </div>

      </section>

    </div>
  );
}

function StatCard({
  label,
  value,
  description,
  icon,
}: {
  label: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="border-t border-chartreuse/60 pt-5">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-sage">
          {label}
        </p>

        <span className="text-sage">{icon}</span>
      </div>

      <p className="mt-4 font-display text-3xl tabular-nums text-paper">
        {value}
      </p>

      <p className="mt-2 text-[12px] text-sage">
        {description}
      </p>
    </div>
  );
}

function Note({
  title,
  children,
}: {
  title: string;
  children: string;
}) {
  return (
    <div className="border-t border-chartreuse/60 pt-5">
      <h4 className="text-[14px] font-medium text-paper">
        {title}
      </h4>

      <p className="mt-2 text-[13px] leading-[1.6] text-sage">
        {children}
      </p>
    </div>
  );
}
