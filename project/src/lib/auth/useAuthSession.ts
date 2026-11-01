import { useEffect, useState } from 'react';

export const DEMO_SESSION_KEY = 'carbonghost_demo_session';

export interface DemoSession {
  email: string;
  loggedInAt: string;
}

export interface AuthState {
  ready: boolean;
  session: DemoSession | null;
}

function readDemoSession(): DemoSession | null {
  try {
    const raw = localStorage.getItem(DEMO_SESSION_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('email' in parsed) ||
      typeof parsed.email !== 'string' ||
      !parsed.email.trim()
    ) {
      return null;
    }

    return {
      email: parsed.email,
      loggedInAt:
        'loggedInAt' in parsed && typeof parsed.loggedInAt === 'string'
          ? parsed.loggedInAt
          : '',
    };
  } catch {
    return null;
  }
}

export function signOutDemoSession(): void {
  localStorage.removeItem(DEMO_SESSION_KEY);
  window.dispatchEvent(new Event('carbonghost-auth-change'));
}

export function useAuthSession(): AuthState {
  const [state, setState] = useState<AuthState>({
    ready: false,
    session: null,
  });

  useEffect(() => {
    const syncSession = () => {
      setState({
        ready: true,
        session: readDemoSession(),
      });
    };

    syncSession();

    window.addEventListener('storage', syncSession);
    window.addEventListener('carbonghost-auth-change', syncSession);

    return () => {
      window.removeEventListener('storage', syncSession);
      window.removeEventListener('carbonghost-auth-change', syncSession);
    };
  }, []);

  return state;
}