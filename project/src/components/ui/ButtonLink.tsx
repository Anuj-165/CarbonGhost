import type { ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';

type ButtonVariant = 'primary' | 'ghost' | 'dark';

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'bg-chartreuse text-ink hover:bg-chartreuse-600',
  ghost: 'border border-graphite-500/60 text-paper hover:border-sage hover:bg-paper/[0.04]',
  dark: 'bg-ink text-paper hover:bg-graphite',
};

interface ButtonLinkProps {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
}

export default function ButtonLink({
  href,
  children,
  variant = 'primary',
  className = '',
}: ButtonLinkProps) {
  return (
    <a
      href={href}
      className={`group inline-flex h-11 items-center gap-2 rounded-sm px-5 text-sm font-medium transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chartreuse ${VARIANT_CLASS[variant]} ${className}`}
    >
      {children}
      <ArrowUpRight
        className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        aria-hidden
      />
    </a>
  );
}
