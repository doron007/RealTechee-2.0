import Image from 'next/image';
import P3 from '../typography/P3';
import H2 from '../typography/H2';
import P2 from '../typography/P2';
import { Section } from '../../components/common/layout';

interface MissionSectionProps {
  label?: string;
  title?: string;
  content?: string[];
  imageSrc?: string;
  imageAlt?: string;
}

const DEFAULT_CONTENT = {
  label: "OUR MISSION",
  title: "Creating Value Through Technology",
  content: [
    "At RealTechee, our mission is to transform how real estate professionals deliver value to their clients through innovative technology solutions. We believe that the right tools can create extraordinary outcomes for all stakeholders in the real estate ecosystem.",
    "We're committed to developing platforms that enable seamless collaboration, provide transparent communication, and deliver measurable results. By connecting agents, homeowners, designers, and contractors in a unified ecosystem, we create efficiencies that translate into real value.",
    "Our guiding principle is simple: when we help real estate professionals succeed, their clients win, and communities thrive."
  ],
  imageSrc: "/assets/icons/pages_about_mission.svg",
  imageAlt: "RealTechee Mission"
}

export const MissionSection: React.FC<MissionSectionProps> = ({
  label = DEFAULT_CONTENT.label,
  title = DEFAULT_CONTENT.title,
  content = DEFAULT_CONTENT.content,
  imageSrc = DEFAULT_CONTENT.imageSrc,
  imageAlt = DEFAULT_CONTENT.imageAlt,
}) => {
  return (
    <Section id="our-mission" background="light" spacing="large">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
        <div className="order-2 md:order-1 relative h-[400px] md:h-[500px] rounded-lg overflow-hidden">
          <Image 
            src={imageSrc}
            alt={imageAlt}
            fill
            className="object-cover rounded-lg shadow-lg hover:scale-105 transition-transform duration-700"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        </div>
        <div className="order-1 md:order-2">
          <P3 className="text-[#E9664A] uppercase tracking-[0.18em] font-bold mb-3">
            {label}
          </P3>
          <H2 className="mb-6">
            {title}
          </H2>
          <div className="space-y-5 md:space-y-6">
            {content.map((paragraph, index) => (
              <P2 key={index} className="text-medium-gray">
                {paragraph}
              </P2>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
};

export default MissionSection;
