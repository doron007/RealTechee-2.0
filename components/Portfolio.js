import { useState } from 'react';
import Image from 'next/image';

// Navigation button component
const NavButton = ({ direction, onClick, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-10 h-10 rounded-full flex items-center justify-center border ${
        disabled ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
      }`}
    >
      {direction === 'prev' ? (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) : (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  );
};

export default function Portfolio() {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const projects = [
    {
      id: 1,
      title: "Living Room Transformation",
      beforeImage: "/portfolio/before-1.jpg",
      afterImage: "/portfolio/after-1.jpg",
      valueIncrease: 97000
    },
    {
      id: 2,
      title: "Kitchen Renovation",
      beforeImage: "/portfolio/before-2.jpg",
      afterImage: "/portfolio/after-2.jpg",
      valueIncrease: 105000
    },
    {
      id: 3,
      title: "Master Bathroom Update",
      beforeImage: "/portfolio/before-3.jpg",
      afterImage: "/portfolio/after-3.jpg",
      valueIncrease: 65000
    }
  ];

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev === 0 ? projects.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev === projects.length - 1 ? 0 : prev + 1));
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-sm font-medium text-[#FF5F45] uppercase tracking-wider mb-2">PORTFOLIO</p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Before and After Renovation Projects</h2>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Before Image */}
            <div className="relative h-64 md:h-96 overflow-hidden rounded-lg">
              <div className="absolute top-4 left-4 bg-white py-1 px-3 rounded-md text-gray-800 font-medium z-10">
                Before
              </div>
              <Image
                src={projects[currentSlide].beforeImage}
                alt={`Before - ${projects[currentSlide].title}`}
                fill
                className="object-cover"
              />
            </div>
            
            {/* After Image */}
            <div className="relative h-64 md:h-96 overflow-hidden rounded-lg">
              <div className="absolute top-4 left-4 bg-white py-1 px-3 rounded-md text-[#FF5F45] font-medium z-10">
                After
              </div>
              <Image
                src={projects[currentSlide].afterImage}
                alt={`After - ${projects[currentSlide].title}`}
                fill
                className="object-cover"
              />
            </div>
          </div>
          
          <div className="mt-8 flex items-center justify-between">
            <div>
              <p className="text-xl font-bold text-gray-900">
                Value increased by <span className="text-[#FF5F45]">${projects[currentSlide].valueIncrease.toLocaleString()}</span>
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <p className="text-gray-600 mr-4">{currentSlide + 1}/{projects.length}</p>
              <div className="flex space-x-2">
                <NavButton direction="prev" onClick={handlePrev} disabled={false} />
                <NavButton direction="next" onClick={handleNext} disabled={false} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}