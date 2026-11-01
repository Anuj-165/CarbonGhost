import { supabase } from '@/lib/supabase';

export interface EnergySettings {
  powerW: number;
  intensityGPerKWh: number;
  powerUncertainty: number;
  intensityUncertainty: number;
  executionsPerDay: number;
}

interface SettingsRow {
  power_w: number;
  intensity_g_per_kwh: number;
  power_uncertainty: number;
  intensity_uncertainty: number;
  executions_per_day: number;
}

const COLUMNS = 'power_w, intensity_g_per_kwh, power_uncertainty, intensity_uncertainty, executions_per_day';

export async function loadSettings(): Promise<EnergySettings | null> {
  const { data, error } = await supabase.from('user_settings').select(COLUMNS).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const row = data as SettingsRow;
  return {
    powerW: row.power_w,
    intensityGPerKWh: row.intensity_g_per_kwh,
    powerUncertainty: row.power_uncertainty,
    intensityUncertainty: row.intensity_uncertainty,
    executionsPerDay: row.executions_per_day,
  };
}

export async function saveSettings(settings: EnergySettings): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error('Sign in again to save your settings.');

  const { error } = await supabase.from('user_settings').upsert(
    {
      user_id: userData.user.id,
      power_w: settings.powerW,
      intensity_g_per_kwh: settings.intensityGPerKWh,
      power_uncertainty: settings.powerUncertainty,
      intensity_uncertainty: settings.intensityUncertainty,
      executions_per_day: settings.executionsPerDay,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
  if (error) throw new Error(error.message);
}
