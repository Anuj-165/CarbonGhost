export interface Summary {
  n: number;
  median: number;
  mean: number;
  stdev: number;
  cv: number;
  min: number;
  max: number;
  p25: number;
  p75: number;
}

function percentile(sorted: number[], p: number) {
  const position = (sorted.length - 1) * p;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

export function summarize(values: number[]): Summary | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = sorted.reduce((sum, value) => sum + value, 0) / n;
  const variance = n > 1 ? sorted.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (n - 1) : 0;
  const stdev = Math.sqrt(variance);

  return {
    n,
    median: percentile(sorted, 0.5),
    mean,
    stdev,
    cv: mean === 0 ? 0 : stdev / mean,
    min: sorted[0],
    max: sorted[n - 1],
    p25: percentile(sorted, 0.25),
    p75: percentile(sorted, 0.75),
  };
}

export function formatMs(ms: number) {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)} s`;
  if (ms >= 10) return `${ms.toFixed(1)} ms`;
  return `${ms.toFixed(2)} ms`;
}
