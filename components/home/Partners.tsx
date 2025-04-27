import Image from 'next/image';

export default function Partners(props: any) {
  const partners = [
    {
      name: "Sync",
      logo: "/logos/sync.png",
      width: 120
    },
    {
      name: "Equity Union Real Estate",
      logo: "/logos/equity-union.png",
      width: 150
    },
    {
      name: "American Society of Interior Designers",
      logo: "/logos/asid.png",
      width: 100
    },
    {
      name: "National Kitchen & Bath Association",
      logo: "/logos/nkba.png",
      width: 130
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Collaborating with Industry Leaders</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center">
          {partners.map((partner, index) => (
            <div key={index} className="flex justify-center items-center px-4 py-2">
              <Image
                src={partner.logo}
                alt={partner.name}
                width={partner.width}
                height={50}
                className="object-contain h-10 md:h-12 grayscale hover:grayscale-0 transition-all duration-300"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}