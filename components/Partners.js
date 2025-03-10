import Image from 'next/image';

export default function Partners() {
  return (
    <section id="partners" className="bg-gray-50 py-16 px-6 md:px-12 text-center">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900">Our Trusted Partners</h2>
        <p className="text-lg text-gray-700 mt-2">
          We collaborate with top industry professionals and organizations to bring you the best.
        </p>

        {/* Partners Logos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-10 items-center justify-center">

          {/* Partner 1 */}
          <div>
            <Image 
              src="/MD - Home/NKBA.png" 
              alt="National Kitchen & Bath Association" 
              width={150} 
              height={50} 
              className="mx-auto"
            />
          </div>

          {/* Partner 2 */}
          <div>
            <Image 
              src="/MD - Home/Equity Union Real Estate.png" 
              alt="Equity Union Real Estate" 
              width={150} 
              height={50} 
              className="mx-auto"
            />
          </div>

          {/* Partner 3 */}
          <div>
            <Image 
              src="/MD - Home/ASID.png" 
              alt="American Society of Interior Designers" 
              width={150} 
              height={50} 
              className="mx-auto"
            />
          </div>

          {/* Partner 4 */}
          <div>
            <Image 
              src="/MD - Home/sync.png" 
              alt="Sync Partnership" 
              width={150} 
              height={50} 
              className="mx-auto"
            />
          </div>

        </div>
      </div>
    </section>
  );
}
