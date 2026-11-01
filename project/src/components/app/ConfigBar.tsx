import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Database } from 'lucide-react';
import { INPUT_SIZES, QUERY_COUNT, INPUT_SEED } from '@/lib/benchmark/dataset';
import { LIMITS } from '@/lib/benchmark/validation';
import { MODE_COPY } from '@/lib/benchmark/examples';
import type { EnergyAssumptions } from '@/lib/benchmark/energy';
import type { RunConfig } from '@/lib/benchmark/protocol';
import type { EnvironmentInfo } from '@/lib/environment';

const EASE = [0.22, 1, 0.36, 1] as const;

interface ConfigBarProps {
  config: RunConfig;
  onChange: (patch: Partial<RunConfig>) => void;
  assumptions: EnergyAssumptions;
  onAssumptionsChange: (patch: Partial<EnergyAssumptions>) => void;
  environment: EnvironmentInfo | null;
  disabled: boolean;
}

export default function ConfigBar({
  config,
  onChange,
  assumptions,
  onAssumptionsChange,
  environment,
  disabled,
}: ConfigBarProps) {
  const [assumptionsOpen, setAssumptionsOpen] = useState(false);

  return (
    <section aria-label="Run configuration" className="border-y border-graphite">
      <div className="grid gap-x-8 gap-y-6 py-5 md:grid-cols-2 xl:grid-cols-[1.2fr_1.4fr_0.9fr_0.9fr_0.9fr_1.5fr]">
        <Field label="Input dataset">
          <Segmented
            ariaLabel="Input dataset size"
            disabled={disabled}
            value={config.inputSize}
            options={INPUT_SIZES.map((size) => ({ value: size.size, label: size.label }))}
            onChange={(value) => onChange({ inputSize: value })}
          />
          <p className="mt-2 font-mono text-[11px] text-sage">
            {QUERY_COUNT} queries, seed {INPUT_SEED}
          </p>
        </Field>

        <Field label="Measurement mode">
          <Segmented
            ariaLabel="Measurement mode"
            disabled={disabled}
            value={config.mode}
            options={[
              { value: 'isolated', label: MODE_COPY.isolated.label },
              { value: 'end-to-end', label: MODE_COPY['end-to-end'].label },
            ]}
            onChange={(value) => onChange({ mode: value })}
          />
          <p className="mt-2 max-w-sm text-[12px] leading-[1.5] text-sage">{MODE_COPY[config.mode].description}</p>
        </Field>

        <Field label="Repetitions">
          <NumericInput
            label="Repetitions"
            value={config.repetitions}
            min={LIMITS.repetitions.min}
            max={LIMITS.repetitions.max}
            disabled={disabled}
            onChange={(value) => onChange({ repetitions: value })}
          />
        </Field>

        <Field label="Warm-up runs">
          <NumericInput
            label="Warm-up runs"
            value={config.warmup}
            min={LIMITS.warmup.min}
            max={LIMITS.warmup.max}
            disabled={disabled}
            onChange={(value) => onChange({ warmup: value })}
          />
        </Field>

        <Field label="Timeout, seconds">
          <NumericInput
            label="Timeout in seconds"
            value={config.timeoutSec}
            min={LIMITS.timeoutSec.min}
            max={LIMITS.timeoutSec.max}
            disabled={disabled}
            onChange={(value) => onChange({ timeoutSec: value })}
          />
        </Field>

        <Field label="Environment">
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono text-[11px] leading-[1.6] text-paper/85">
            <dt className="text-sage">Runtime</dt>
            <dd className="truncate">{environment?.runtime ?? 'Detecting'}</dd>
            <dt className="text-sage">Cores</dt>
            <dd>{environment?.cores ?? 'Unknown'}</dd>
            <dt className="text-sage">Timer</dt>
            <dd className="truncate">{environment?.crossOriginIsolated ? 'High resolution' : 'Coarsened'}</dd>
          </dl>
        </Field>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-graphite py-3">
        <p className="flex items-center gap-2 font-mono text-[11px] text-sage">
          <Database className="h-3.5 w-3.5" aria-hidden />
          Language: JavaScript, executed in a dedicated browser worker
        </p>
        <button
          type="button"
          onClick={() => setAssumptionsOpen((open) => !open)}
          aria-expanded={assumptionsOpen}
          aria-controls="energy-assumptions"
          className="group flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-sage transition-colors duration-300 hover:text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-chartreuse"
        >
          Energy assumptions
          <motion.span animate={{ rotate: assumptionsOpen ? 180 : 0 }} transition={{ duration: 0.35, ease: EASE }}>
            <ChevronDown className="h-3.5 w-3.5" aria-hidden />
          </motion.span>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {assumptionsOpen && (
          <motion.div
            id="energy-assumptions"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="overflow-hidden"
          >
            <AssumptionFields assumptions={assumptions} onChange={onAssumptionsChange} />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function AssumptionFields({
  assumptions,
  onChange,
}: {
  assumptions: EnergyAssumptions;
  onChange: (patch: Partial<EnergyAssumptions>) => void;
}) {
  const powerMissing = assumptions.powerW === null;
  const intensityMissing = assumptions.intensityGPerKWh === null;

  return (
    <div className="grid gap-6 border-t border-graphite py-6 md:grid-cols-2 xl:grid-cols-4">
      <Field label="Assumed power draw, W">
        <OptionalNumber
          label="Assumed power draw in watts"
          value={assumptions.powerW}
          step={1}
          min={0.1}
          onChange={(value) => onChange({ powerW: value })}
        />
        <Hint missing={powerMissing} missingText="Required for energy estimates. Not metered by this browser.">
          Processor power assumed for this run. Not measured.
        </Hint>
      </Field>
      <Field label="Grid carbon intensity, g CO2e/kWh">
        <OptionalNumber
          label="Carbon intensity in grams CO2e per kilowatt-hour"
          value={assumptions.intensityGPerKWh}
          step={10}
          min={0}
          onChange={(value) => onChange({ intensityGPerKWh: value })}
        />
        <Hint missing={intensityMissing} missingText="Required for CO2e estimates. Set your region's value.">
          Set this to the grid where the code would run.
        </Hint>
      </Field>
      <Field label="Uncertainty, power ±%">
        <NumericInput
          label="Power uncertainty percent"
          value={Math.round(assumptions.powerUncertainty * 100)}
          min={0}
          max={100}
          onChange={(value) => onChange({ powerUncertainty: value / 100 })}
        />
      </Field>
      <Field label="Executions per day">
        <NumericInput
          label="Executions per day"
          value={assumptions.executionsPerDay}
          min={1}
          max={100_000_000}
          onChange={(value) => onChange({ executionsPerDay: value })}
        />
        <Hint missing={false} missingText="">
          Used to project annual impact. Carbon intensity uncertainty is ±{Math.round(assumptions.intensityUncertainty * 100)}%.
        </Hint>
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col">
      <span className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-sage">{label}</span>
      {children}
    </div>
  );
}

function Hint({ missing, missingText, children }: { missing: boolean; missingText: string; children: ReactNode }) {
  return (
    <p className={`mt-2 text-[12px] leading-[1.5] ${missing ? 'text-paper' : 'text-sage'}`}>
      {missing ? (
        <>
          <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-chartreuse align-middle" aria-hidden />
          {missingText}
        </>
      ) : (
        children
      )}
    </p>
  );
}

interface SegmentedProps<T extends string | number> {
  ariaLabel: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  disabled?: boolean;
}

export function Segmented<T extends string | number>({ ariaLabel, value, options, onChange, disabled }: SegmentedProps<T>) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="inline-flex flex-wrap border border-graphite p-0.5">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={`relative px-3 py-1.5 text-[12px] transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-chartreuse disabled:cursor-not-allowed disabled:opacity-50 ${
              selected ? 'text-ink' : 'text-sage hover:text-paper'
            }`}
          >
            {selected && (
              <motion.span
                layoutId={`segment-${ariaLabel}`}
                className="absolute inset-0 bg-chartreuse"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              />
            )}
            <span className="relative">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

interface NumericInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}

export function NumericInput({ label, value, min, max, disabled, onChange }: NumericInputProps) {
  return (
    <input
      type="number"
      aria-label={label}
      value={value}
      min={min}
      max={max}
      disabled={disabled}
      onChange={(event) => {
        const next = Number(event.target.value);
        if (Number.isFinite(next)) onChange(next);
      }}
      className="h-9 w-28 border-b border-graphite bg-transparent font-mono text-[14px] tabular-nums text-paper transition-colors duration-300 focus:border-chartreuse focus:outline-none focus-visible:ring-1 focus-visible:ring-chartreuse disabled:opacity-50"
    />
  );
}

function OptionalNumber({
  label,
  value,
  step,
  min,
  onChange,
}: {
  label: string;
  value: number | null;
  step: number;
  min: number;
  onChange: (value: number | null) => void;
}) {
  return (
    <input
      type="number"
      aria-label={label}
      value={value ?? ''}
      step={step}
      min={min}
      placeholder="Not set"
      onChange={(event) => {
        if (event.target.value === '') {
          onChange(null);
          return;
        }
        const next = Number(event.target.value);
        if (Number.isFinite(next)) onChange(next);
      }}
      className="h-9 w-36 border-b border-graphite bg-transparent font-mono text-[14px] tabular-nums text-paper placeholder:text-sage/60 transition-colors duration-300 focus:border-chartreuse focus:outline-none focus-visible:ring-1 focus-visible:ring-chartreuse"
    />
  );
}
