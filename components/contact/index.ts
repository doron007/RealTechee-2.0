// Contact page components barrel file
import Contact from './Contact';
import ContactScenarioSelector from './ContactScenarioSelector';
import ProcessStepCard from './ProcessStepCard';
import ContactHeroSection from './ContactHeroSection';
import ContactContentSection from './ContactContentSection';
import ContactMapSection from './ContactMapSection';

export {
  Contact,
  ContactScenarioSelector,
  ProcessStepCard,
  ContactHeroSection,
  ContactContentSection,
  ContactMapSection
};

// Also export the ContactType enum
export { ContactType } from './ContactHeroSection';

export default Contact;