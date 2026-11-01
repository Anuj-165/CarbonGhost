import { useState, type ReactNode } from 'react';
import { Copy, Check, Loader2, RefreshCw } from 'lucide-react';
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import EnergyPanel from '@/components/app/EnergyPanel';
import ComparisonCharts from '@/components/app/ComparisonCharts';
import { MODE_COPY } from '@/lib/benchmark/examples';
import { formatMs, type Summary } from '@/lib/benchmark/stats';
import type { Sample, TestCheck } from '@/lib/benchmark/protocol';
import type { StoredOutcome } from '@/lib/runs/runRepository';
import type { SaveState } from '@/lib/benchmark/useWorkbench';

interface ResultsViewProps {
  stored: StoredOutcome;
  saveState?: SaveState;
  onReproduce: () => void;
  headerAction?: ReactNode;
}

export default function ResultsView({ stored, saveState, onReproduce, headerAction }: ResultsViewProps) {
  const { outcome, environment, assumptions, baselineSummary, candidateSummary } = stored;
  const { config } = outcome;
  const speedup =
    baselineSummary && candidateSummary && candidateSummary.median > 0 ? baselineSummary.median / candidateSummary.median : null;

  return (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-8 px-5 py-8 lg:px-8 lg:py-10">
      <header className="flex flex-col gap-6 border-b border-graphite pb-8 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-sage">
            {MODE_COPY[config.mode].label} · {config.inputSize.toLocaleString()} records · {config.repetitions} repetitions
          </p>
          <h2 className="mt-3 font-display text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.02] tracking-[-0.02em] text-paper">
            {config.name}
          </h2>
          <p className="mt-3 font-mono text-[11px] text-sage">
            Finished {new Date(outcome.finishedAt).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {saveState && <SaveNote state={saveState} />}
          <button
            type="button"
            onClick={onReproduce}
            className="flex h-10 items-center gap-2 border border-graphite px-4 text-[13px] text-paper transition-colors duration-300 hover:border-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-chartreuse"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            Run this comparison again
          </button>
          {headerAction}
        </div>
      </header>

      <section aria-label="Headline result" className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-sage">Median runtime ratio</p>
          {speedup === null ? (
            <p className="mt-4 text-[15px] leading-[1.6] text-sage">
              At least one implementation has no successful repetitions, so a ratio cannot be computed.
            </p>
          ) : (
            <>
              <p className="mt-3 font-display text-[clamp(4rem,9vw,7.5rem)] leading-[0.9] tracking-[-0.03em] text-paper">
                {speedup >= 1 ? (
                  <AnimatedNumber value={speedup} decimals={2} suffix="×" />
                ) : (
                  <AnimatedNumber value={1 / speedup} decimals={2} suffix="×" />
                )}
              </p>
              <p className="mt-4 max-w-md text-[15px] leading-[1.6] text-sage">
                {speedup >= 1 ? 'faster' : 'slower'} at the median for the candidate, measured on the same input with the same
                repetition count.
              </p>
            </>
          )}
        </div>
        <p className="max-w-md text-[13px] leading-[1.6] text-sage lg:justify-self-end">
          {MODE_COPY[config.mode].description} Medians are shown with their spread so one fast or slow repetition does not
          decide the result.
        </p>
      </section>

      <section aria-label="Implementation results" className="grid gap-5 md:grid-cols-2">
        <ImplementationCard
          label="Baseline"
          summary={baselineSummary}
          samples={outcome.baseline.samples}
          total={outcome.baseline.iterations}
        />
        <ImplementationCard
          label="Candidate"
          summary={candidateSummary}
          samples={outcome.candidate.samples}
          total={outcome.candidate.iterations}
          highlight
        />
      </section>

      <ComparisonCharts
        baseline={{ summary: baselineSummary, samples: outcome.baseline.samples }}
        candidate={{ summary: candidateSummary, samples: outcome.candidate.samples }}
      />

      <EnergyPanel baseline={baselineSummary} candidate={candidateSummary} assumptions={assumptions} />

      <div className="grid gap-5 lg:grid-cols-2">
        <TestCoverage tests={outcome.tests} />
        <EnvironmentCard environment={environment} />
      </div>

      <RawData stored={stored} config={config} />
    </div>
  );
}

function ImplementationCard({
  label,
  summary,
  samples,
  total,
  highlight,
}: {
  label: string;
  summary: Summary | null;
  samples: Sample[];
  total: number;
  highlight?: boolean;
}) {
  const successful = samples.filter((sample) => sample.ok).length;
  const failed = samples.length - successful;
  const peak = peakHeapGrowth(samples);

  return (
    <article className={`flex flex-col border bg-[#0C130F] p-6 ${highlight ? 'border-chartreuse/50' : 'border-graphite'}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-medium text-paper">{label}</h3>
        <span className="font-mono text-[11px] text-sage">
          {successful} of {total} successful
        </span>
      </div>

      {summary ? (
        <>
          <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-sage">Median per call</p>
          <p className="mt-2 font-display text-[clamp(2.5rem,5vw,3.5rem)] leading-none tabular-nums text-paper">
            {formatMs(summary.median)}
          </p>
          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-graphite pt-5 font-mono text-[12px]">
            <Stat label="Mean" value={formatMs(summary.mean)} />
            <Stat label="Spread (std. dev.)" value={`${formatMs(summary.stdev)} (${(summary.cv * 100).toFixed(1)}%)`} />
            <Stat label="Middle 50%" value={`${formatMs(summary.p25)} to ${formatMs(summary.p75)}`} />
            <Stat label="Range" value={`${formatMs(summary.min)} to ${formatMs(summary.max)}`} />
            <Stat label="Failed repetitions" value={String(failed)} />
            <Stat
              label="Peak heap growth"
              value={peak === null ? 'Unavailable in this browser' : formatBytes(peak)}
            />
          </dl>
        </>
      ) : (
        <p className="mt-6 text-[14px] leading-[1.6] text-sage">No successful repetitions were recorded for this implementation.</p>
      )}

      {failed > 0 && (
        <ul className="mt-5 flex flex-col gap-1 font-mono text-[11px] text-paper/80">
          {samples
            .filter((sample) => !sample.ok)
            .map((sample) => (
              <li key={sample.index}>
                Repetition {sample.index + 1}: {sample.error ?? 'failed'}
              </li>
            ))}
        </ul>
      )}
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-sage">{label}</dt>
      <dd className="text-paper tabular-nums">{value}</dd>
    </>
  );
}

function TestCoverage({ tests }: { tests: TestCheck[] }) {
  const passed = tests.filter((test) => test.ok).length;
  return (
    <section aria-label="Test coverage" className="border border-graphite bg-[#0C130F] p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-medium text-paper">Correctness coverage</h3>
        <span className="font-mono text-[11px] text-sage">
          {passed} of {tests.length} checks passed
        </span>
      </div>
      <ul className="mt-5 divide-y divide-graphite border-y border-graphite">
        {tests.map((test) => (
          <li key={test.name} className="flex flex-col gap-1 py-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[13px] text-paper">{test.name}</span>
              <span className={`font-mono text-[11px] uppercase tracking-[0.12em] ${test.ok ? 'text-chartreuse' : 'text-paper'}`}>
                {test.ok ? 'Passed' : 'Failed'}
              </span>
            </div>
            <span className="text-[12px] leading-[1.5] text-sage">
              {test.records.toLocaleString()} records, {test.queries.toLocaleString()} queries. {test.detail}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function EnvironmentCard({ environment }: { environment: StoredOutcome['environment'] }) {
  return (
    <section aria-label="Environment" className="border border-graphite bg-[#0C130F] p-6">
      <h3 className="text-[15px] font-medium text-paper">Environment</h3>
      {environment ? (
        <dl className="mt-5 grid grid-cols-[9rem_1fr] gap-x-6 gap-y-3 font-mono text-[12px]">
          <dt className="text-sage">Runtime</dt>
          <dd className="text-paper">{environment.runtime}</dd>
          <dt className="text-sage">Platform</dt>
          <dd className="text-paper">{environment.platform}</dd>
          <dt className="text-sage">Logical cores</dt>
          <dd className="text-paper">{environment.cores ?? 'Not reported'}</dd>
          <dt className="text-sage">Device memory</dt>
          <dd className="text-paper">{environment.memoryGb ? `${environment.memoryGb} GB (approximate)` : 'Not reported'}</dd>
          <dt className="text-sage">Timer</dt>
          <dd className="text-paper">{environment.timerResolutionNote}</dd>
        </dl>
      ) : (
        <p className="mt-5 text-[13px] leading-[1.6] text-sage">Environment details were not recorded for this run.</p>
      )}
    </section>
  );
}

function RawData({ stored, config }: { stored: StoredOutcome; config: StoredOutcome['outcome']['config'] }) {
  const [copied, setCopied] = useState(false);
  const reproduction = {
    name: config.name,
    mode: config.mode,
    inputRecords: config.inputSize,
    repetitions: config.repetitions,
    warmupRuns: config.warmup,
    timeoutSec: config.timeoutSec,
    input: stored.outcome.input,
    environment: stored.environment,
  };
  const json = JSON.stringify(reproduction, null, 2);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify({ ...reproduction, results: stored.outcome }, null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section aria-label="Raw data" className="border border-graphite">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[14px] text-paper transition-colors duration-300 hover:bg-paper/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-chartreuse">
          Raw data and reproduction settings
          <span className="font-mono text-[11px] text-sage group-open:hidden">Show</span>
          <span className="hidden font-mono text-[11px] text-sage group-open:inline">Hide</span>
        </summary>
        <div className="flex flex-col gap-4 border-t border-graphite p-5">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={copy}
              className="flex h-9 items-center gap-2 border border-graphite px-3 text-[12px] text-paper transition-colors duration-300 hover:border-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-chartreuse"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-chartreuse" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
              {copied ? 'Copied' : 'Copy full JSON'}
            </button>
          </div>
          <pre className="max-h-96 overflow-auto bg-ink p-4 font-mono text-[11px] leading-[1.6] text-paper/80">{json}</pre>
        </div>
      </details>
    </section>
  );
}

function SaveNote({ state }: { state: SaveState }) {
  if (state.status === 'idle') return null;
  if (state.status === 'saving') {
    return (
      <span className="flex items-center gap-2 font-mono text-[11px] text-sage">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        Saving to history
      </span>
    );
  }
  if (state.status === 'saved') {
    return (
      <span className="flex items-center gap-2 font-mono text-[11px] text-chartreuse">
        <Check className="h-3.5 w-3.5" aria-hidden />
        Saved to history
      </span>
    );
  }
  return <span className="font-mono text-[11px] text-paper">Not saved: {state.message}</span>;
}

function peakHeapGrowth(samples: Sample[]): number | null {
  const values = samples.flatMap((sample) => (typeof sample.heapDeltaBytes === 'number' ? [sample.heapDeltaBytes] : []));
  return values.length > 0 ? Math.max(...values) : null;
}

function formatBytes(bytes: number) {
  if (Math.abs(bytes) >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  if (Math.abs(bytes) >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}
