import Image from 'next/image';
import { SectionTitle } from '../';

interface PartnersProps {
  className?: string;
}

export default function Partners({ className }: PartnersProps) {
  const partners = [
    {
      name: "Sync",
      logo: "/assets/images/pages_home_partners_partner-logo-1.png",
    },
    {
      name: "Equity Union",
      logo: "/assets/images/pages_home_partners_partner-logo-2.png",
    },
    {
      name: "ASID",
      logo: "/assets/images/pages_home_partners_partner-logo-3.png",
    },
    {
      name: "NKBA",
      logo: "/assets/images/pages_home_partners_partner-logo-4.png",
    }
  ];

  return (
    <section className={`section-container bg-white py-10 sm:py-14 md:py-16 lg:py-[88px] ${className || ''}`}>
      <div className="section-content">
        <div className="text-center mb-8 sm:mb-10 md:mb-12 lg:mb-[56px]">
          <SectionTitle>
            Collaborating with Industry Leaders
          </SectionTitle>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-0">
          {partners.map((partner, index) => (
            <div key={index} className="flex justify-center items-center py-4 sm:py-5 md:py-6 lg:py-[24px] px-2 sm:px-4 md:px-[10px]">
              <div className="relative w-full h-[40px] sm:h-[60px] md:h-[70px] lg:h-[80px]">
                <Image
                  src={partner.logo}
                  alt={partner.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 50vw, 25vw"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}