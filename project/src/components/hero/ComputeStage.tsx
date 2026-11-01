import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import {
  advanceParticles,
  createStreams,
  END_X,
  pointAt,
  START_X,
  type Stream,
  type StreamTrack,
} from '@/lib/computeStreamModel';

const COLOR = {
  ink: '#101713',
  sage: '#8FA596',
  sageBright: '#C4D1C7',
  chartreuse: '#C7F36B',
  paper: '#F4F2E9',
};

const LABEL_FONT = '500 10px "JetBrains Mono", ui-monospace, monospace';
const GRID_STEP = 48;
const TAU = Math.PI * 2;

export default function ComputeStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const pointer = { x: 0.5, y: 0.5 };
    const eased = { x: 0.5, y: 0.5 };
    let width = 0;
    let height = 0;
    let streams: { baseline: Stream; optimized: Stream } | null = null;
    let elapsed = 0;
    let last = 0;
    let frameId = 0;
    let running = false;

    const drawBackground = (fade: number) => {
      ctx.fillStyle = `rgb(16 23 19 / ${fade})`;
      ctx.fillRect(0, 0, width, height);

      const offsetX = (eased.x - 0.5) * -14;
      const offsetY = (eased.y - 0.5) * -10;
      ctx.strokeStyle = 'rgb(244 242 233 / 0.035)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = (offsetX % GRID_STEP) - GRID_STEP; x <= width + GRID_STEP; x += GRID_STEP) {
        ctx.moveTo(Math.round(x) + 0.5, 0);
        ctx.lineTo(Math.round(x) + 0.5, height);
      }
      for (let y = (offsetY % GRID_STEP) - GRID_STEP; y <= height + GRID_STEP; y += GRID_STEP) {
        ctx.moveTo(0, Math.round(y) + 0.5);
        ctx.lineTo(width, Math.round(y) + 0.5);
      }
      ctx.stroke();
    };

    const strokeTrack = (track: StreamTrack, color: string) => {
      ctx.beginPath();
      track.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    const label = (text: string, x: number, y: number, color: string, align: CanvasTextAlign) => {
      ctx.font = LABEL_FONT;
      ctx.fillStyle = color;
      ctx.textAlign = align;
      ctx.fillText(text, x, y);
    };

    const drawInstrument = () => {
      if (!streams) return;
      const ix = width * END_X;
      const top = height * 0.14;
      const bottom = height * 0.86;
      const span = bottom - top;

      ctx.strokeStyle = 'rgb(199 243 107 / 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(Math.round(ix - 30) + 0.5, Math.round(top) + 0.5, 60, Math.round(span));

      ctx.beginPath();
      for (let i = 0; i <= 20; i++) {
        const y = Math.round(top + (span * i) / 20) + 0.5;
        const len = i % 5 === 0 ? 10 : 5;
        ctx.moveTo(ix + 30, y);
        ctx.lineTo(ix + 30 + len, y);
      }
      ctx.strokeStyle = 'rgb(143 165 150 / 0.6)';
      ctx.stroke();

      const scanPhase = (elapsed * 0.2) % 1;
      const scanY = top + scanPhase * span;
      const scan = ctx.createLinearGradient(0, scanY - 14, 0, scanY);
      scan.addColorStop(0, 'rgb(199 243 107 / 0)');
      scan.addColorStop(1, 'rgb(199 243 107 / 0.35)');
      ctx.fillStyle = scan;
      ctx.fillRect(ix - 30, scanY - 14, 60, 14);
      ctx.fillStyle = COLOR.chartreuse;
      ctx.fillRect(ix - 30, scanY, 60, 1);

      label('MEASURE', ix, top - 14, COLOR.sage, 'center');

      const pulse = (elapsed * 0.7) % 1;
      ctx.beginPath();
      ctx.arc(ix, height * 0.5, 6 + pulse * 16, 0, TAU);
      ctx.strokeStyle = `rgb(199 243 107 / ${0.5 * (1 - pulse)})`;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(ix, height * 0.5, 3.5, 0, TAU);
      ctx.fillStyle = COLOR.chartreuse;
      ctx.fill();
    };

    const drawSource = () => {
      const x = width * START_X;
      const y = height * 0.5;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, TAU);
      ctx.fillStyle = COLOR.sage;
      ctx.fill();
      label('INPUT', x, y - 16, COLOR.sage, 'left');
      label('identical for both', x, y + 22, COLOR.sage, 'left');
    };

    const drawParticles = (stream: Stream, color: string, radius: number) => {
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.fillStyle = color;
      for (const particle of stream.particles) {
        const p = pointAt(stream.track, particle.u);
        ctx.beginPath();
        ctx.arc(p.x, p.y + particle.lane, radius, 0, TAU);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    };

    const render = (animate: boolean) => {
      if (!streams) return;
      drawBackground(animate ? 0.2 : 1);
      strokeTrack(streams.baseline.track, 'rgb(143 165 150 / 0.28)');
      strokeTrack(streams.optimized.track, 'rgb(199 243 107 / 0.3)');

      const congestionPoint = pointAt(streams.baseline.track, 0.5);
      label('CONGESTION', congestionPoint.x, congestionPoint.y - 18, COLOR.sage, 'center');

      drawSource();
      drawInstrument();
      drawParticles(streams.baseline, COLOR.sageBright, 2.2);
      drawParticles(streams.optimized, COLOR.chartreuse, 2.6);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      streams = createStreams(width, height);
      if (reduceMotion) render(false);
    };

    const loop = (now: number) => {
      if (!running) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      elapsed += dt;
      eased.x += (pointer.x - eased.x) * 0.06;
      eased.y += (pointer.y - eased.y) * 0.06;
      if (streams) {
        advanceParticles(streams.baseline, dt);
        advanceParticles(streams.optimized, dt);
      }
      render(true);
      frameId = requestAnimationFrame(loop);
    };

    const start = () => {
      if (running || reduceMotion) return;
      running = true;
      last = performance.now();
      frameId = requestAnimationFrame(loop);
    };

    const stop = () => {
      running = false;
      cancelAnimationFrame(frameId);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = (event.clientX - rect.left) / rect.width;
      pointer.y = (event.clientY - rect.top) / rect.height;
    };

    const handlePointerLeave = () => {
      pointer.x = 0.5;
      pointer.y = 0.5;
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    const visibilityObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) start();
      else stop();
    });
    visibilityObserver.observe(canvas);

    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      stop();
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [reduceMotion]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="Animated comparison: an identical input passes through a congested baseline path and a shorter optimized path, both converging on a measurement instrument."
      className="block h-[300px] w-full md:h-[380px] lg:h-[430px]"
    />
  );
}
