import Image from 'next/image';

export default function Partners(props: any) {
  const partners = [
    {
      name: "Partner 1",
      logo: "/images/partner-logo-1.png",
    },
    {
      name: "Partner 2",
      logo: "/images/partner-logo-2.png",
    },
    {
      name: "Partner 3",
      logo: "/images/partner-logo-3.png",
    },
    {
      name: "Partner 4",
      logo: "/images/partner-logo-4.png",
    }
  ];

  return (
    <section className="bg-white py-[88px] px-[120px] max-sm:px-6 max-sm:py-12">
      <div className="max-w-[1240px] mx-auto">
        <div className="text-center mb-[56px]">
          <h2 className="text-[31px] font-bold text-[#2A2B2E] font-nunito leading-[1.2em]">Collaborating with Industry Leaders</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0">
          {partners.map((partner, index) => (
            <div key={index} className="flex justify-center items-center py-[24px] px-[10px]">
              <div className="relative w-full h-[80px]">
                <Image
                  src={partner.logo}
                  alt={partner.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}