import { useState } from 'react';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import CarbonGhostLogo from '@/components/brand/CarbonGhostLogo';
import ButtonLink from '@/components/ui/ButtonLink';

const NAV_LINKS = [
  { label: 'Product', href: '#proof' },
  { label: 'Methodology', href: '#methodology' },
  { label: 'Documentation', href: '#docs' },
];

export default function SiteNav() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useMotionValueEvent(scrollY, 'change', (latest) => setScrolled(latest > 24));

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color] duration-500 ${
        scrolled || open ? 'border-graphite bg-ink/95 backdrop-blur-md' : 'border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6 lg:px-12">
        <a href="#top" aria-label="CarbonGhost home" className="rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-chartreuse">
          <CarbonGhostLogo />
        </a>

        <nav aria-label="Primary" className="hidden items-center gap-9 md:flex">
          {NAV_LINKS.map((link) => (
            <a key={link.label} href={link.href} className="group relative text-sm text-paper/75 transition-colors duration-300 hover:text-paper">
              {link.label}
              <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-chartreuse transition-transform duration-500 group-hover:scale-x-100" aria-hidden />
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-6 md:flex">
          <a href="#" className="text-sm text-paper/75 transition-colors duration-300 hover:text-paper">
            Sign in
          </a>
          <ButtonLink href="#/app" className="h-9 px-4 text-[13px]">
            Run your first benchmark
          </ButtonLink>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="flex h-10 w-10 items-center justify-center text-paper md:hidden"
        >
          {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-graphite md:hidden"
          >
            <nav aria-label="Mobile" className="flex flex-col gap-1 px-6 py-6">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="py-3 font-display text-3xl text-paper transition-colors hover:text-chartreuse"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-6 flex flex-col gap-4" onClick={() => setOpen(false)}>
                <ButtonLink href="#/app" className="justify-center">
                  Run your first benchmark
                </ButtonLink>
                <a href="#" className="py-2 text-center text-sm text-paper/75">
                  Sign in
                </a>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
