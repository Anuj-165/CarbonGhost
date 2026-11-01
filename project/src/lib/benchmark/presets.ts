import type { RunConfig } from '@/lib/benchmark/protocol';

export type PresetSettings = Pick<RunConfig, 'inputSize' | 'repetitions' | 'warmup' | 'timeoutSec' | 'mode'>;

export interface BenchmarkPreset {
  id: string;
  label: string;
  summary: string;
  settings: PresetSettings;
}

export const BENCHMARK_PRESETS: BenchmarkPreset[] = [
  {
    id: 'quick-check',
    label: 'Quick check',
    summary: 'Small input and few repetitions for fast feedback while you edit code.',
    settings: { inputSize: 1000, repetitions: 5, warmup: 1, timeoutSec: 15, mode: 'isolated' },
  },
  {
    id: 'standard',
    label: 'Standard',
    summary: 'A balanced setup for everyday comparisons, timing setup and lookup together.',
    settings: { inputSize: 5000, repetitions: 10, warmup: 2, timeoutSec: 30, mode: 'end-to-end' },
  },
  {
    id: 'thorough',
    label: 'Thorough',
    summary: 'Largest input and more repetitions for a tighter estimate of spread.',
    settings: { inputSize: 20000, repetitions: 20, warmup: 3, timeoutSec: 120, mode: 'isolated' },
  },
  {
    id: 'build-cost',
    label: 'Build cost',
    summary: 'Large input with index construction counted, so one-off setup costs are visible.',
    settings: { inputSize: 20000, repetitions: 10, warmup: 2, timeoutSec: 120, mode: 'end-to-end' },
  },
];

export function matchingPresetId(config: PresetSettings): string | null {
  const match = BENCHMARK_PRESETS.find(
    (preset) =>
      preset.settings.inputSize === config.inputSize &&
      preset.settings.repetitions === config.repetitions &&
      preset.settings.warmup === config.warmup &&
      preset.settings.timeoutSec === config.timeoutSec &&
      preset.settings.mode === config.mode,
  );
  return match?.id ?? null;
}
