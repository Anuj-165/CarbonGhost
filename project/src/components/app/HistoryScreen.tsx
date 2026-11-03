
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { HistoryFilters } from '@/components/app/HistoryFilters';
import { createPortal } from 'react-dom';
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  Download,
  FlaskConical,
  Layers3,
  Printer,
  TrendingUp,
  Zap,
} from 'lucide-react';

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

import ResultsView from '@/components/app/ResultsView';
import RunReport from '@/components/app/RunReport';

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

      {/* HISTORY LIST */}
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

        {state.runs.length === 0 && (
          <div className="flex flex-col items-start gap-4 border-y border-graphite py-12">
            <div className="flex h-12 w-12 items-center justify-center border border-graphite text-chartreuse">
              <Zap className="h-5 w-5" />
            </div>

            <h3 className="font-display text-2xl text-paper">
              Your experiment archive is waiting.
            </h3>

            <p className="max-w-md text-[14px] leading-[1.7] text-sage">
              Every completed comparison you save will appear here.
              Revisit results, inspect performance differences and
              export reports whenever you need them.
            </p>

            <a
              href={appHash('workbench')}
              className="mt-2 flex h-11 items-center gap-3 bg-chartreuse px-5 text-[13px] font-medium text-ink transition-transform hover:-translate-y-px"
            >
              Run your first experiment
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        )}

        {state.runs.length > 0 && visibleRuns.length === 0 && (
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

            {visibleRuns.map((run, index) => {
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

      {/* FOOTER NOTE */}
      {state.runs.length > 0 && (
        <p className="font-mono text-[10px] leading-[1.7] text-sage">
          RESULTS ARE STORED LOCALLY IN THIS BROWSER ·
          PERFORMANCE DIFFERENCES ARE CALCULATED FROM SAVED MEDIANS
        </p>
      )}

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
