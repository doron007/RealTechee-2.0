import React from 'react';
import { SectionLabel, SectionTitle, BodyContent } from '../';
import { Card } from '../common/ui';

const DealBreakers: React.FC = () => {
  const cards = [
    {
      icon: '/assets/icons/top-experts.svg',
      title: 'Access to Top Experts',
      content: 'Unlock access to suppliers, contractors, designers, lenders, and other industry experts. By tapping into this valuable resource pool,',
      isWhiteIcon: true
    },
    {
      icon: '/assets/icons/home-value.svg',
      title: 'Maximize Home Value',
      content: 'Our experts work closely with you to create a custom renovation plan that maximizes the value of the property investment while minimizing cost.'
    },
    {
      icon: '/assets/icons/ic-update.svg',
      title: 'Live Updates',
      content: 'Stay informed with pictures and progress reports to ensure your project stays on schedule and meets your standards. Have open discussions with our experts, ensuring you have real-time updates and can ask questions.'
    },
    {
      icon: '/assets/icons/renovation-cost.svg',
      title: 'Minimize Renovation Cost',
      content: 'Our automated programs will determine the renovations that will cost the least for your client while increasing the value of their home the most. Buyers can expedite home purchases by including renovation costs within budget and timeline.'
    }
  ];

  return (
    <section className="section-container bg-white py-10 sm:py-12 md:py-16 lg:py-20">
      <div className="section-content">
        <SectionLabel className="text-[#FF5F45] text-center">
          WHY US
        </SectionLabel>
        <SectionTitle className="text-center">
          Eliminate deal breakers & win the client
        </SectionTitle>
        
        <BodyContent  className="text-center mx-auto mb-8 sm:mb-10 md:mb-12 lg:mb-16 max-w-[618px] px-4">
          Are deals falling through due to homeowners not receiving enough value or buyers underestimating renovation costs
        </BodyContent>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 :grid-cols-3 gap-2">
          {cards.map((card, index) => (
            <Card
              key={index}
              variant="dealBreaker"
              icon={card.icon}
              title={card.title}
              content={card.content}
              iconPosition="top"
              inverseIconOnHover={card.isWhiteIcon}
              hasHoverEffect={true}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default DealBreakers;