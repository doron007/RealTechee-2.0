import React from 'react';
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
    <div className="bg-gradient-to-tr from-[#4F4F4F] via-[#4F4F4F]/50 to-[#4F4F4F] border border-[#6C6C6C] rounded-lg p-8 h-full flex flex-col gap-6">
      <div className="flex items-center justify-center w-12 h-12 bg-transparent">
        <Image 
          src={icon} 
          alt={`Step ${step}`} 
          width={32} 
          height={32} 
          className="text-white"
        />
      </div>
      <div className="flex flex-col gap-4">
        <div className="space-y-2">
          <h3 className="text-xl font-extrabold text-white font-['Roboto'] leading-tight">
            Step {step}<br/>
            {title}
          </h3>
        </div>
        <p className="text-white text-base font-normal font-['Roboto'] leading-relaxed opacity-90">
          {description}
        </p>
      </div>
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
      icon: "/assets/icons/step1-icon.svg",
      title: "Quickly & Easily Submit Your Request",
      description: "Share your information and project needs. Our representative will contact you within 48 hours to coordinate our services."
    },
    {
      step: 2,
      icon: "/assets/icons/step2-icon.svg",
      title: "We Define the Scope",
      description: "Collaborate with our experts to maximize your customer's investment value. We'll tailor a renovation plan to meet their needs and goals."
    },
    {
      step: 3,
      icon: "/assets/icons/step3-icon.svg",
      title: "Review and Sign the Agreement",
      description: "Formalize the project with a detailed agreement, including the scope of work, payment terms, and timeline."
    },
    {
      step: 4,
      icon: "/assets/icons/step4-icon.svg",
      title: "Execute the Plan with Ease",
      description: "Our team manages the entire project, providing on-site supervision and quality assurance. Enjoy real-time visibility and constant communication."
    },
    {
      step: 5,
      icon: "/assets/icons/step5-icon.svg",
      title: "Realize the Enhanced Value",
      description: "Achieve a higher property value. Sell more, sell faster, and command higher prices."
    },
    {
      step: 6,
      icon: "/assets/icons/step6-icon.svg",
      title: "Access Financial Tools for Success",
      description: "Leverage our financial tools for timely support, even with zero upfront payment."
    }
  ];

  return (
    <section className="py-20 bg-[#2A2B2E] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-20 relative z-10">
        <div className="text-center mb-16 space-y-4">
          <h3 className="text-[#E9664A] font-bold uppercase tracking-widest font-['Nunito_Sans'] text-sm">
            Steps A-Z
          </h3>
          <h2 className="text-4xl md:text-5xl font-bold text-white font-['Nunito_Sans'] leading-tight -tracking-[0.02em]">
            How it Works
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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