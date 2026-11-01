import { Github } from 'lucide-react';
import CarbonGhostLogo from '@/components/brand/CarbonGhostLogo';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Compare implementations', href: '#how-it-works' },
      { label: 'Benchmark reports', href: '#proof' },
      { label: 'Run your first benchmark', href: '#/app' },
    ],
  },
  {
    title: 'Methodology',
    links: [
      { label: 'Runtime measurement', href: '#methodology' },
      { label: 'Memory tracing', href: '#methodology' },
      { label: 'Energy estimation', href: '#methodology' },
    ],
  },
  {
    title: 'Documentation',
    links: [
      { label: 'Quick start', href: '#' },
      { label: 'API reference', href: '#' },
      { label: 'Assumptions and limits', href: '#methodology' },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer id="docs" className="border-t border-graphite bg-ink">
      <div className="mx-auto max-w-[1440px] px-6 py-20 lg:px-12">
        <div className="grid gap-16 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <CarbonGhostLogo />
            <p className="mt-6 max-w-xs font-display text-2xl leading-[1.25] text-sage">
              Write better code. Waste less computation.
            </p>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-7 lg:col-start-6">
            {COLUMNS.map((column) => (
              <div key={column.title}>
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-chartreuse">{column.title}</p>
                <ul className="mt-5 flex flex-col gap-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className="text-sm text-paper/75 transition-colors duration-300 hover:text-paper">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-20 flex flex-col gap-6 border-t border-graphite pt-8 font-mono text-[11px] uppercase tracking-[0.14em] text-sage md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} CarbonGhost. Estimates are modeled, not metered.</span>
          <a href="#" className="inline-flex items-center gap-2 text-paper/75 transition-colors duration-300 hover:text-paper">
            <Github className="h-4 w-4" aria-hidden />
            Source repository
          </a>
        </div>
      </div>
    </footer>
  );
}
