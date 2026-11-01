import { motion } from 'framer-motion';
import { estimateEnergy, type EnergyAssumptions, type EnergyEstimate } from '@/lib/benchmark/energy';
import type { Summary } from '@/lib/benchmark/stats';

const EASE = [0.22, 1, 0.36, 1] as const;

interface EnergyPanelProps {
  baseline: Summary | null;
  candidate: Summary | null;
  assumptions: EnergyAssumptions;
}

export default function EnergyPanel({ baseline, candidate, assumptions }: EnergyPanelProps) {
  const missing = assumptions.powerW === null || assumptions.intensityGPerKWh === null;
  const baselineEstimate = baseline ? estimateEnergy(baseline.median, baseline.cv, baseline.n, assumptions) : null;
  const candidateEstimate = candidate ? estimateEnergy(candidate.median, candidate.cv, candidate.n, assumptions) : null;

  return (
    <section aria-labelledby="energy-heading" className="border border-graphite bg-[#0C130F]">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-graphite px-5 py-4">
        <div>
          <h2 id="energy-heading" className="text-[15px] font-medium text-paper">
            Energy and carbon
          </h2>
          <p className="mt-1 max-w-xl text-[13px] leading-[1.6] text-sage">
            Modeled from measured runtime, an assumed processor power and an assumed grid intensity. These are estimates,
            not meter readings.
          </p>
        </div>
        <span className="border border-graphite px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-sage">
          Modeled estimate
        </span>
      </header>

      {missing || !baselineEstimate || !candidateEstimate ? (
        <p className="px-5 py-8 text-[14px] leading-[1.6] text-sage">
          Set an assumed power draw and grid carbon intensity in the energy assumptions to see modeled energy and CO2e for
          this run.
        </p>
      ) : (
        <EstimateBody
          baseline={baselineEstimate}
          candidate={candidateEstimate}
          assumptions={assumptions}
          uncertainty={candidateEstimate.relativeUncertainty}
        />
      )}

      <dl className="grid gap-x-8 gap-y-2 border-t border-graphite px-5 py-4 font-mono text-[11px] text-sage md:grid-cols-2">
        <Assumption label="Assumed power" value={assumptions.powerW === null ? 'Not set' : `${assumptions.powerW} W`} />
        <Assumption
          label="Grid intensity"
          value={assumptions.intensityGPerKWh === null ? 'Not set' : `${assumptions.intensityGPerKWh} g CO2e/kWh`}
        />
        <Assumption label="Power uncertainty" value={`±${Math.round(assumptions.powerUncertainty * 100)}%`} />
        <Assumption label="Intensity uncertainty" value={`±${Math.round(assumptions.intensityUncertainty * 100)}%`} />
      </dl>
    </section>
  );
}

function EstimateBody({
  baseline,
  candidate,
  assumptions,
  uncertainty,
}: {
  baseline: EnergyEstimate;
  candidate: EnergyEstimate;
  assumptions: EnergyAssumptions;
  uncertainty: number;
}) {
  const ratio = baseline.gCo2ePerCall > 0 ? candidate.gCo2ePerCall / baseline.gCo2ePerCall : 1;
  const annualSaving = baseline.annualGCo2e - candidate.annualGCo2e;

  return (
    <div className="grid gap-8 px-5 py-6 lg:grid-cols-[1.1fr_1fr]">
      <div className="flex flex-col gap-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-sage">Per call, modeled</p>
        <Bar label="Baseline" value={formatCo2(baseline.gCo2ePerCall)} width={1} tone="sage" />
        <Bar label="Candidate" value={formatCo2(candidate.gCo2ePerCall)} width={ratio} tone="chartreuse" />
        <p className="text-[12px] leading-[1.6] text-sage">
          Modeled energy per call: {formatEnergy(baseline.joulesPerCall)} baseline, {formatEnergy(candidate.joulesPerCall)}{' '}
          candidate. Range for the candidate: {formatCo2(candidate.lowGCo2e)} to {formatCo2(candidate.highGCo2e)}, combining
          measurement spread with the stated power and intensity uncertainty (about ±{Math.round(uncertainty * 100)}%).
        </p>
      </div>

      <div className="flex flex-col gap-5 border-t border-graphite pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-sage">
          Projection at {assumptions.executionsPerDay.toLocaleString()} runs per day, assumed
        </p>
        <div>
          <p className="font-display text-[clamp(2.25rem,4vw,3.25rem)] leading-[1.05] text-paper">
            {annualSaving >= 0 ? formatCo2(annualSaving) : `+${formatCo2(-annualSaving)}`}
          </p>
          <p className="mt-2 text-[13px] leading-[1.6] text-sage">
            {annualSaving >= 0
              ? 'Modeled CO2e avoided per year by the candidate, compared with the baseline.'
              : 'Modeled extra CO2e per year for the candidate. The candidate uses more energy in this scenario.'}
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 font-mono text-[12px]">
          <dt className="text-sage">Baseline, per year</dt>
          <dd className="text-paper">{formatCo2(baseline.annualGCo2e)}</dd>
          <dt className="text-sage">Candidate, per year</dt>
          <dd className="text-paper">{formatCo2(candidate.annualGCo2e)}</dd>
          <dt className="text-sage">Energy, per year</dt>
          <dd className="text-paper">{formatKwh(candidate.annualKWh)} candidate</dd>
        </dl>
      </div>
    </div>
  );
}

function Bar({ label, value, width, tone }: { label: string; value: string; width: number; tone: 'sage' | 'chartreuse' }) {
  const clamped = Math.min(Math.max(width, 0.02), 1);
  return (
    <div className="grid grid-cols-[6.5rem_1fr] items-center gap-4">
      <div>
        <p className="text-[13px] text-paper">{label}</p>
        <p className="mt-0.5 font-mono text-[11px] tabular-nums text-sage">{value}</p>
      </div>
      <div className="h-3 w-full bg-graphite/60">
        <motion.div
          className={`h-full ${tone === 'chartreuse' ? 'bg-chartreuse' : 'bg-paper/70'}`}
          initial={{ width: '100%' }}
          animate={{ width: `${clamped * 100}%` }}
          transition={{ duration: 1.1, ease: EASE }}
        />
      </div>
    </div>
  );
}

function Assumption({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-graphite/60 py-1.5">
      <dt>{label}</dt>
      <dd className="text-paper/85">{value}</dd>
    </div>
  );
}

export function formatCo2(grams: number) {
  const abs = Math.abs(grams);
  if (abs >= 1000) return `${(grams / 1000).toFixed(2)} kg CO2e`;
  if (abs >= 1) return `${grams.toFixed(2)} g CO2e`;
  if (abs >= 0.001) return `${(grams * 1000).toFixed(2)} mg CO2e`;
  return `${(grams * 1_000_000).toFixed(2)} µg CO2e`;
}

function formatEnergy(joules: number) {
  if (joules >= 1000) return `${(joules / 1000).toFixed(2)} kJ`;
  if (joules >= 1) return `${joules.toFixed(2)} J`;
  if (joules >= 0.001) return `${(joules * 1000).toFixed(2)} mJ`;
  return `${(joules * 1_000_000).toFixed(2)} µJ`;
}

function formatKwh(kWh: number) {
  if (kWh >= 1) return `${kWh.toFixed(2)} kWh`;
  return `${(kWh * 1000).toFixed(2)} Wh`;
}
