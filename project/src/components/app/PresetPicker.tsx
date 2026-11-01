import { BENCHMARK_PRESETS, matchingPresetId, type PresetSettings } from '@/lib/benchmark/presets';

interface PresetPickerProps {
  current: PresetSettings;
  onApply: (settings: PresetSettings) => void;
  disabled?: boolean;
}

export default function PresetPicker({ current, onApply, disabled }: PresetPickerProps) {
  const activeId = matchingPresetId(current);
  const active = BENCHMARK_PRESETS.find((preset) => preset.id === activeId) ?? null;

  return (
    <section aria-label="Benchmark profiles" className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-sage">Benchmark profile</p>
        <div role="group" aria-label="Benchmark profile" className="flex flex-wrap gap-2">
          {BENCHMARK_PRESETS.map((preset) => {
            const selected = preset.id === activeId;
            return (
              <button
                key={preset.id}
                type="button"
                aria-pressed={selected}
                disabled={disabled}
                onClick={() => onApply(preset.settings)}
                className={`h-9 border px-3.5 text-[13px] transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-chartreuse disabled:cursor-not-allowed disabled:opacity-60 ${
                  selected ? 'border-chartreuse bg-chartreuse text-ink' : 'border-graphite text-paper hover:border-sage'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>
      <p className="min-h-[1.5rem] text-[13px] leading-[1.6] text-sage" aria-live="polite">
        {active ? active.summary : 'Custom settings. Choose a profile to apply a tested combination of input size, repetitions and mode.'}
      </p>
    </section>
  );
}
