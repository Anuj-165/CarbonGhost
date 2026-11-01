import { useEffect, useState } from 'react';

export const APP_ROOT = '#/app';

export const APP_SCREENS = ['overview', 'workbench', 'history', 'methodology', 'settings'] as const;
export type AppScreen = (typeof APP_SCREENS)[number];

export type Route =
  | { kind: 'landing' }
  | { kind: 'app'; screen: AppScreen; runId: string | null };

export function parseRoute(hash: string): Route {
  if (hash !== APP_ROOT && !hash.startsWith(`${APP_ROOT}/`)) return { kind: 'landing' };
  const [screenSegment = 'workbench', runId = null] = hash.slice(APP_ROOT.length).split('/').filter(Boolean);
  const screen = (APP_SCREENS as readonly string[]).includes(screenSegment) ? (screenSegment as AppScreen) : 'workbench';
  return { kind: 'app', screen, runId: screen === 'history' ? runId : null };
}

export function appHash(screen: AppScreen, runId?: string): string {
  if (screen === 'workbench') return APP_ROOT;
  return runId ? `${APP_ROOT}/${screen}/${runId}` : `${APP_ROOT}/${screen}`;
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash));

  useEffect(() => {
    const handle = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener('hashchange', handle);
    return () => window.removeEventListener('hashchange', handle);
  }, []);

  return route;
}
