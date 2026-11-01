import { estimateEnergy, type EnergyEstimate } from '@/lib/benchmark/energy';
import type { StoredRun } from '@/lib/runs/runRepository';

export interface DerivedReport {
  speedup: number | null;
  baselineEnergy: EnergyEstimate | null;
  candidateEnergy: EnergyEstimate | null;
}

export function deriveReport({ outcome: stored }: StoredRun): DerivedReport {
  const { baselineSummary, candidateSummary, assumptions } = stored;
  const speedup =
    baselineSummary && candidateSummary && candidateSummary.median > 0 ? baselineSummary.median / candidateSummary.median : null;
  return {
    speedup,
    baselineEnergy: baselineSummary
      ? estimateEnergy(baselineSummary.median, baselineSummary.cv, baselineSummary.n, assumptions)
      : null,
    candidateEnergy: candidateSummary
      ? estimateEnergy(candidateSummary.median, candidateSummary.cv, candidateSummary.n, assumptions)
      : null,
  };
}

type Cell = string | number | boolean | null;

function escapeCell(value: Cell): string {
  if (value === null) return '';
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function buildRunCsv(run: StoredRun): string {
  const { outcome: stored } = run;
  const { outcome } = stored;
  const { config } = outcome;
  const { speedup, baselineEnergy, candidateEnergy } = deriveReport(run);
  const rows: Cell[][] = [
    ['CarbonGhost benchmark report'],
    ['Run', config.name],
    ['Finished', outcome.finishedAt],
    ['Mode', config.mode],
    ['Input records', config.inputSize],
    ['Queries', outcome.input.queries],
    ['Dataset seed', outcome.input.seed],
    ['Repetitions', config.repetitions],
    ['Warm-up', config.warmup],
    ['Timeout (s)', config.timeoutSec],
    [],
    ['Metric', 'Baseline', 'Candidate'],
    ['Median per call (ms)', stored.baselineSummary?.median ?? null, stored.candidateSummary?.median ?? null],
    ['Mean per call (ms)', stored.baselineSummary?.mean ?? null, stored.candidateSummary?.mean ?? null],
    ['Std dev (ms)', stored.baselineSummary?.stdev ?? null, stored.candidateSummary?.stdev ?? null],
    ['Coefficient of variation', stored.baselineSummary?.cv ?? null, stored.candidateSummary?.cv ?? null],
    ['Min (ms)', stored.baselineSummary?.min ?? null, stored.candidateSummary?.min ?? null],
    ['Max (ms)', stored.baselineSummary?.max ?? null, stored.candidateSummary?.max ?? null],
    ['Successful samples', stored.baselineSummary?.n ?? null, stored.candidateSummary?.n ?? null],
    ['Median speedup (baseline / candidate)', speedup, null],
    ['Modeled CO2e per call (g, estimate)', baselineEnergy?.gCo2ePerCall ?? null, candidateEnergy?.gCo2ePerCall ?? null],
    ['Modeled CO2e per call, low (g)', baselineEnergy?.lowGCo2e ?? null, candidateEnergy?.lowGCo2e ?? null],
    ['Modeled CO2e per call, high (g)', baselineEnergy?.highGCo2e ?? null, candidateEnergy?.highGCo2e ?? null],
    ['Assumed power (W)', stored.assumptions.powerW, null],
    ['Assumed grid intensity (gCO2e/kWh)', stored.assumptions.intensityGPerKWh, null],
    ['Executions per day (assumed)', stored.assumptions.executionsPerDay, null],
    [],
    ['Correctness check', 'Records', 'Queries', 'Passed', 'Detail'],
    ...outcome.tests.map((test) => [test.name, test.records, test.queries, test.ok, test.detail]),
    [],
    ['Implementation', 'Repetition', 'Successful', 'Per call (ms)', 'Error'],
    ...(['baseline', 'candidate'] as const).flatMap((impl) =>
      outcome[impl].samples.map((sample) => [impl, sample.index, sample.ok, sample.perCallMs, sample.error ?? null]),
    ),
  ];
  return rows.map((row) => row.map(escapeCell).join(',')).join('\r\n');
}

export function downloadFile(filename: string, content: string, mimeType: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function reportFilename(run: StoredRun, extension: string): string {
  const slug = run.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'benchmark-run';
  return `${slug}-${run.createdAt.slice(0, 10)}.${extension}`;
}
