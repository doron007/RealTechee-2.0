export default function Hero() {
    return (
      <section className="bg-white pt-24 pb-12 px-6 md:px-12 text-center md:text-left">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center">
          {/* Left: Hero text */}
          <div className="w-full md:w-1/2 mb-10 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              Meet RealTechee, <br /> 
              <span style={{color: "var(--accent-color)"}}>add value to your property.</span>
            </h1>
            <p className="mt-4 text-lg text-gray-700">
              Improve your property, enjoy a better living place and add value to your property.
            </p>
            <button 
              className="mt-8 px-6 py-3 rounded-lg font-semibold" 
              style={{
                backgroundColor: "var(--accent-color)", 
                color: "white"
              }}
            >
              Learn more →
            </button>
          </div>
          
          {/* Right: Hero image */}
          <div className="w-full md:w-1/2">
            <img 
              src="/MD - Home/unsplash__JBKdviweXI.png" 
              alt="Modern home interior" 
              className="rounded-lg shadow-lg w-full"
            />
          </div>
        </div>
      </section>
    );
  }  