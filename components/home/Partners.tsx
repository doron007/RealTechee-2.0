import Image from 'next/image';

interface PartnersProps {
  className?: string;
}

export default function Partners({ className }: PartnersProps) {
  const partners = [
    {
      name: "Partner 1",
      logo: "/assets/images/pages_home_partners_partner-logo-1.png",
    },
    {
      name: "Partner 2",
      logo: "/assets/images/pages_home_partners_partner-logo-2.png",
    },
    {
      name: "Partner 3",
      logo: "/assets/images/pages_home_partners_partner-logo-3.png",
    },
    {
      name: "Partner 4",
      logo: "/assets/images/pages_home_partners_partner-logo-4.png",
    }
  ];

  return (
    <section className={`section-container bg-white py-10 sm:py-14 md:py-16 lg:py-[88px] ${className || ''}`}>
      <div className="section-content">
        <div className="text-center mb-8 sm:mb-10 md:mb-12 lg:mb-[56px]">
          <h2 className="text-xl sm:text-2xl md:text-[28px] lg:text-[31px] font-bold text-[#2A2B2E] font-nunito leading-tight">
            Collaborating with Industry Leaders
          </h2>
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