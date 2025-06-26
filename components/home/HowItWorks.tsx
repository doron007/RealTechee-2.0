import React from 'react';
import P3 from '../typography/P3';
import H2 from '../typography/H2';
import { Card } from '../common/ui';

interface HowItWorksProps {
  className?: string;
}

export default function HowItWorks(props: HowItWorksProps) {
  const steps = [
    {
      step: 1,
      icon: "/assets/icons/step1-icon.svg",
      title: "Quickly & Easily Submit Your Request",
      content: "Share your information and project needs. Our representative will contact you within 48 hours to coordinate our services."
    },
    {
      step: 2,
      icon: "/assets/icons/step2-icon.svg",
      title: "We Define the Scope",
      content: "Collaborate with our experts to maximize your customer's investment value. We'll tailor a renovation plan to meet their needs and goals."
    },
    {
      step: 3,
      icon: "/assets/icons/step3-icon.svg",
      title: "Review and Sign the Agreement",
      content: "Formalize the project with a detailed agreement, including the scope of work, payment terms, and timeline."
    },
    {
      step: 4,
      icon: "/assets/icons/step4-icon.svg",
      title: "Execute the Plan with Ease",
      content: "Our team manages the entire project, providing on-site supervision and quality assurance. Enjoy real-time visibility and constant communication."
    },
    {
      step: 5,
      icon: "/assets/icons/step5-icon.svg",
      title: "Realize the Enhanced Value",
      content: "Achieve a higher property value. Sell more, sell faster, and command higher prices."
    },
    {
      step: 6,
      icon: "/assets/icons/step6-icon.svg",
      title: "Access Financial Tools for Success",
      content: "Leverage our financial tools for timely support, even with zero upfront payment."
    }
  ];

  return (
    <section className="section-container bg-[#2A2B2E] py-10 sm:py-12 md:py-16 lg:py-20 relative">
      <div className="section-content relative z-10">
        <div className="text-center mb-8 sm:mb-10 md:mb-12 lg:mb-16 space-y-2 sm:space-y-3 md:space-y-4">
          <P3 className="text-[#E9664A] uppercase tracking-[0.18em] font-bold">
            Steps A-Z
          </P3>
          <H2 className="text-white">
            How it Works
          </H2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          {steps.map((step) => (
            <Card
              key={step.step}
              variant="step"
              icon={step.icon}
              title={step.title}
              content={step.content}
              step={step.step}
              iconPosition="top"
            />
          ))}
        </div>
      </div>
    </section>
  );
}