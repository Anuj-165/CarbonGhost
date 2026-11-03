
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  Check,
  Clock3,
  Download,
  FlaskConical,
  Layers3,
  Leaf,
  MemoryStick,
  Printer,
  Timer,
  TrendingUp,
  Zap,
} from 'lucide-react';

import { HistoryFilters } from '@/components/app/HistoryFilters';
import ResultsView from '@/components/app/ResultsView';
import RunReport from '@/components/app/RunReport';

import { appHash } from '@/lib/useRoute';

import {
  listRuns,
  type StoredOutcome,
  type StoredRun,
} from '@/lib/runs/runRepository';

import { formatMs } from '@/lib/benchmark/stats';
import { MODE_COPY } from '@/lib/benchmark/examples';

import {
  buildRunCsv,
  downloadFile,
  reportFilename,
} from '@/lib/reports/runReport';

import {
  EMPTY_FILTERS,
  filterRuns,
  inputSizeOptions,
  type RunFilters,
} from '@/lib/runs/filterRuns';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; runs: StoredRun[] };

export function useSavedRuns() {
  const [state, setState] = useState<LoadState>({
    status: 'loading',
  });

  useEffect(() => {
    let active = true;

    listRuns()
      .then((runs) => {
        if (active) {
          setState({ status: 'ready', runs });
        }
      })
      .catch((error: Error) => {
        if (active) {
          setState({
            status: 'error',
            message: error.message,
          });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return state;
}

export function HistoryScreen({
  runId,
  onReproduce,
}: {
  runId: string | null;
  onReproduce: (stored: StoredOutcome) => void;
}) {
  const state = useSavedRuns();

  const [filters, setFilters] = useState<RunFilters>(
    EMPTY_FILTERS
  );

  const statistics = useMemo(() => {
    if (state.status !== 'ready') return null;

    const runs = state.runs;

    const isolated = runs.filter(
      (run) => run.mode === 'isolated'
    ).length;

    const endToEnd = runs.filter(
      (run) => run.mode === 'end-to-end'
    ).length;

    const comparable = runs.filter(
      (run) =>
        run.baselineMedianMs !== null &&
        run.candidateMedianMs !== null &&
        run.baselineMedianMs > 0
    );

    const faster = comparable.filter(
      (run) =>
        run.candidateMedianMs! < run.baselineMedianMs!
    ).length;

    const slower = comparable.filter(
      (run) =>
        run.candidateMedianMs! > run.baselineMedianMs!
    ).length;

    return {
      total: runs.length,
      isolated,
      endToEnd,
      comparable: comparable.length,
      faster,
      slower,
    };
  }, [state]);

  if (state.status === 'loading') {
    return <Message>Loading saved experiments...</Message>;
  }

  if (state.status === 'error') {
    return (
      <Message tone="alert">
        Saved runs could not be loaded: {state.message}
      </Message>
    );
  }

  if (runId) {
    const run = state.runs.find(
      (item) => item.id === runId
    );

    if (!run) {
      return (
        <Message tone="alert">
          This saved run was not found.
        </Message>
      );
    }

    return (
      <ResultsView
        stored={run.outcome}
        onReproduce={() => onReproduce(run.outcome)}
        headerAction={
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={appHash('history')}
              className="flex h-10 items-center border border-graphite px-4 text-[13px] text-paper transition-colors duration-300 hover:border-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-chartreuse"
            >
              Back to history
            </a>

            <ExportActions run={run} />
          </div>
        }
      />
    );
  }

  const visibleRuns = filterRuns(state.runs, filters);
  const hasRuns = state.runs.length > 0;

  return (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-10 px-5 py-10 lg:px-8 lg:py-14">

      {/* HEADER */}
      <section className="flex flex-col gap-5 border-b border-graphite pb-10 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-sage">
            Experiment archive
          </p>

          <h2 className="mt-4 font-display text-[clamp(2.5rem,5vw,4rem)] leading-[1.02] tracking-[-0.02em] text-paper">
            Every experiment tells a story.
          </h2>

          <p className="mt-5 max-w-lg text-[15px] leading-[1.6] text-sage">
            Your saved benchmark experiments, performance comparisons
            and reproducible results. Track what changed and understand
            what actually improved.
          </p>
        </div>

        <a
          href={appHash('workbench')}
          className="group flex h-12 shrink-0 items-center gap-3 bg-chartreuse px-6 text-[14px] font-medium text-ink transition-[transform,opacity] duration-300 hover:-translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chartreuse"
        >
          New experiment
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </a>
      </section>

      {/* STATISTICS */}
      <section className="grid gap-6 border-b border-graphite pb-9 sm:grid-cols-2 lg:grid-cols-4">
        <HistoryStat
          label="Total experiments"
          value={statistics?.total.toString() ?? '0'}
          description="Saved comparisons"
          icon={<Layers3 className="h-4 w-4" />}
        />

        <HistoryStat
          label="Isolated runs"
          value={statistics?.isolated.toString() ?? '0'}
          description="Solve operation only"
          icon={<FlaskConical className="h-4 w-4" />}
        />

        <HistoryStat
          label="End-to-end runs"
          value={statistics?.endToEnd.toString() ?? '0'}
          description="Setup and execution"
          icon={<Activity className="h-4 w-4" />}
        />

        <HistoryStat
          label="Candidate wins"
          value={
            statistics && statistics.comparable > 0
              ? `${statistics.faster}/${statistics.comparable}`
              : '—'
          }
          description="Faster than baseline"
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </section>

      {/* PERFORMANCE SUMMARY */}
      {statistics && statistics.comparable > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.16em] text-sage">
              Performance overview
            </h3>

            <span className="font-mono text-[10px] text-sage">
              COMPARABLE RUNS
            </span>
          </div>

          <div className="flex h-2 overflow-hidden bg-graphite">
            <div
              className="bg-chartreuse transition-all duration-500"
              style={{
                width: `${(statistics.faster / statistics.comparable) * 100}%`,
              }}
            />

            <div
              className="bg-sage/50 transition-all duration-500"
              style={{
                width: `${
                  ((statistics.comparable -
                    statistics.faster -
                    statistics.slower) /
                    statistics.comparable) *
                  100
                }%`,
              }}
            />

            <div
              className="bg-paper/30 transition-all duration-500"
              style={{
                width: `${(statistics.slower / statistics.comparable) * 100}%`,
              }}
            />
          </div>

          <div className="flex flex-wrap gap-x-7 gap-y-2 font-mono text-[10px] text-sage">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 bg-chartreuse" />
              Candidate faster · {statistics.faster}
            </span>

            <span className="flex items-center gap-2">
              <span className="h-2 w-2 bg-sage/50" />
              Equal · {statistics.comparable -
                statistics.faster -
                statistics.slower}
            </span>

            <span className="flex items-center gap-2">
              <span className="h-2 w-2 bg-paper/30" />
              Baseline faster · {statistics.slower}
            </span>
          </div>
        </section>
      )}

      {/* EMPTY STATE */}
      {!hasRuns && (
        <EmptyHistory />
      )}

      {/* HISTORY LIST */}
      {hasRuns && (
        <section className="flex flex-col gap-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-mono text-[10px] uppercase tracking-[0.16em] text-sage">
                Saved experiments
              </h3>

              <p className="mt-2 text-[13px] text-sage">
                Browse, filter and revisit your previous benchmarks.
              </p>
            </div>

            <span className="font-mono text-[10px] text-sage">
              {state.runs.length.toString().padStart(2, '0')} TOTAL RECORDS
            </span>
          </div>

          <HistoryFilters
            filters={filters}
            sizes={inputSizeOptions(state.runs)}
            onChange={setFilters}
          />

          <div className="flex items-center justify-between border-b border-graphite pb-4">
            <p
              className="font-mono text-[10px] uppercase tracking-[0.12em] text-sage"
              aria-live="polite"
            >
              Showing {visibleRuns.length} of {state.runs.length} experiments
            </p>

            {visibleRuns.length > 0 && (
              <span className="font-mono text-[10px] text-sage">
                NEWEST FIRST
              </span>
            )}
          </div>

          {visibleRuns.length === 0 && (
            <div className="flex flex-col items-start gap-4 border-y border-graphite py-10">
              <p className="text-[15px] text-paper">
                No experiments match these filters.
              </p>

              <p className="text-[13px] text-sage">
                Try changing your search or clearing the active filters.
              </p>

              <button
                type="button"
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="flex h-10 items-center border border-graphite px-4 text-[13px] text-paper transition-colors duration-300 hover:border-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-chartreuse"
              >
                Clear filters
              </button>
            </div>
          )}

          {visibleRuns.length > 0 && (
            <ul className="divide-y divide-graphite border-y border-graphite">
              {visibleRuns.map((run) => {
                const hasBoth =
                  run.baselineMedianMs !== null &&
                  run.candidateMedianMs !== null;

                const improvement =
                  hasBoth && run.baselineMedianMs! > 0
                    ? ((run.baselineMedianMs! -
                        run.candidateMedianMs!) /
                        run.baselineMedianMs!) *
                      100
                    : null;

                const candidateFaster =
                  improvement !== null && improvement > 0;

                return (
                  <li key={run.id}>
                    <a
                      href={appHash('history', run.id)}
                      className="group grid gap-5 py-6 transition-colors duration-300 hover:bg-paper/[0.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-chartreuse lg:grid-cols-[minmax(0,1fr)_auto_auto_auto] lg:items-center lg:gap-8"
                    >
                      {/* EXPERIMENT DETAILS */}
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-graphite text-sage transition-colors group-hover:border-chartreuse group-hover:text-chartreuse">
                          <FlaskConical className="h-4 w-4" />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-[15px] text-paper transition-colors group-hover:text-chartreuse">
                            {run.name}
                          </p>

                          <p className="mt-2 font-mono text-[10px] text-sage">
                            {MODE_COPY[run.mode].label}
                            {' · '}
                            {run.inputSize.toLocaleString()} records
                          </p>

                          <p className="mt-1 font-mono text-[10px] text-sage">
                            {new Date(run.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* BASELINE */}
                      <div>
                        <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-sage">
                          Baseline median
                        </p>

                        <p className="mt-2 font-mono text-[13px] tabular-nums text-paper">
                          {run.baselineMedianMs === null
                            ? 'n/a'
                            : formatMs(run.baselineMedianMs)}
                        </p>
                      </div>

                      {/* CANDIDATE */}
                      <div>
                        <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-sage">
                          Candidate median
                        </p>

                        <p className="mt-2 font-mono text-[13px] tabular-nums text-paper">
                          {run.candidateMedianMs === null
                            ? 'n/a'
                            : formatMs(run.candidateMedianMs)}
                        </p>
                      </div>

                      {/* DIFFERENCE */}
                      <div className="flex items-center justify-between gap-4 lg:min-w-[110px] lg:justify-end">
                        <div className="lg:text-right">
                          <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-sage">
                            Difference
                          </p>

                          <p
                            className={`mt-2 font-mono text-[12px] tabular-nums ${
                              candidateFaster
                                ? 'text-chartreuse'
                                : 'text-sage'
                            }`}
                          >
                            {improvement === null
                              ? 'n/a'
                              : improvement > 0
                                ? `+${improvement.toFixed(1)}%`
                                : improvement < 0
                                  ? `${improvement.toFixed(1)}%`
                                  : '0.0%'}
                          </p>
                        </div>

                        {candidateFaster ? (
                          <ArrowDownRight className="h-4 w-4 text-chartreuse" />
                        ) : (
                          <ArrowRight className="h-4 w-4 text-sage transition-transform group-hover:translate-x-1 group-hover:text-chartreuse" />
                        )}
                      </div>
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {/* FOOTER NOTE */}
      {hasRuns && (
        <p className="font-mono text-[10px] leading-[1.7] text-sage">
          RESULTS ARE STORED LOCALLY IN THIS BROWSER ·
          PERFORMANCE DIFFERENCES ARE CALCULATED FROM SAVED MEDIANS
        </p>
      )}
    </div>
  );
}

/* ============================================================
   EMPTY HISTORY
============================================================ */

function EmptyHistory() {
  const steps = [
    {
      number: '01',
      title: 'Write',
      description: 'Prepare your baseline and candidate implementations.',
    },
    {
      number: '02',
      title: 'Run',
      description: 'Execute both implementations under the same conditions.',
    },
    {
      number: '03',
      title: 'Compare',
      description: 'Inspect timing, memory and estimated environmental impact.',
    },
    {
      number: '04',
      title: 'Save',
      description: 'Keep the results in your experiment archive.',
    },
  ];

  return (
    <section className="flex flex-col gap-10">

      {/* EMPTY HERO */}
      <div className="relative overflow-hidden border border-graphite bg-paper/[0.015]">
        <div className="absolute right-0 top-0 h-56 w-56 translate-x-1/3 -translate-y-1/3 rounded-full border border-chartreuse/10" />
        <div className="absolute right-8 top-8 h-36 w-36 rounded-full border border-chartreuse/10" />

        <div className="relative grid gap-8 p-6 sm:p-9 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:p-12">
          <div className="max-w-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center border border-chartreuse/40 text-chartreuse">
                <FlaskConical className="h-5 w-5" />
              </div>

              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-sage">
                Your experiment archive · 00
              </span>
            </div>

            <h3 className="mt-7 font-display text-[clamp(2rem,4vw,3.25rem)] leading-[1.05] tracking-[-0.025em] text-paper">
              Your experiments
              <span className="block text-chartreuse">
                start here.
              </span>
            </h3>

            <p className="mt-5 max-w-lg text-[14px] leading-[1.8] text-sage">
              Every benchmark you save becomes part of your performance
              story. Compare implementations, track improvements and
              understand the computational cost behind your code.
            </p>

            <a
              href={appHash('workbench')}
              className="group mt-8 inline-flex h-12 items-center gap-4 bg-chartreuse px-6 text-[13px] font-medium text-ink transition-transform duration-300 hover:-translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chartreuse"
            >
              Run your first experiment
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </a>

            <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.12em] text-sage">
              No experiments saved yet
            </p>
          </div>

          {/* DECORATIVE BENCHMARK PREVIEW */}
          <div className="border border-graphite bg-ink/70 p-5 sm:p-6">
            <div className="flex items-center justify-between border-b border-graphite pb-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-sage">
                Comparison preview
              </span>

              <span className="border border-chartreuse/30 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-chartreuse">
                Example
              </span>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-[10px] text-sage">
                    Baseline
                  </span>
                  <span className="font-mono text-[11px] text-paper">
                    —
                  </span>
                </div>

                <div className="h-2 overflow-hidden bg-graphite">
                  <div className="h-full w-[82%] bg-sage/50" />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-[10px] text-sage">
                    Candidate
                  </span>
                  <span className="font-mono text-[11px] text-paper">
                    —
                  </span>
                </div>

                <div className="h-2 overflow-hidden bg-graphite">
                  <div className="h-full w-[48%] bg-chartreuse/70" />
                </div>
              </div>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3 border-t border-graphite pt-5">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-sage">
                  Runtime
                </p>
                <p className="mt-2 font-display text-xl text-paper">
                  —
                </p>
              </div>

              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-sage">
                  Improvement
                </p>
                <p className="mt-2 font-display text-xl text-chartreuse">
                  —
                </p>
              </div>
            </div>

            <p className="mt-5 font-mono text-[9px] leading-[1.6] text-sage">
              ILLUSTRATIVE LAYOUT ONLY · REAL VALUES APPEAR AFTER A BENCHMARK
            </p>
          </div>
        </div>
      </div>

      {/* WHAT GETS TRACKED */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-sage">
              Inside your archive
            </p>

            <h3 className="mt-3 font-display text-2xl text-paper">
              More than just execution time.
            </h3>
          </div>

          <p className="max-w-sm text-[12px] leading-[1.7] text-sage">
            Your saved results help you understand how code performs
            and the resources it consumes.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <MetricPreview
            icon={<Timer className="h-4 w-4" />}
            index="01"
            title="Execution time"
            description="Compare runtime and identify faster implementations."
          />

          <MetricPreview
            icon={<MemoryStick className="h-4 w-4" />}
            index="02"
            title="Memory usage"
            description="Understand the memory footprint of your code."
          />

          <MetricPreview
            icon={<Zap className="h-4 w-4" />}
            index="03"
            title="Energy estimates"
            description="Explore modeled energy consumption across runs."
          />

          <MetricPreview
            icon={<Leaf className="h-4 w-4" />}
            index="04"
            title="CO₂e estimates"
            description="See the estimated environmental impact of computation."
          />
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div className="border-y border-graphite py-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-sage">
              The workflow
            </p>

            <h3 className="mt-3 font-display text-2xl text-paper">
              From code to insight.
            </h3>
          </div>

          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-sage">
            Write · Run · Compare · Save
          </span>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] text-chartreuse">
                  {step.number}
                </span>

                <div className="h-px flex-1 bg-graphite" />

                {index < steps.length - 1 && (
                  <ArrowRight className="hidden h-3 w-3 text-sage lg:block" />
                )}
              </div>

              <h4 className="mt-4 font-display text-xl text-paper">
                {step.title}
              </h4>

              <p className="mt-2 max-w-[230px] text-[12px] leading-[1.7] text-sage">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* LOCAL STORAGE NOTE */}
      <div className="flex flex-col gap-3 border border-graphite p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 text-chartreuse">
            <Check className="h-4 w-4" />
          </div>

          <div>
            <p className="text-[13px] text-paper">
              Your experiments stay in this browser.
            </p>

            <p className="mt-1 max-w-xl text-[11px] leading-[1.7] text-sage">
              Saved benchmark results are stored locally on this device.
              They are not synced across browsers or devices.
            </p>
          </div>
        </div>

        <a
          href={appHash('workbench')}
          className="group inline-flex shrink-0 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-chartreuse transition-colors hover:text-paper"
        >
          Start benchmarking
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
        </a>
      </div>
    </section>
  );
}

function MetricPreview({
  icon,
  index,
  title,
  description,
}: {
  icon: ReactNode;
  index: string;
  title: string;
  description: string;
}) {
  return (
    <div className="border-t border-chartreuse/50 pt-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] text-sage">
          {index}
        </span>

        <span className="text-chartreuse">
          {icon}
        </span>
      </div>

      <h4 className="mt-5 text-[14px] text-paper">
        {title}
      </h4>

      <p className="mt-2 text-[12px] leading-[1.7] text-sage">
        {description}
      </p>
    </div>
  );
}

function HistoryStat({
  label,
  value,
  description,
  icon,
}: {
  label: string;
  value: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="border-t border-chartreuse/60 pt-5">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-sage">
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

function ExportActions({ run }: { run: StoredRun }) {
  const exportCsv = () =>
    downloadFile(
      reportFilename(run, 'csv'),
      buildRunCsv(run),
      'text/csv;charset=utf-8'
    );

  const exportPdf = () => {
    const previousTitle = document.title;

    document.title = reportFilename(run, 'pdf').replace(/\.pdf$/, '');

    window.print();

    document.title = previousTitle;
  };

  const buttonClass =
    'flex h-10 items-center gap-2 border border-graphite px-4 text-[13px] text-paper transition-colors duration-300 hover:border-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-chartreuse';

  return (
    <>
      <button
        type="button"
        onClick={exportCsv}
        className={buttonClass}
      >
        <Download className="h-4 w-4" aria-hidden />
        Export CSV
      </button>

      <button
        type="button"
        onClick={exportPdf}
        className={buttonClass}
      >
        <Printer className="h-4 w-4" aria-hidden />
        Export PDF
      </button>

      {createPortal(
        <RunReport run={run} />,
        document.body
      )}
    </>
  );
}

function Message({
  children,
  tone,
}: {
  children: ReactNode;
  tone?: 'alert';
}) {
  return (
    <div className="mx-auto max-w-[1240px] px-5 py-16 lg:px-8">
      <p
        role={tone === 'alert' ? 'alert' : undefined}
        className={`text-[15px] leading-[1.6] ${
          tone === 'alert'
            ? 'border-l-2 border-chartreuse pl-3 text-paper'
            : 'text-sage'
        }`}
      >
        {children}
      </p>
    </div>
  );
}
