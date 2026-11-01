import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_ASSUMPTIONS } from '@/lib/benchmark/examples';
import { loadSettings, saveSettings, type EnergySettings } from '@/lib/settings/settingsRepository';

export type SettingsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; settings: EnergySettings };

export function useSettings() {
  const [state, setState] = useState<SettingsState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setState({ status: 'loading' });
    loadSettings()
      .then((saved) => {
        if (active) setState({ status: 'ready', settings: saved ?? DEFAULT_ASSUMPTIONS });
      })
      .catch((error: Error) => {
        if (active) setState({ status: 'error', message: error.message });
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  const save = useCallback(async (next: EnergySettings) => {
    await saveSettings(next);
    setState({ status: 'ready', settings: next });
  }, []);

  return { state, retry, save };
}
