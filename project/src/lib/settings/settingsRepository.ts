import {
  DEMO_SESSION_KEY,
  type DemoSession,
} from '@/lib/auth/useAuthSession';

export interface EnergySettings {
  powerW: number;
  intensityGPerKWh: number;
  powerUncertainty: number;
  intensityUncertainty: number;
  executionsPerDay: number;
}

function getSettingsStorageKey(): string {
  const rawSession = localStorage.getItem(DEMO_SESSION_KEY);

  if (!rawSession) {
    throw new Error('Sign in again to access your settings.');
  }

  let session: DemoSession;

  try {
    session = JSON.parse(rawSession) as DemoSession;
  } catch {
    throw new Error('Your demo session is invalid. Please sign in again.');
  }

  if (!session.email?.trim()) {
    throw new Error('Your demo session is invalid. Please sign in again.');
  }

  return `carbonghost_demo_settings:${session.email.trim().toLowerCase()}`;
}

export async function loadSettings(): Promise<EnergySettings | null> {
  const key = getSettingsStorageKey();
  const raw = localStorage.getItem(key);

  if (!raw) return null;

  try {
    const settings = JSON.parse(raw) as EnergySettings;

    const valid =
      Number.isFinite(settings.powerW) &&
      Number.isFinite(settings.intensityGPerKWh) &&
      Number.isFinite(settings.powerUncertainty) &&
      Number.isFinite(settings.intensityUncertainty) &&
      Number.isFinite(settings.executionsPerDay);

    if (!valid) {
      localStorage.removeItem(key);
      return null;
    }

    return settings;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

export async function saveSettings(
  settings: EnergySettings,
): Promise<void> {
  const key = getSettingsStorageKey();

  localStorage.setItem(key, JSON.stringify(settings));
}