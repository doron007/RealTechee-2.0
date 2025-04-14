import Image from 'next/image';

// Feature card component
const FeatureCard = ({ icon, title, description }) => {
  return (
    <div className="flex flex-col">
      <div className="mb-4">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full">
          <Image 
            src={icon} 
            alt={title} 
            width={24} 
            height={24}
          />
        </div>
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-700">{description}</p>
    </div>
  );
};

export default function DealBreakers() {
  const features = [
    {
      icon: "/icons/expert-icon.svg",
      title: "Access to Top Experts",
      description: "Unlock access to suppliers, contractors, designers, lenders, & other industry experts. By tapping into this valuable resource pool, you can benefit from immense customer satisfaction, streamline processes, & achieve exceptional results."
    },
    {
      icon: "/icons/home-value-icon.svg",
      title: "Maximize Home Value",
      description: "Our experts work closely with you to create a custom renovation plan that maximizes the value of the property investment while minimizing cost."
    },
    {
      icon: "/icons/updates-icon.svg",
      title: "Live Updates",
      description: "Stay informed with pictures and progress reports to ensure your project stays on schedule and meets your standards. Have open discussions with our experts, ensuring you have real-time updates and can ask questions."
    },
    {
      icon: "/icons/cost-icon.svg",
      title: "Minimize Renovation Cost",
      description: "Our automated programs will determine the renovations that will cost the least for your client while increasing the value of their home the most. Buyers can expedite home purchases by including renovation costs within budget and timeline."
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-medium text-[#FF5F45] uppercase tracking-wider mb-2">WHY US</p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Eliminate Deal Breakers & Win the Client</h2>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            Are deals falling through due to homeowners not receiving enough value or buyers underestimating renovation costs?
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}