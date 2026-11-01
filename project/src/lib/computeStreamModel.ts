export interface Point {
  x: number;
  y: number;
}

export interface StreamTrack {
  points: Point[];
  cumulative: number[];
  total: number;
  duration: number;
  slowdown: (u: number) => number;
}

export interface Particle {
  u: number;
  lane: number;
}

export interface Stream {
  track: StreamTrack;
  particles: Particle[];
}

export const START_X = 0.07;
export const END_X = 0.84;

const SAMPLES = 260;
const BASELINE_DURATION = 4.2;
const OPTIMIZED_DURATION = 2.4;
const BASELINE_PARTICLES = 34;
const OPTIMIZED_PARTICLES = 14;

const baselineShape = (t: number) =>
  Math.pow(Math.sin(Math.PI * t), 0.7) * (0.14 * Math.sin(t * 10) + 0.05 * Math.sin(t * 27));

const optimizedShape = (t: number) => Math.sin(Math.PI * t) * 0.03 * Math.sin(t * 4);

const congestion = (u: number) => {
  const d = (u - 0.5) / 0.09;
  return 1 - 0.62 * Math.exp(-d * d);
};

const straight = () => 1;

function buildTrack(
  width: number,
  height: number,
  shape: (t: number) => number,
  slowdown: (u: number) => number,
  duration: number,
): StreamTrack {
  const points: Point[] = [];
  const cumulative: number[] = [0];

  for (let i = 0; i <= SAMPLES; i++) {
    const t = i / SAMPLES;
    points.push({
      x: width * (START_X + (END_X - START_X) * t),
      y: height * (0.5 + shape(t)),
    });
    if (i > 0) {
      const a = points[i - 1];
      const b = points[i];
      cumulative.push(cumulative[i - 1] + Math.hypot(b.x - a.x, b.y - a.y));
    }
  }

  return { points, cumulative, total: cumulative[cumulative.length - 1], duration, slowdown };
}

function spawnParticles(count: number, laneSpread: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    u: (i + Math.random() * 0.6) / count,
    lane: (Math.random() - 0.5) * laneSpread,
  }));
}

export function createStreams(width: number, height: number) {
  const baselineTrack = buildTrack(width, height, baselineShape, congestion, BASELINE_DURATION);
  const optimizedTrack = buildTrack(width, height, optimizedShape, straight, OPTIMIZED_DURATION);

  return {
    baseline: {
      track: baselineTrack,
      particles: spawnParticles(BASELINE_PARTICLES, height * 0.05),
    } satisfies Stream,
    optimized: {
      track: optimizedTrack,
      particles: spawnParticles(OPTIMIZED_PARTICLES, height * 0.008),
    } satisfies Stream,
  };
}

export function advanceParticles(stream: Stream, dt: number) {
  const { track, particles } = stream;
  for (const particle of particles) {
    particle.u += (dt / track.duration) * track.slowdown(particle.u);
    if (particle.u >= 1) particle.u -= 1;
  }
}

export function pointAt(track: StreamTrack, u: number): Point {
  const target = Math.min(Math.max(u, 0), 1) * track.total;
  let lo = 0;
  let hi = track.cumulative.length - 1;

  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (track.cumulative[mid] <= target) lo = mid;
    else hi = mid;
  }

  const segment = track.cumulative[hi] - track.cumulative[lo];
  const f = segment === 0 ? 0 : (target - track.cumulative[lo]) / segment;
  const a = track.points[lo];
  const b = track.points[hi];

  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
}
