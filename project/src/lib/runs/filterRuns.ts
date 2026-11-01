import type { StoredRun } from '@/lib/runs/runRepository';

export type ModeFilter = 'all' | StoredRun['mode'];

export interface RunFilters {
  mode: ModeFilter;
  query: string;
  from: string;
  to: string;
  inputSize: 'all' | number;
}

export const EMPTY_FILTERS: RunFilters = { mode: 'all', query: '', from: '', to: '', inputSize: 'all' };

const DAY_MS = 24 * 60 * 60 * 1000;

export function hasActiveFilters(filters: RunFilters) {
  return JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS);
}

export function inputSizeOptions(runs: StoredRun[]) {
  return Array.from(new Set(runs.map((run) => run.inputSize))).sort((a, b) => a - b);
}

export function filterRuns(runs: StoredRun[], filters: RunFilters): StoredRun[] {
  const query = filters.query.trim().toLowerCase();
  const fromMs = filters.from ? new Date(`${filters.from}T00:00:00`).getTime() : null;
  const toMs = filters.to ? new Date(`${filters.to}T00:00:00`).getTime() + DAY_MS : null;

  return runs.filter((run) => {
    if (filters.mode !== 'all' && run.mode !== filters.mode) return false;
    if (filters.inputSize !== 'all' && run.inputSize !== filters.inputSize) return false;
    if (query && !run.name.toLowerCase().includes(query)) return false;
    const createdMs = new Date(run.createdAt).getTime();
    if (fromMs !== null && createdMs < fromMs) return false;
    if (toMs !== null && createdMs >= toMs) return false;
    return true;
  });
}
