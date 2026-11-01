import { formatCo2 } from '@/components/app/EnergyPanel';
import { formatMs } from '@/lib/benchmark/stats';
import { MODE_COPY } from '@/lib/benchmark/examples';
import { deriveReport } from '@/lib/reports/runReport';
import type { StoredRun } from '@/lib/runs/runRepository';

export default function RunReport({ run }: { run: StoredRun }) {
  const { outcome: stored } = run;
  const { outcome, environment, assumptions, baselineSummary, candidateSummary } = stored;
  const { config } = outcome;
  const { speedup, baselineEnergy, candidateEnergy } = deriveReport(run);
  const summaryRows: { label: string; baseline: string; candidate: string }[] = [
    { label: 'Median per call', baseline: formatOrDash(baselineSummary?.median), candidate: formatOrDash(candidateSummary?.median) },
    { label: 'Mean per call', baseline: formatOrDash(baselineSummary?.mean), candidate: formatOrDash(candidateSummary?.mean) },
    { label: 'Spread (std dev)', baseline: formatOrDash(baselineSummary?.stdev), candidate: formatOrDash(candidateSummary?.stdev) },
    { label: 'Range (min to max)', baseline: rangeText(baselineSummary), candidate: rangeText(candidateSummary) },
    { label: 'Successful samples', baseline: String(baselineSummary?.n ?? 0), candidate: String(candidateSummary?.n ?? 0) },
  ];

  return (
    <article className="hidden bg-white p-10 font-sans text-[11px] leading-[1.5] text-ink print:block">
      <header className="flex items-start justify-between border-b border-ink pb-4">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.18em]">CarbonGhost benchmark report</p>
          <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.01em]">{config.name}</h1>
        </div>
        <p className="font-mono text-[9px]">Finished {new Date(outcome.finishedAt).toLocaleString()}</p>
      </header>

      <section className="mt-5 grid grid-cols-4 gap-3">
        <Fact label="Mode" value={MODE_COPY[config.mode].label} />
        <Fact label="Input records" value={config.inputSize.toLocaleString()} />
        <Fact label="Repetitions" value={`${config.repetitions} (warm-up ${config.warmup})`} />
        <Fact label="Dataset seed" value={String(outcome.input.seed)} />
      </section>

      <section className="mt-6">
        <h2 className="font-mono text-[9px] uppercase tracking-[0.16em]">Timing</h2>
        <table className="mt-2 w-full border-collapse">
          <thead>
            <tr className="border-b border-ink text-left">
              <th className="py-1.5 font-medium">Measure</th>
              <th className="py-1.5 font-medium">Baseline</th>
              <th className="py-1.5 font-medium">Candidate</th>
            </tr>
          </thead>
          <tbody>
            {summaryRows.map((row) => (
              <tr key={row.label} className="border-b border-ink/20">
                <td className="py-1.5">{row.label}</td>
                <td className="py-1.5 font-mono tabular-nums">{row.baseline}</td>
                <td className="py-1.5 font-mono tabular-nums">{row.candidate}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3">
          Median speedup (baseline divided by candidate):{' '}
          <span className="font-semibold">{speedup === null ? 'not available' : `${speedup.toFixed(2)}x`}</span>
        </p>
      </section>

      <section className="mt-6">
        <h2 className="font-mono text-[9px] uppercase tracking-[0.16em]">Modeled energy and carbon (estimate, not measured)</h2>
        <p className="mt-2">
          Estimated from measured time, an assumed power draw of {assumptions.powerW ?? 'unknown'} W and an assumed grid intensity
          of {assumptions.intensityGPerKWh ?? 'unknown'} gCO2e/kWh. Annual projection assumes {assumptions.executionsPerDay.toLocaleString()}{' '}
          executions per day.
        </p>
        <table className="mt-2 w-full border-collapse">
          <thead>
            <tr className="border-b border-ink text-left">
              <th className="py-1.5 font-medium">Estimate</th>
              <th className="py-1.5 font-medium">Baseline</th>
              <th className="py-1.5 font-medium">Candidate</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-ink/20">
              <td className="py-1.5">CO2e per call</td>
              <td className="py-1.5 font-mono">{baselineEnergy ? formatCo2(baselineEnergy.gCo2ePerCall) : 'not available'}</td>
              <td className="py-1.5 font-mono">{candidateEnergy ? formatCo2(candidateEnergy.gCo2ePerCall) : 'not available'}</td>
            </tr>
            <tr className="border-b border-ink/20">
              <td className="py-1.5">Range per call (approximate)</td>
              <td className="py-1.5 font-mono">
                {baselineEnergy ? `${formatCo2(baselineEnergy.lowGCo2e)} to ${formatCo2(baselineEnergy.highGCo2e)}` : 'not available'}
              </td>
              <td className="py-1.5 font-mono">
                {candidateEnergy ? `${formatCo2(candidateEnergy.lowGCo2e)} to ${formatCo2(candidateEnergy.highGCo2e)}` : 'not available'}
              </td>
            </tr>
            <tr className="border-b border-ink/20">
              <td className="py-1.5">Annual CO2e (assumed usage)</td>
              <td className="py-1.5 font-mono">{baselineEnergy ? formatCo2(baselineEnergy.annualGCo2e) : 'not available'}</td>
              <td className="py-1.5 font-mono">{candidateEnergy ? formatCo2(candidateEnergy.annualGCo2e) : 'not available'}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="mt-6">
        <h2 className="font-mono text-[9px] uppercase tracking-[0.16em]">Output checks</h2>
        <ul className="mt-2 flex flex-col gap-1">
          {outcome.tests.map((test) => (
            <li key={test.name}>
              <span className="font-semibold">{test.ok ? 'Passed' : 'Failed'}</span> {test.name}: {test.detail}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="font-mono text-[9px] uppercase tracking-[0.16em]">Environment</h2>
        <p className="mt-2">
          {environment
            ? `${environment.runtime} on ${environment.platform}, ${environment.cores ?? 'unknown'} logical cores, ${environment.memoryGb ?? 'unknown'} GB memory reported. ${environment.timerResolutionNote}`
            : 'Environment details were not recorded for this run.'}
        </p>
      </section>

      <section className="mt-6">
        <h2 className="font-mono text-[9px] uppercase tracking-[0.16em]">What this report does not show</h2>
        <p className="mt-2">
          Results describe this browser and machine only. Power draw and grid intensity are assumptions, so energy and carbon
          values are estimates. Peak memory is reported only when the browser exposes it.
        </p>
      </section>

      <section className="mt-6 break-inside-avoid">
        <h2 className="font-mono text-[9px] uppercase tracking-[0.16em]">Source compared</h2>
        <div className="mt-2 grid grid-cols-2 gap-4">
          <SourceBlock title="Baseline" source={config.baseline} />
          <SourceBlock title="Candidate" source={config.candidate} />
        </div>
      </section>
    </article>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-ink pt-1.5">
      <p className="font-mono text-[8px] uppercase tracking-[0.14em]">{label}</p>
      <p className="mt-0.5 font-medium">{value}</p>
    </div>
  );
}

function SourceBlock({ title, source }: { title: string; source: string }) {
  return (
    <div>
      <p className="font-medium">{title}</p>
      <pre className="mt-1 whitespace-pre-wrap border border-ink/20 p-2 font-mono text-[8px] leading-[1.4]">{source}</pre>
    </div>
  );
}

function formatOrDash(value: number | undefined) {
  return value === undefined ? 'not available' : formatMs(value);
}

function rangeText(summary: { min: number; max: number } | null) {
  return summary ? `${formatMs(summary.min)} to ${formatMs(summary.max)}` : 'not available';
}
