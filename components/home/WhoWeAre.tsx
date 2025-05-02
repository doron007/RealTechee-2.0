import React from 'react';
import Image from 'next/image';

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
        <h3 className="font-['Nunito_Sans'] font-extrabold text-[25px] leading-[1.36] text-[#2A2B2E]">{title}</h3>
        <p className="font-['Archivo'] font-normal text-[17px] leading-[1.53] text-black">{description}</p>
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
      icon: '/assets/icons/brokerage-icon.svg',
      title: 'Real Estate Brokerages',
      description: 'Get the tools and support needed to optimize operations, enhance client experiences, and increase profitability. From streamlined project management to real-time communication, we empower your team to excel in the competitive real estate market & ensure client satisfaction.'
    },
    {
      icon: '/assets/icons/agent-icon.svg',
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
          <h2 className="uppercase text-[#E9664A] font-bold text-[14px] tracking-[0.18em] leading-[1.4] mb-4">Who We Serve</h2>
          <h3 className="font-['Nunito_Sans'] font-extrabold text-[39px] leading-[1.2] text-center text-[#2A2B2E]">Partner for Growth & Results</h3>
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