import { useEffect, useRef } from 'react';
import { animate, motion, useInView, useMotionValue, useTransform } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  suffix?: string;
  duration?: number;
  className?: string;
}

export default function AnimatedNumber({
  value,
  decimals = 2,
  suffix = '',
  duration = 1.4,
  className = '',
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const motionValue = useMotionValue(0);
  const display = useTransform(motionValue, (latest) => latest.toFixed(decimals));

  useEffect(() => {
    if (!inView) return;
    const controls = animate(motionValue, value, { duration, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [inView, value, duration, motionValue]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      <motion.span>{display}</motion.span>
      {suffix}
    </span>
  );
}
