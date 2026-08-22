import { LandingPageContent } from '@/components/landing/LandingPageContent';
import { renderPugTemplate } from '@/lib/pug';

export default function LandingPage() {
  const heroHtml = renderPugTemplate('landing-hero.pug');

  return <LandingPageContent heroHtml={heroHtml} />;
}
