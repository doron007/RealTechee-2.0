import Image from 'next/image';

export default function Statistics() {
  return (
    <section id="statistics" className="bg-gray-100 py-16 px-6 md:px-12 text-center">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900">Our Impact in Numbers</h2>
        <p className="text-lg text-gray-700 mt-2">
          We have helped homeowners and realtors achieve incredible results.
        </p>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-10">

          {/* Stat 1 */}
          <div className="flex flex-col items-center">
            <Image 
              src="/MD - Home/ic-dollar-circle.svg" 
              alt="Increased Sale Value" 
              width={60} 
              height={60} 
            />
            <h3 className="text-2xl font-bold text-gray-900 mt-3">$50M+</h3>
            <p className="text-gray-600 text-sm mt-1">Increased Home Sale Value</p>
          </div>

          {/* Stat 2 */}
          <div className="flex flex-col items-center">
            <Image 
              src="/MD - Home/ic-people.svg" 
              alt="Satisfied Clients" 
              width={60} 
              height={60} 
            />
            <h3 className="text-2xl font-bold text-gray-900 mt-3">500+</h3>
            <p className="text-gray-600 text-sm mt-1">Happy Homeowners</p>
          </div>

          {/* Stat 3 */}
          <div className="flex flex-col items-center">
            <Image 
              src="/MD - Home/ic-building.svg" 
              alt="Renovation Projects" 
              width={60} 
              height={60} 
            />
            <h3 className="text-2xl font-bold text-gray-900 mt-3">200+</h3>
            <p className="text-gray-600 text-sm mt-1">Successful Renovations</p>
          </div>

          {/* Stat 4 */}
          <div className="flex flex-col items-center">
            <Image 
              src="/MD - Home/ic-sign.svg" 
              alt="Faster Home Sales" 
              width={60} 
              height={60} 
            />
            <h3 className="text-2xl font-bold text-gray-900 mt-3">30%</h3>
            <p className="text-gray-600 text-sm mt-1">Faster Home Sales</p>
          </div>

        </div>
      </div>
    </section>
  );
}
