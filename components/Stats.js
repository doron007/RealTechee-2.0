export default function Stats() {
    return (
      <section id="stats" className="bg-gray-50 py-16 px-6 md:px-12 text-center">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900">RealTechee By the Numbers</h2>
          <p className="text-lg text-gray-700 mt-2">See how we help agents and homeowners maximize their property value.</p>
  
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-10">
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="flex items-center justify-center mb-4">
                <img src="/MD - Home/ic-building.svg" alt="Building icon" className="h-12 w-12" />
              </div>
              <p className="text-4xl font-bold" style={{color: "var(--accent-red)"}}>1,500+</p>
              <p className="text-gray-700 mt-2">Renovation Projects</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="flex items-center justify-center mb-4">
                <img src="/MD - Home/ic-dollar-circle.svg" alt="Dollar icon" className="h-12 w-12" />
              </div>
              <p className="text-4xl font-bold" style={{color: "var(--accent-teal)"}}>$50M+</p>
              <p className="text-gray-700 mt-2">Value Added to Properties</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="flex items-center justify-center mb-4">
                <img src="/MD - Home/ic-chart.svg" alt="Chart icon" className="h-12 w-12" />
              </div>
              <p className="text-4xl font-bold" style={{color: "var(--accent-yellow)"}}>2x</p>
              <p className="text-gray-700 mt-2">Faster Selling Time</p>
            </div>
          </div>
        </div>
      </section>
    );
  }  