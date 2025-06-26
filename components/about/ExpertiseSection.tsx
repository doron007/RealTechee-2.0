import P3 from '../typography/P3';
import H2 from '../typography/H2';
import H3 from '../typography/H3';
import P2 from '../typography/P2';
import { Section } from '../../components/common/layout';
import { FiDatabase, FiLayout, FiSmartphone, FiShield, FiBarChart2, FiCloud } from 'react-icons/fi';

interface ExpertiseItem {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface ExpertiseSectionProps {
  label?: string;
  title?: string;
  description?: string;
  expertiseItems?: ExpertiseItem[];
}

const DEFAULT_CONTENT = {
  label: "OUR EXPERTISE",
  title: "Technology That Powers Real Estate Innovation",
  description: "Our team brings together deep technical expertise with real estate industry knowledge. This unique combination allows us to build solutions that are both technically excellent and perfectly aligned with industry needs.",
  expertiseItems: [
    {
      icon: <FiLayout size={28} className="text-accent-blue" />,
      title: "User Experience Design",
      description: "Creating intuitive interfaces that enhance productivity and require minimal training."
    },
    {
      icon: <FiSmartphone size={28} className="text-accent-blue" />,
      title: "Mobile-First Development",
      description: "Building responsive solutions that work seamlessly across devices to support professionals on the go."
    },
    {
      icon: <FiDatabase size={28} className="text-accent-blue" />,
      title: "Data Integration",
      description: "Connecting disparate systems to create unified workflows and eliminate data silos."
    },
    {
      icon: <FiShield size={28} className="text-accent-blue" />,
      title: "Enterprise Security",
      description: "Implementing robust security measures to protect sensitive client and transaction data."
    },
    {
      icon: <FiBarChart2 size={28} className="text-accent-blue" />,
      title: "Analytics & Reporting",
      description: "Delivering actionable insights through comprehensive analytics and customizable reports."
    },
    {
      icon: <FiCloud size={28} className="text-accent-blue" />,
      title: "Cloud Infrastructure",
      description: "Leveraging cloud technologies for scalability, reliability and global accessibility."
    }
  ]
}

export const ExpertiseSection: React.FC<ExpertiseSectionProps> = ({
  label = DEFAULT_CONTENT.label,
  title = DEFAULT_CONTENT.title,
  description = DEFAULT_CONTENT.description,
  expertiseItems = DEFAULT_CONTENT.expertiseItems,
}) => {
  return (
    <Section id="expertise" background="light" spacing="large">
      <div className="text-center mb-12">
        <P3 className="text-[#E9664A] uppercase tracking-[0.18em] font-bold mb-2">
          {label}
        </P3>
        <H2 className="mb-4">
          {title}
        </H2>
        <P2 className="max-w-3xl mx-auto">
          {description}
        </P2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {expertiseItems.map((item, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              {item.icon}
              <H3 className="ml-3">{item.title}</H3>
            </div>
            <P2>{item.description}</P2>
          </div>
        ))}
      </div>
    </Section>
  );
};

export default ExpertiseSection;
