import Image from 'next/image';

export default function Testimonials() {
  return (
    <section id="testimonials" className="bg-gray-50 py-16 px-6 md:px-12 text-center">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900">What Our Clients Say</h2>
        <p className="text-lg text-gray-700 mt-2">
          Hear from real estate professionals and homeowners who have worked with us.
        </p>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">

          {/* Testimonial 1 */}
          <div className="relative">
            <Image 
              src="/MD - Home/realtechee_testimonial.png" 
              alt="Client Testimonial" 
              width={600} 
              height={400} 
              className="rounded-lg shadow-md"
            />
            <div className="absolute bottom-4 left-4 bg-white shadow-lg p-3 rounded-lg w-4/5">
              <p className="text-sm text-gray-600">
                "Working with RealTechee transformed my listings! The renovations increased home value significantly."
              </p>
              <span className="block mt-2 font-bold text-gray-900">- Matthew Engle, Vista Sotheby’s</span>
            </div>
          </div>

          {/* Testimonial 2 */}
          <div className="relative">
            <Image 
              src="/MD - Home/realtechee_testimonial.mp4" 
              alt="Video Testimonial" 
              width={600} 
              height={400} 
              className="rounded-lg shadow-md"
            />
            <div className="absolute bottom-4 left-4 bg-white shadow-lg p-3 rounded-lg w-4/5">
              <p className="text-sm text-gray-600">
                "RealTechee’s process is seamless and effective. My clients are extremely satisfied!"
              </p>
              <span className="block mt-2 font-bold text-gray-900">- Luxury Home Seller</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
