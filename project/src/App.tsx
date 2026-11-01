import { MotionConfig } from 'framer-motion';
import SiteNav from '@/components/layout/SiteNav';
import SiteFooter from '@/components/layout/SiteFooter';
import Hero from '@/components/hero/Hero';
import InvisibleCost from '@/components/sections/InvisibleCost';
import ProofReport from '@/components/sections/ProofReport';
import HowItWorks from '@/components/sections/HowItWorks';
import Methodology from '@/components/sections/Methodology';
import ClosingCta from '@/components/sections/ClosingCta';
import AppRoot from '@/components/app/AppRoot';
import { useRoute } from '@/lib/useRoute';

function LandingPage() {
  return (
    <div className="min-h-screen bg-ink font-sans text-paper">
      <SiteNav />
      <main>
        <Hero />
        <InvisibleCost />
        <ProofReport />
        <HowItWorks />
        <Methodology />
        <ClosingCta />
      </main>
      <SiteFooter />
    </div>
  );
}

function App() {
  const route = useRoute();

  return (
    <MotionConfig reducedMotion="user">
      {route.kind === 'landing' ? <LandingPage /> : <AppRoot screen={route.screen} runId={route.runId} />}
    </MotionConfig>
  );
}

export default App;
