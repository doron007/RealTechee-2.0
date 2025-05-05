import React from 'react';
import Image from 'next/image';
import { SectionLabel, SectionTitle, Subtitle, BodyContent } from '../';

interface ServiceItemProps {
  icon: string;
  title: string;
  description: string;
}

const ServiceItem: React.FC<ServiceItemProps> = ({ icon, title, description }) => {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="w-16 h-16 flex items-center justify-center">
        <Image 
          src={icon} 
          alt={`${title} icon`} 
          width={24} 
          height={24}
        />
      </div>
      <div className="flex flex-col gap-6">
        <Subtitle className="text-[#2A2B2E]">{title}</Subtitle>
        <BodyContent className="text-black">{description}</BodyContent>
      </div>
    </div>
  );
};

interface WhoWeAreProps {
  className?: string;
}

export default function WhoWeAre({ className = '' }: WhoWeAreProps) {
  const services = [
    {
      icon: '/assets/icons/ic-sign.svg',
      title: 'Real Estate Brokerages',
      description: 'Get the tools and support needed to optimize operations, enhance client experiences, and increase profitability. From streamlined project management to real-time communication, we empower your team to excel in the competitive real estate market & ensure client satisfaction.'
    },
    {
      icon: '/assets/icons/ic-key.svg',
      title: 'Real Estate Agents',
      description: 'Receive cutting-edge resources to showcase properties, deliver exceptional customer service, and confidently close deals. Access real-time project updates, collaborate seamlessly with clients, and unlock the potential to sell properties faster and at higher prices.'
    },
    {
      icon: '/assets/icons/architect-icon.svg',
      title: 'Architects/Designers',
      description: 'Collaborate effortlessly with clients, streamline project management, and bring your design visions to life with our platform. From concept to execution, our real-time communication and project tracking tools ensure that your projects stay on schedule and exceed client expectations.'
    }
  ];

  return (
    <section className={`section-container bg-white py-[80px] ${className}`}>
      <div className="section-content">
        <div className="flex flex-col items-center mb-16">
          <SectionLabel className="mb-4">Who We Serve</SectionLabel>
          <SectionTitle className="text-center text-[#2A2B2E]">Partner for Growth & Results</SectionTitle>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[40px]">
          {services.map((service, index) => (
            <ServiceItem 
              key={index}
              icon={service.icon}
              title={service.title}
              description={service.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}