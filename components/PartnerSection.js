import Image from 'next/image';

// Service card component
const ServiceCard = ({ icon, title, description }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center mb-4 text-[#FF5F45]">
        <Image src={icon} alt={title} width={24} height={24} />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-700 flex-grow">{description}</p>
    </div>
  );
};

export default function PartnerSection() {
  const services = [
    {
      icon: "/icons/flag-icon.svg",
      title: "Real Estate Brokerages",
      description: "Get the tools and support needed to optimize operations, enhance client experiences, and increase profitability. From streamlined project management to real-time communication, we empower your team to excel in the competitive real estate market & ensure client satisfaction."
    },
    {
      icon: "/icons/people-icon.svg",
      title: "Real Estate Agents",
      description: "Receive cutting-edge resources to showcase properties, deliver exceptional customer service, and confidently close deals. Access real-time project updates, collaborate seamlessly with clients, and unlock the potential to sell properties faster and at higher prices."
    },
    {
      icon: "/icons/building-icon.svg",
      title: "Architects / Designers",
      description: "Collaborate effortlessly with clients, streamline project management, and bring your design visions to life with our platform. From concept to execution, our real-time communication and project tracking tools ensure that your projects stay on schedule and exceed client expectations."
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-medium text-[#FF5F45] uppercase tracking-wider mb-2">WHO WE SERVE</p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Partner for Growth & Results</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <ServiceCard
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