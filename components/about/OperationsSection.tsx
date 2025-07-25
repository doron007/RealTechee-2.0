import P3 from '../typography/P3';
import H2 from '../typography/H2';
import H3 from '../typography/H3';
import P2 from '../typography/P2';
import { Section } from '../../components/common/layout';
import { FiUsers, FiTrendingUp, FiGlobe, FiZap } from 'react-icons/fi';

interface OperationItem {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface OperationsSectionProps {
  label?: string;
  title?: string;
  description?: string;
  operations?: OperationItem[];
}

const DEFAULT_CONTENT = {
  label: "HOW WE OPERATE",
  title: "Agile Practices with Enterprise Reliability",
  description: "We combine the speed and innovation of a startup with the stability and security expected by enterprise clients. Our operations are built around four key pillars that ensure we consistently deliver exceptional solutions.",
  operations: [
    {
      icon: <FiUsers size={32} className="text-accent-blue" />,
      title: "Client-First Approach",
      description: "Everything we build starts with understanding our clients' needs. We engage deeply with real estate professionals to ensure our solutions solve real problems."
    },
    {
      icon: <FiTrendingUp size={32} className="text-accent-blue" />,
      title: "Continuous Improvement",
      description: "We regularly update our platforms based on user feedback and market trends, ensuring our clients always have access to cutting-edge capabilities."
    },
    {
      icon: <FiGlobe size={32} className="text-accent-blue" />,
      title: "Global Perspective",
      description: "While our solutions are tailored for local markets, we incorporate global best practices and innovations to provide world-class technology."
    },
    {
      icon: <FiZap size={32} className="text-accent-blue" />,
      title: "Rapid Implementation",
      description: "Our streamlined development process allows us to quickly deploy solutions and iterate based on real-world performance."
    }
  ]
}

export const OperationsSection: React.FC<OperationsSectionProps> = ({
  label = DEFAULT_CONTENT.label,
  title = DEFAULT_CONTENT.title,
  description = DEFAULT_CONTENT.description,
  operations = DEFAULT_CONTENT.operations,
}) => {
  return (
    <Section id="operations" background="white" spacing="large">
      <div className="text-center mb-12 md:mb-16">
        <P3 className="text-[#E9664A] uppercase tracking-[0.18em] font-bold mb-3">
          {label}
        </P3>
        <H2 className="mb-5 md:mb-6">
          {title}
        </H2>
        <P2 className="max-w-3xl mx-auto text-medium-gray">
          {description}
        </P2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {operations.map((operation, index) => (
          <div key={index} className="bg-gray-50 p-6 md:p-8 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 hover:bg-gray-100">
            <div className="mb-5 text-accent-blue">
              {operation.icon}
            </div>
            <H3 className="mb-4">{operation.title}</H3>
            <P2 className="text-medium-gray">{operation.description}</P2>
          </div>
        ))}
      </div>
    </Section>
  );
};

export default OperationsSection;
