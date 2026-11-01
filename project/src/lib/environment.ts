import { useEffect, useState } from 'react';

export interface EnvironmentInfo {
  runtime: string;
  platform: string;
  cores: number | null;
  memoryGb: number | null;
  timerResolutionNote: string;
  crossOriginIsolated: boolean;
  userAgent: string;
  capturedAt: string;
}

function detectRuntime(userAgent: string) {
  if (/Edg\//.test(userAgent)) return 'Chromium (Edge)';
  if (/Chrome\//.test(userAgent)) return 'Chromium';
  if (/Firefox\//.test(userAgent)) return 'Firefox';
  if (/Safari\//.test(userAgent)) return 'Safari';
  return 'Unknown browser';
}

export function captureEnvironment(): EnvironmentInfo {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const userAgent = navigator.userAgent;
  return {
    runtime: detectRuntime(userAgent),
    platform: navigator.platform || 'Unknown platform',
    cores: navigator.hardwareConcurrency ?? null,
    memoryGb: nav.deviceMemory ?? null,
    timerResolutionNote: window.crossOriginIsolated
      ? 'High-resolution timer (cross-origin isolated)'
      : 'Coarsened timer (browser clamps performance.now)',
    crossOriginIsolated: window.crossOriginIsolated,
    userAgent,
    capturedAt: new Date().toISOString(),
  };
}

export function useEnvironment(): EnvironmentInfo | null {
  const [info, setInfo] = useState<EnvironmentInfo | null>(null);
  useEffect(() => setInfo(captureEnvironment()), []);
  return info;
}
