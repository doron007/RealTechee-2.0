import Image from 'next/image';

export default function Process() {
  const steps = [
    {
      icon: "/MD - Home/ic-search-home.svg",
      title: "Property Assessment",
      description: "Our experts evaluate your property and identify opportunities to add value through strategic renovations."
    },
    {
      icon: "/MD - Home/ic-clipboard-tick.svg",
      title: "Custom Renovation Plan",
      description: "We create a tailored renovation plan that maximizes your property value while staying within your budget."
    },
    {
      icon: "/MD - Home/ic-update.svg",
      title: "Execution & Management",
      description: "Our platform manages the entire renovation process, from contractor selection to project completion."
    },
    {
      icon: "/MD - Home/ic-dollar-circle.svg",
      title: "Value Maximization",
      description: "Enjoy the increased property value, whether you're selling, renting, or improving your living space."
    }
  ];

  return (
    <section id="process" className="bg-gray-50 py-16 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">How RealTechee Works</h2>
          <p className="text-lg text-gray-700 mt-2 max-w-3xl mx-auto">
            Our streamlined process helps property owners add significant value through strategic renovations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-center mb-4">
                <img src={step.icon} alt={step.title} className="h-16 w-16" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 text-center mb-3">{step.title}</h3>
              <p className="text-gray-700 text-center">{step.description}</p>
              
              {/* Step number */}
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center mx-auto mt-4"
                style={{ backgroundColor: "var(--accent-color)" }}
              >
                <span className="text-white font-semibold">{index + 1}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <button 
            className="px-6 py-3 rounded-lg font-semibold"
            style={{
              backgroundColor: "var(--accent-color)",
              color: "white"
            }}
          >
            Start Your Renovation →
          </button>
        </div>
      </div>
    </section>
  );
}
