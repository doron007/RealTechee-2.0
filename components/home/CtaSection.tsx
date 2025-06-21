import { CtaSection as CommonCtaSection } from '../common/sections';

/**
 * @deprecated Use the CtaSection component from common/sections directly
 * import { CtaSection } from '../common/sections';
 * 
 * This component is kept for backward compatibility.
 */
export default function CtaSection() {
  return (
    <CommonCtaSection 
      title="Ready to win more big deals faster?"
      subtitle="Get a Renovation Estimate Today"
      buttonText="Get an Estimate"
      buttonLink="/contact/get-estimate"
    />
  );
}