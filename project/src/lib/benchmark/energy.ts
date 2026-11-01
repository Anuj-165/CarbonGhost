export interface EnergyAssumptions {
  powerW: number | null;
  intensityGPerKWh: number | null;
  powerUncertainty: number;
  intensityUncertainty: number;
  executionsPerDay: number;
}

export interface EnergyEstimate {
  joulesPerCall: number;
  kWhPerCall: number;
  gCo2ePerCall: number;
  lowGCo2e: number;
  highGCo2e: number;
  relativeUncertainty: number;
  annualKWh: number;
  annualGCo2e: number;
}

const JOULES_PER_KWH = 3_600_000;

/**
 * Estimates energy from measured runtime and assumed power. The relative
 * uncertainty combines the standard error of the measured median with the
 * user-stated power and carbon-intensity ranges, assuming they are independent.
 */
export function estimateEnergy(
  perCallMs: number,
  runtimeCv: number,
  sampleCount: number,
  assumptions: EnergyAssumptions,
): EnergyEstimate | null {
  const { powerW, intensityGPerKWh } = assumptions;
  if (powerW === null || intensityGPerKWh === null || sampleCount < 1) return null;

  const joulesPerCall = powerW * (perCallMs / 1000);
  const kWhPerCall = joulesPerCall / JOULES_PER_KWH;
  const gCo2ePerCall = kWhPerCall * intensityGPerKWh;

  const standardError = runtimeCv / Math.sqrt(sampleCount);
  const relativeUncertainty = Math.sqrt(
    standardError ** 2 + assumptions.powerUncertainty ** 2 + assumptions.intensityUncertainty ** 2,
  );

  const runsPerYear = assumptions.executionsPerDay * 365;
  const annualKWh = kWhPerCall * runsPerYear;

  return {
    joulesPerCall,
    kWhPerCall,
    gCo2ePerCall,
    lowGCo2e: gCo2ePerCall * Math.max(0, 1 - relativeUncertainty),
    highGCo2e: gCo2ePerCall * (1 + relativeUncertainty),
    relativeUncertainty,
    annualKWh,
    annualGCo2e: annualKWh * intensityGPerKWh,
  };
}
