import Image from 'next/image';

// Define types for the StepCard component
interface StepCardProps {
  step: number;
  icon: string;
  title: string;
  description: string;
}

// Step card component
const StepCard: React.FC<StepCardProps> = ({ step, icon, title, description }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-6 h-full">
      <div className="mb-4">
        <div className="flex items-center justify-center w-10 h-10 bg-gray-700 rounded-full mb-4">
          <Image 
            src={icon} 
            alt={`Step ${step}`} 
            width={24} 
            height={24} 
            className="text-white"
          />
        </div>
        <p className="text-sm text-gray-400 mb-1">STEP {step}</p>
        <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
      </div>
      <p className="text-gray-300 text-sm">{description}</p>
    </div>
  );
};

interface HowItWorksProps {
  className?: string;
}

export default function HowItWorks(props: HowItWorksProps) {
  const steps = [
    {
      step: 1,
      icon: "/icons/request-icon.svg",
      title: "Quickly & Easily Submit Your Request",
      description: "Share your information and project needs. Our representative will contact you within 48 hours to coordinate our services."
    },
    {
      step: 2,
      icon: "/icons/collaborate-icon.svg",
      title: "Collaborate with our experts",
      description: "Our experts will define the scope to maximize your customer's investment value. We'll tailor a renovation plan to meet their needs and goals."
    },
    {
      step: 3,
      icon: "/icons/document-icon.svg",
      title: "Formalize the project",
      description: "Review and sign detailed agreement, including the scope of work, payment terms, and timeline."
    },
    {
      step: 4,
      icon: "/icons/team-icon.svg",
      title: "Execute the Plan with Ease",
      description: "Our team manages the entire project, providing on-site supervision and quality assurance. Enjoy real-time visibility and constant communication."
    },
    {
      step: 5,
      icon: "/icons/chart-icon.svg",
      title: "Realize the Enhanced Value",
      description: "Achieve a higher property value. Sell more, sell faster, and command higher prices."
    },
    {
      step: 6,
      icon: "/icons/finance-icon.svg",
      title: "Access Financial Tools for Success",
      description: "Leverage our financial tools for timely support, even with zero upfront payment."
    }
  ];

  return (
    <section className="py-16 bg-[#FCF9F8] relative overflow-hidden">
      {/* Background pattern overlay */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="diagonalPattern" patternUnits="userSpaceOnUse" width="100" height="100">
              <path d="M0 0L100 100Z" stroke="white" strokeWidth="2" fill="none" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#diagonalPattern)" />
        </svg>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white">How it Works</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((step) => (
            <StepCard
              key={step.step}
              step={step.step}
              icon={step.icon}
              title={step.title}
              description={step.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}