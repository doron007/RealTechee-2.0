import Image from 'next/image';

export default function Portfolio() {
  return (
    <section id="portfolio" className="bg-white py-16 px-6 md:px-12 text-center">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900">Before and After Renovation Projects</h2>
        <p className="text-lg text-gray-700 mt-2">
          See the transformation of properties before and after RealTechee's renovations.
        </p>

        {/* Portfolio Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">

          {/* Before and After 1 */}
          <div className="relative overflow-hidden rounded-lg shadow-lg group">
            <Image 
              src="/MD - Home/IMG_3629.jpg" 
              alt="Before renovation - Living Room" 
              width={600} 
              height={400} 
              className="w-full h-auto"
            />
            <div className="absolute top-4 left-4 bg-white shadow-md p-3 rounded-lg">
              <p className="text-sm font-semibold" style={{color: "var(--accent-red)"}}>Before</p>
            </div>
            <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <p className="text-white font-semibold px-4 py-2 rounded-lg" style={{backgroundColor: "var(--accent-color)"}}>View Project</p>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-lg shadow-lg group">
            <Image 
              src="/MD - Home/IMG_6917.jpg" 
              alt="After renovation - Living Room" 
              width={600} 
              height={400}
              className="w-full h-auto" 
            />
            <div className="absolute top-4 left-4 bg-white shadow-md p-3 rounded-lg">
              <p className="text-sm font-semibold" style={{color: "var(--accent-teal)"}}>After</p>
            </div>
            <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <p className="text-white font-semibold px-4 py-2 rounded-lg" style={{backgroundColor: "var(--accent-color)"}}>View Project</p>
            </div>
          </div>

          {/* Before and After 2 */}
          <div className="relative overflow-hidden rounded-lg shadow-lg group">
            <Image 
              src="/MD - Home/IMG_0014.jpg" 
              alt="Before renovation - Kitchen" 
              width={600} 
              height={400}
              className="w-full h-auto" 
            />
            <div className="absolute top-4 left-4 bg-white shadow-md p-3 rounded-lg">
              <p className="text-sm font-semibold" style={{color: "var(--accent-red)"}}>Before</p>
            </div>
            <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <p className="text-white font-semibold px-4 py-2 rounded-lg" style={{backgroundColor: "var(--accent-color)"}}>View Project</p>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-lg shadow-lg group">
            <Image 
              src="/MD - Home/IMG_6158.jpg" 
              alt="After renovation - Kitchen" 
              width={600} 
              height={400}
              className="w-full h-auto" 
            />
            <div className="absolute top-4 left-4 bg-white shadow-md p-3 rounded-lg">
              <p className="text-sm font-semibold" style={{color: "var(--accent-teal)"}}>After</p>
            </div>
            <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <p className="text-white font-semibold px-4 py-2 rounded-lg" style={{backgroundColor: "var(--accent-color)"}}>View Project</p>
            </div>
          </div>

        </div>
        
        <div className="mt-10">
          <button 
            className="px-6 py-3 rounded-lg font-semibold"
            style={{
              backgroundColor: "var(--accent-color)",
              color: "white"
            }}
          >
            View all projects →
          </button>
        </div>
      </div>
    </section>
  );
}