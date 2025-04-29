import React, { useState } from 'react';
import Image from 'next/image';

interface CardProps {
  icon: string;
  title: string;
  description: string;
  isWhiteIcon?: boolean;
}

const Card: React.FC<CardProps> = ({ icon, title, description, isWhiteIcon = false }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={`self-stretch p-12 rounded-[30px] inline-flex flex-col justify-start items-start gap-6 overflow-hidden transition-colors duration-300 ${
        isHovered ? 'bg-zinc-800' : 'bg-white'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="w-10 h-10 relative overflow-hidden flex items-center justify-center">
        {isWhiteIcon ? (
          <Image 
            src={icon} 
            alt={title}
            width={26}
            height={26}
            className={`${isHovered ? '' : 'brightness-0'} transition-all duration-300`}
          />
        ) : (
          <Image 
            src={icon} 
            alt={title}
            width={26}
            height={26}
            className={`${isHovered ? 'invert' : 'brightness-0'} transition-all duration-300`}
          />
        )}
      </div>
      <div className="self-stretch flex flex-col justify-start items-start gap-1.5">
        <div className={`self-stretch justify-start text-2xl font-extrabold font-['Nunito_Sans'] ${
          isHovered ? 'text-white' : 'text-zinc-800'
        }`}>
          {title}
        </div>
        <div className={`self-stretch justify-start text-base font-normal font-['Roboto'] leading-relaxed ${
          isHovered ? 'text-white' : 'text-black'
        }`}>
          {description}
        </div>
      </div>
    </div>
  );
};

const DealBreakers: React.FC = () => {
  const cards = [
    {
      icon: '/icons/top-experts.svg',
      title: 'Access to Top Experts',
      description: 'Unlock access to suppliers, contractors, designers, lenders, and other industry experts. By tapping into this valuable resource pool,',
      isWhiteIcon: true
    },
    {
      icon: '/icons/home-value.svg',
      title: 'Maximize Home Value',
      description: 'Our experts work closely with you to create a custom renovation plan that maximizes the value of the property investment while minimizing cost.'
    },
    {
      icon: '/icons/live-update.svg',
      title: 'Live Updates',
      description: 'Stay informed with pictures and progress reports to ensure your project stays on schedule and meets your standards. Have open discussions with our experts, ensuring you have real-time updates and can ask questions.'
    },
    {
      icon: '/icons/renovation-cost.svg',
      title: 'Minimize Renovation Cost',
      description: 'Our automated programs will determine the renovations that will cost the least for your client while increasing the value of their home the most. Buyers can expedite home purchases by including renovation costs within budget and timeline.'
    }
  ];

  return (
    <section className="pt-20 pr-[120px] pl-[120px] pb-20 bg-white">
      <div className="w-[1200px] mx-auto">
        <div className="text-center mb-4">
          <p className="text-sm font-medium text-[#FF5F45] uppercase tracking-wider mb-2">WHY US</p>
        </div>
        
        <h2 
          className="text-dark-gray font-bold font-heading"
          style={{
            fontSize: "clamp(37px, 3.5vw, 43px)",
            lineHeight: "1.4em",
            textAlign: "center",
            width: "100%",
            margin: "0 0 24px 0",
            mixBlendMode: "normal"
          }}
        >
          Eliminate deal breakers & win the client
        </h2>
        
        <p className="text-center mx-auto mb-16 max-w-[618px] text-base font-normal font-['Roboto'] leading-relaxed">
          Are deals falling through due to homeowners not receiving enough value or buyers underestimating renovation costs
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-[60px] gap-x-[30px]">
          {cards.map((card, index) => (
            <Card
              key={index}
              icon={card.icon}
              title={card.title}
              description={card.description}
              isWhiteIcon={card.isWhiteIcon}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default DealBreakers;