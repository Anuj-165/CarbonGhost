import { motion, type HTMLMotionProps } from 'framer-motion';

interface RevealProps extends HTMLMotionProps<'div'> {
  delay?: number;
}

export default function Reveal({ delay = 0, children, className = '', ...rest }: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
