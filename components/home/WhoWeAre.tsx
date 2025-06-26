import React from 'react';
import Image from 'next/image';
import P3 from '../typography/P3';
import H2 from '../typography/H2';
import H3 from '../typography/H3';
import P2 from '../typography/P2';

interface ServiceItemProps {
  icon: string;
  title: string;
  description: string;
}

const ServiceItem: React.FC<ServiceItemProps> = ({ icon, title, description }) => {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="w-16 h-16 flex ">
        <Image 
          src={icon} 
          alt={`${title} icon`} 
          width={24} 
          height={24}
        />
      </div>
      <div className="flex flex-col gap-6">
        <H3 className="text-[#E9664A]">{title}</H3>
        <P2 className="text-black">{description}</P2>
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
        <P3 className="text-[#E9664A] uppercase tracking-[0.18em] font-bold text-center mb-4">
          Who We Serve
        </P3>
        <H2 className="text-center mb-16">
          Partner for Growth & Results
        </H2>
        
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