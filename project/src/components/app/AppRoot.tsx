import AppShell from '@/components/app/AppShell';
import AuthPanel from '@/components/app/AuthPanel';
import ComparisonWorkspace from '@/components/app/ComparisonWorkspace';
import type { Command } from '@/components/app/CommandPalette';
import { HistoryScreen } from '@/components/app/HistoryScreen';
import MethodologyScreen from '@/components/app/MethodologyScreen';
import OverviewScreen from '@/components/app/OverviewScreen';
import SettingsScreen from '@/components/app/SettingsScreen';
import { useWorkbench } from '@/lib/benchmark/useWorkbench';
import { useAuthSession } from '@/lib/auth/useAuthSession';
import { useSettings } from '@/lib/settings/useSettings';
import type { EnergySettings } from '@/lib/settings/settingsRepository';
import { supabase } from '@/lib/supabase';
import { appHash, type AppScreen } from '@/lib/useRoute';
import type { StoredOutcome } from '@/lib/runs/runRepository';
import type { Session } from '@supabase/supabase-js';

const SCREEN_TITLES: Record<AppScreen, string> = {
  overview: 'Overview',
  workbench: 'New comparison',
  history: 'History',
  methodology: 'Methodology',
  settings: 'Settings',
};

interface AppRootProps {
  screen: AppScreen;
  runId: string | null;
}

export default function AppRoot({ screen, runId }: AppRootProps) {
  const auth = useAuthSession();

  if (!auth.ready) return <div className="min-h-screen bg-ink" aria-busy="true" />;
  if (!auth.session) return <AuthPanel />;

  return <SettingsGate screen={screen} runId={runId} session={auth.session} />;
}

function SettingsGate({ screen, runId, session }: AppRootProps & { session: Session }) {
  const { state, retry, save } = useSettings();

  if (state.status === 'loading') return <div className="min-h-screen bg-ink" aria-busy="true" />;
  if (state.status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink px-6 font-sans text-paper">
        <div className="max-w-sm">
          <p role="alert" className="border-l-2 border-chartreuse pl-3 text-[14px] leading-[1.6]">
            Your settings could not be loaded: {state.message}
          </p>
          <button
            type="button"
            onClick={retry}
            className="mt-6 h-10 border border-graphite px-4 text-[13px] transition-colors duration-300 hover:border-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-chartreuse"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <SignedInWorkspace
      screen={screen}
      runId={runId}
      session={session}
      settings={state.settings}
      onSaveSettings={save}
    />
  );
}

interface SignedInWorkspaceProps extends AppRootProps {
  session: Session;
  settings: EnergySettings;
  onSaveSettings: (next: EnergySettings) => Promise<void>;
}

function SignedInWorkspace({ screen, runId, session, settings, onSaveSettings }: SignedInWorkspaceProps) {
  const workbench = useWorkbench(settings);
  const { run, start, reset, environment, executionLabel, executionTone, reproduce } = workbench;
  const running = run.status === 'running';

  const commands: Command[] = [
    {
      id: 'run-comparison',
      label: 'Run comparison',
      hint: 'Workbench',
      disabled: running,
      onSelect: () => {
        window.location.hash = appHash('workbench');
        start();
      },
    },
    {
      id: 'edit-configuration',
      label: 'Edit configuration',
      hint: 'Workbench',
      disabled: running,
      onSelect: () => {
        window.location.hash = appHash('workbench');
        reset();
      },
    },
    {
      id: 'sign-out',
      label: 'Sign out',
      hint: 'Account',
      onSelect: () => {
        void supabase.auth.signOut();
      },
    },
  ];

  const reproduceRun = (stored: StoredOutcome) => {
    reproduce(stored);
    window.location.hash = appHash('workbench');
  };

  return (
    <AppShell
      screen={screen}
      commands={commands}
      executionLabel={executionLabel}
      executionTone={executionTone}
      environmentLabel={environment?.runtime ?? 'Browser'}
      title={SCREEN_TITLES[screen]}
    >
      {screen === 'workbench' && <ComparisonWorkspace workbench={workbench} />}
      {screen === 'overview' && <OverviewScreen />}
      {screen === 'history' && <HistoryScreen runId={runId} onReproduce={reproduceRun} />}
      {screen === 'methodology' && <MethodologyScreen />}
      {screen === 'settings' && <SettingsScreen session={session} settings={settings} onSave={onSaveSettings} />}
    </AppShell>
  );
}
