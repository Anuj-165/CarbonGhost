import type { RunConfig } from '@/lib/benchmark/protocol';

export const EXAMPLE_NAME = 'Repeated linear search vs indexed lookup';

export const EXAMPLE_BASELINE = `// Baseline: scan every record for each query.
function prepare(input) {
  return input;
}

function solve({ records, queries }) {
  return queries.map((query) => {
    for (let i = 0; i < records.length; i++) {
      if (records[i].key === query) return records[i].value;
    }
    return null;
  });
}`;

export const EXAMPLE_CANDIDATE = `// Candidate: build a Map once, then answer each query directly.
function prepare(input) {
  const index = new Map();
  for (const { key, value } of input.records) {
    if (!index.has(key)) index.set(key, value);
  }
  return { index, queries: input.queries };
}

function solve({ index, queries }) {
  return queries.map((query) => (index.has(query) ? index.get(query) : null));
}`;

export const DEFAULT_CONFIG: RunConfig = {
  name: 'Lookup strategy comparison',
  baseline: EXAMPLE_BASELINE,
  candidate: EXAMPLE_CANDIDATE,
  inputSize: 5000,
  repetitions: 10,
  warmup: 2,
  timeoutSec: 30,
  mode: 'end-to-end',
};

export const DEFAULT_ASSUMPTIONS = {
  powerW: 15,
  intensityGPerKWh: 400,
  powerUncertainty: 0.25,
  intensityUncertainty: 0.2,
  executionsPerDay: 1000,
};

export const MODE_COPY = {
  isolated: {
    label: 'Isolated operation',
    description: 'Times solve() only. prepare() runs untimed, so index construction is excluded.',
  },
  'end-to-end': {
    label: 'End-to-end',
    description: 'Times prepare() and solve() together, so index construction and setup are included.',
  },
} as const;
