import { useEffect, useState, type ReactNode } from 'react';
import { HistoryFilters } from '@/components/app/HistoryFilters';
import { createPortal } from 'react-dom';
import { Download, Printer } from 'lucide-react';
import { appHash } from '@/lib/useRoute';
import { listRuns, type StoredOutcome, type StoredRun } from '@/lib/runs/runRepository';
import { formatMs } from '@/lib/benchmark/stats';
import { MODE_COPY } from '@/lib/benchmark/examples';
import { buildRunCsv, downloadFile, reportFilename } from '@/lib/reports/runReport';
import { EMPTY_FILTERS, filterRuns, inputSizeOptions, type RunFilters } from '@/lib/runs/filterRuns';
import ResultsView from '@/components/app/ResultsView';
import RunReport from '@/components/app/RunReport';

type LoadState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; runs: StoredRun[] };

export function useSavedRuns() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    listRuns()
      .then((runs) => active && setState({ status: 'ready', runs }))
      .catch((error: Error) => active && setState({ status: 'error', message: error.message }));
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
  const [filters, setFilters] = useState<RunFilters>(EMPTY_FILTERS);

  if (state.status === 'loading') return <Message>Loading saved runs</Message>;
  if (state.status === 'error') return <Message tone="alert">Saved runs could not be loaded: {state.message}</Message>;

  if (runId) {
    const run = state.runs.find((item) => item.id === runId);
    if (!run) return <Message tone="alert">This saved run was not found.</Message>;
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

  if (state.runs.length === 0) {
    return <Message>No saved runs yet. Completed comparisons appear here.</Message>;
  }

  const visibleRuns = filterRuns(state.runs, filters);

  return (
    <div className="mx-auto max-w-[1240px] px-5 py-10 lg:px-8">
      <HistoryFilters filters={filters} sizes={inputSizeOptions(state.runs)} onChange={setFilters} />
      <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.16em] text-sage" aria-live="polite">
        Showing {visibleRuns.length} of {state.runs.length} saved runs
      </p>
      {visibleRuns.length === 0 && (
        <div className="mt-6 flex flex-col items-start gap-4 border border-graphite p-6">
          <p className="text-[15px] leading-[1.6] text-sage">No saved runs match these filters.</p>
          <button
            type="button"
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="flex h-10 items-center border border-graphite px-4 text-[13px] text-paper transition-colors duration-300 hover:border-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-chartreuse"
          >
            Clear filters
          </button>
        </div>
      )}
      <ul className="mt-4 divide-y divide-graphite border-y border-graphite">
        {visibleRuns.map((run) => (
          <li key={run.id}>
            <a
              href={appHash('history', run.id)}
              className="group grid gap-3 py-5 transition-colors duration-300 hover:bg-paper/[0.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-chartreuse md:grid-cols-[1fr_auto_auto] md:items-center md:gap-10"
            >
              <div className="min-w-0">
                <p className="truncate text-[15px] text-paper group-hover:text-chartreuse">{run.name}</p>
                <p className="mt-1 font-mono text-[11px] text-sage">
                  {MODE_COPY[run.mode].label} · {run.inputSize.toLocaleString()} records · {new Date(run.createdAt).toLocaleString()}
                </p>
              </div>
              <p className="font-mono text-[12px] tabular-nums text-sage">
                Baseline median <span className="text-paper">{run.baselineMedianMs === null ? 'n/a' : formatMs(run.baselineMedianMs)}</span>
              </p>
              <p className="font-mono text-[12px] tabular-nums text-sage">
                Candidate median <span className="text-paper">{run.candidateMedianMs === null ? 'n/a' : formatMs(run.candidateMedianMs)}</span>
              </p>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ExportActions({ run }: { run: StoredRun }) {
  const exportCsv = () => downloadFile(reportFilename(run, 'csv'), buildRunCsv(run), 'text/csv;charset=utf-8');

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
      <button type="button" onClick={exportCsv} className={buttonClass}>
        <Download className="h-4 w-4" aria-hidden />
        Export CSV
      </button>
      <button type="button" onClick={exportPdf} className={buttonClass}>
        <Printer className="h-4 w-4" aria-hidden />
        Export PDF
      </button>
      {createPortal(<RunReport run={run} />, document.body)}
    </>
  );
}

function Message({ children, tone }: { children: ReactNode; tone?: 'alert' }) {
  return (
    <div className="mx-auto max-w-[1240px] px-5 py-16 lg:px-8">
      <p role={tone === 'alert' ? 'alert' : undefined} className={`text-[15px] leading-[1.6] ${tone === 'alert' ? 'border-l-2 border-chartreuse pl-3 text-paper' : 'text-sage'}`}>
        {children}
      </p>
    </div>
  );
}
