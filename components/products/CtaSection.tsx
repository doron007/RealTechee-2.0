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
      title="Get Started"
      subtitle="You'll receive a free estimate within 48 hours."
      buttonText="Get an Estimate"
      buttonLink="/contact/get-estimate"
    />
  );
}