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
      className={`self-stretch p-6 sm:p-8 md:p-10 lg:p-12 rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-[30px] inline-flex flex-col justify-start items-start gap-4 sm:gap-5 md:gap-6 overflow-hidden transition-colors duration-300 ${
        isHovered ? 'bg-zinc-800' : 'bg-white'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 relative overflow-hidden flex items-center justify-center">
        {isWhiteIcon ? (
          <Image 
            src={icon} 
            alt={title}
            width={26}
            height={26}
            className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 ${isHovered ? '' : 'brightness-0'} transition-all duration-300`}
          />
        ) : (
          <Image 
            src={icon} 
            alt={title}
            width={26}
            height={26}
            className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 ${isHovered ? 'invert' : 'brightness-0'} transition-all duration-300`}
          />
        )}
      </div>
      <div className="self-stretch flex flex-col justify-start items-start gap-1 sm:gap-1.5">
        <div className={`self-stretch justify-start text-lg sm:text-xl md:text-2xl font-extrabold font-['Nunito_Sans'] ${
          isHovered ? 'text-white' : 'text-zinc-800'
        }`}>
          {title}
        </div>
        <div className={`self-stretch justify-start text-sm sm:text-base font-normal font-['Roboto'] leading-relaxed ${
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
      icon: '/assets/icons/top-experts.svg',
      title: 'Access to Top Experts',
      description: 'Unlock access to suppliers, contractors, designers, lenders, and other industry experts. By tapping into this valuable resource pool,',
      isWhiteIcon: true
    },
    {
      icon: '/assets/icons/home-value.svg',
      title: 'Maximize Home Value',
      description: 'Our experts work closely with you to create a custom renovation plan that maximizes the value of the property investment while minimizing cost.'
    },
    {
      icon: '/assets/icons/live-update.svg',
      title: 'Live Updates',
      description: 'Stay informed with pictures and progress reports to ensure your project stays on schedule and meets your standards. Have open discussions with our experts, ensuring you have real-time updates and can ask questions.'
    },
    {
      icon: '/assets/icons/renovation-cost.svg',
      title: 'Minimize Renovation Cost',
      description: 'Our automated programs will determine the renovations that will cost the least for your client while increasing the value of their home the most. Buyers can expedite home purchases by including renovation costs within budget and timeline.'
    }
  ];

  return (
    <section className="section-container bg-white py-10 sm:py-12 md:py-16 lg:py-20">
      <div className="section-content">
        <div className="text-center mb-2 sm:mb-3 md:mb-4">
          <p className="text-xs sm:text-sm font-medium text-[#FF5F45] uppercase tracking-wider">WHY US</p>
        </div>
        
        <h2 className="text-dark-gray font-bold font-heading text-2xl sm:text-3xl md:text-4xl lg:text-[43px] leading-tight text-center mb-3 sm:mb-4 md:mb-6">
          Eliminate deal breakers & win the client
        </h2>
        
        <p className="text-center mx-auto mb-8 sm:mb-10 md:mb-12 lg:mb-16 max-w-[618px] text-sm sm:text-base font-normal font-['Roboto'] leading-relaxed px-4">
          Are deals falling through due to homeowners not receiving enough value or buyers underestimating renovation costs
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 sm:gap-y-8 md:gap-y-10 lg:gap-y-[60px] gap-x-4 sm:gap-x-6 md:gap-x-[30px]">
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