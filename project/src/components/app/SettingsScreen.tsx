import { useState } from 'react';
import { LogOut } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { NumericInput } from '@/components/app/ConfigBar';
import type { EnergySettings } from '@/lib/settings/settingsRepository';
import { supabase } from '@/lib/supabase';

const RANGES = {
  powerW: { min: 0.1, max: 1000 },
  intensityGPerKWh: { min: 1, max: 2000 },
  uncertaintyPercent: { min: 0, max: 100 },
  executionsPerDay: { min: 1, max: 10_000_000 },
};

interface SettingsScreenProps {
  session: Session;
  settings: EnergySettings;
  onSave: (next: EnergySettings) => Promise<void>;
}

export default function SettingsScreen({ session, settings, onSave }: SettingsScreenProps) {
  const [draft, setDraft] = useState<EnergySettings>(settings);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const dirty =
    draft.powerW !== settings.powerW ||
    draft.intensityGPerKWh !== settings.intensityGPerKWh ||
    draft.powerUncertainty !== settings.powerUncertainty ||
    draft.intensityUncertainty !== settings.intensityUncertainty ||
    draft.executionsPerDay !== settings.executionsPerDay;

  const problem = validate(draft);

  const save = async () => {
    if (problem) return;
    setSaving(true);
    setNotice(null);
    try {
      await onSave(draft);
      setNotice({ tone: 'ok', text: 'Settings saved. New comparisons will start with these values.' });
    } catch (error) {
      setNotice({ tone: 'error', text: error instanceof Error ? error.message : 'Settings could not be saved.' });
    } finally {
      setSaving(false);
    }
  };

  const signOut = async () => {
    setSigningOut(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setNotice({ tone: 'error', text: error.message });
      setSigningOut(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-[860px] flex-col gap-14 px-5 py-12 lg:px-8 lg:py-16">
      <section className="flex flex-col gap-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-sage">Account</p>
        <div className="flex flex-col gap-6 border-y border-graphite py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[15px] text-paper">{session.user.email}</p>
            <p className="mt-1 text-[13px] text-sage">Saved comparisons are visible only to this account.</p>
          </div>
          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            className="flex h-10 items-center gap-2 border border-graphite px-4 text-[13px] text-paper transition-colors duration-300 hover:border-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-chartreuse disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            {signingOut ? 'Signing out' : 'Sign out'}
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-sage">Default energy assumptions</p>
          <p className="max-w-xl text-[14px] leading-[1.6] text-sage">
            New comparisons start with these modeled values. Each saved run keeps the values it was measured with. Every
            energy figure is an estimate, not a meter reading.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <NumericInput
            label="Power draw (W)"
            value={draft.powerW}
            min={RANGES.powerW.min}
            max={RANGES.powerW.max}
            disabled={saving}
            onChange={(value) => setDraft((current) => ({ ...current, powerW: value }))}
          />
          <NumericInput
            label="Grid intensity (gCO2e/kWh)"
            value={draft.intensityGPerKWh}
            min={RANGES.intensityGPerKWh.min}
            max={RANGES.intensityGPerKWh.max}
            disabled={saving}
            onChange={(value) => setDraft((current) => ({ ...current, intensityGPerKWh: value }))}
          />
          <NumericInput
            label="Power uncertainty (%)"
            value={Math.round(draft.powerUncertainty * 100)}
            min={RANGES.uncertaintyPercent.min}
            max={RANGES.uncertaintyPercent.max}
            disabled={saving}
            onChange={(value) => setDraft((current) => ({ ...current, powerUncertainty: value / 100 }))}
          />
          <NumericInput
            label="Intensity uncertainty (%)"
            value={Math.round(draft.intensityUncertainty * 100)}
            min={RANGES.uncertaintyPercent.min}
            max={RANGES.uncertaintyPercent.max}
            disabled={saving}
            onChange={(value) => setDraft((current) => ({ ...current, intensityUncertainty: value / 100 }))}
          />
          <NumericInput
            label="Executions per day"
            value={draft.executionsPerDay}
            min={RANGES.executionsPerDay.min}
            max={RANGES.executionsPerDay.max}
            disabled={saving}
            onChange={(value) => setDraft((current) => ({ ...current, executionsPerDay: value }))}
          />
        </div>

        {problem && (
          <p role="alert" className="border-l-2 border-chartreuse pl-3 text-[13px] text-paper">
            {problem}
          </p>
        )}
        {notice && (
          <p role="status" className={`text-[13px] ${notice.tone === 'error' ? 'border-l-2 border-chartreuse pl-3 text-paper' : 'text-chartreuse'}`}>
            {notice.text}
          </p>
        )}

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={save}
            disabled={!dirty || saving || problem !== null}
            className="h-11 bg-chartreuse px-6 text-[14px] font-medium text-ink transition-[transform,opacity] duration-300 hover:-translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chartreuse disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? 'Saving' : 'Save settings'}
          </button>
          <button
            type="button"
            onClick={() => setDraft(settings)}
            disabled={!dirty || saving}
            className="h-11 px-4 text-[13px] text-sage transition-colors duration-300 hover:text-paper disabled:opacity-40"
          >
            Discard changes
          </button>
        </div>
      </section>
    </div>
  );
}

function validate(draft: EnergySettings): string | null {
  if (!inRange(draft.powerW, RANGES.powerW)) return `Power draw must be between ${RANGES.powerW.min} and ${RANGES.powerW.max} W.`;
  if (!inRange(draft.intensityGPerKWh, RANGES.intensityGPerKWh)) {
    return `Grid intensity must be between ${RANGES.intensityGPerKWh.min} and ${RANGES.intensityGPerKWh.max} gCO2e/kWh.`;
  }
  if (!inRange(draft.powerUncertainty * 100, RANGES.uncertaintyPercent)) return 'Power uncertainty must be between 0 and 100%.';
  if (!inRange(draft.intensityUncertainty * 100, RANGES.uncertaintyPercent)) return 'Intensity uncertainty must be between 0 and 100%.';
  if (!inRange(draft.executionsPerDay, RANGES.executionsPerDay)) {
    return `Executions per day must be between ${RANGES.executionsPerDay.min} and ${RANGES.executionsPerDay.max.toLocaleString()}.`;
  }
  return null;
}

function inRange(value: number, range: { min: number; max: number }) {
  return Number.isFinite(value) && value >= range.min && value <= range.max;
}
