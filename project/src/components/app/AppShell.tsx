import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, History, Home, LayoutDashboard, PanelLeft, Plus, Search, Settings } from 'lucide-react';
import CarbonGhostLogo, { CarbonGhostMark } from '@/components/brand/CarbonGhostLogo';
import { appHash, type AppScreen } from '@/lib/useRoute';
import CommandPalette, { type Command } from '@/components/app/CommandPalette';

export type ExecutionTone = 'idle' | 'running' | 'success' | 'attention';

interface AppShellProps {
  children: ReactNode;
  screen: AppScreen;
  commands: Command[];
  executionLabel: string;
  executionTone: ExecutionTone;
  environmentLabel: string;
  title: string;
}

const APP_NAV_TARGETS: AppScreen[] = ['overview', 'workbench', 'history', 'methodology', 'settings'];

const NAV_LABELS: Record<AppScreen, string> = {
  overview: 'overview',
  workbench: 'new comparison',
  history: 'history',
  methodology: 'methodology',
  settings: 'settings',
};

const TONE_CLASS: Record<ExecutionTone, string> = {
  idle: 'bg-sage',
  running: 'bg-chartreuse animate-pulse',
  success: 'bg-chartreuse',
  attention: 'bg-paper',
};

export default function AppShell({
  children,
  screen,
  commands,
  executionLabel,
  executionTone,
  environmentLabel,
  title,
}: AppShellProps) {
  const [expanded, setExpanded] = useState(() => window.innerWidth >= 1280);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const railItems: { label: string; href: string; icon: typeof Plus; screen: AppScreen | null }[] = [
    { label: 'Overview', href: appHash('overview'), icon: LayoutDashboard, screen: 'overview' },
    { label: 'New comparison', href: appHash('workbench'), icon: Plus, screen: 'workbench' },
    { label: 'History', href: appHash('history'), icon: History, screen: 'history' },
    { label: 'Methodology', href: appHash('methodology'), icon: BookOpen, screen: 'methodology' },
    { label: 'Settings', href: appHash('settings'), icon: Settings, screen: 'settings' },
    { label: 'Website', href: '#top', icon: Home, screen: null },
  ];

  const paletteCommands = useMemo<Command[]>(
    () => [
      ...commands,
      ...APP_NAV_TARGETS.map((target) => ({
        id: `nav-${target}`,
        label: `Go to ${NAV_LABELS[target]}`,
        hint: 'Navigate',
        onSelect: () => (window.location.hash = appHash(target)),
      })),
      { id: 'nav-website', label: 'Back to website', hint: 'Navigate', onSelect: () => (window.location.hash = '#top') },
    ],
    [commands],
  );

  return (
    <div className="flex h-screen overflow-hidden bg-ink font-sans text-paper print:hidden">
      <motion.aside
        animate={{ width: expanded ? 232 : 64 }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        className="flex shrink-0 flex-col border-r border-graphite bg-ink"
      >
        <div className="flex h-16 items-center justify-between border-b border-graphite px-4">
          <a href="#top" aria-label="CarbonGhost website" className="flex min-w-0 items-center gap-2.5 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-chartreuse">
            {expanded ? <CarbonGhostLogo /> : <CarbonGhostMark className="h-7 w-7" />}
          </a>
        </div>

        <div className="flex flex-col gap-1 p-3">
          {expanded && (
            <p className="px-2 pb-2 pt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-sage">Workspace</p>
          )}
          {railItems.map((item) => {
            const Icon = item.icon;
            const active = item.screen === screen;
            return (
              <a
                key={item.label}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                title={expanded ? undefined : item.label}
                className={`group relative flex h-10 items-center gap-3 rounded-sm px-2.5 text-sm transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-chartreuse ${
                  active ? 'bg-paper/[0.06] text-paper' : 'text-sage hover:bg-paper/[0.04] hover:text-paper'
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-2 bottom-2 w-px bg-chartreuse" aria-hidden />
                )}
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                <AnimatePresence initial={false}>
                  {expanded && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="truncate whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </a>
            );
          })}
        </div>

        <div className="mt-auto border-t border-graphite p-3">
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-label={expanded ? 'Collapse navigation' : 'Expand navigation'}
            aria-expanded={expanded}
            className="flex h-10 w-full items-center gap-3 rounded-sm px-2.5 text-sm text-sage transition-colors duration-300 hover:bg-paper/[0.04] hover:text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-chartreuse"
          >
            <PanelLeft className="h-4 w-4 shrink-0" aria-hidden />
            {expanded && <span>Collapse</span>}
          </button>
        </div>
      </motion.aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-graphite px-5 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <h1 className="truncate font-sans text-[15px] font-medium">{title}</h1>
          </div>

          <div className="flex items-center gap-3 md:gap-5">
            <div className="hidden items-center gap-2 font-mono text-[11px] text-sage xl:flex" title="Execution environment">
              <span className="uppercase tracking-[0.14em]">{environmentLabel}</span>
            </div>
            <div
              className="flex items-center gap-2 border border-graphite px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-paper/85"
              role="status"
              aria-live="polite"
            >
              <span className={`h-1.5 w-1.5 rounded-full ${TONE_CLASS[executionTone]}`} aria-hidden />
              {executionLabel}
            </div>
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="group flex h-9 items-center gap-3 border border-graphite px-3 text-sm text-sage transition-colors duration-300 hover:border-sage hover:text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-chartreuse"
              aria-label="Open command palette"
            >
              <Search className="h-3.5 w-3.5" aria-hidden />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden rounded-sm border border-graphite px-1.5 font-mono text-[10px] text-sage sm:inline">
                Ctrl K
              </kbd>
            </button>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} commands={paletteCommands} />
    </div>
  );
}
