import Image from 'next/image';

export default function ProjectUpdates() {
  return (
    <section id="project-updates" className="bg-white py-16 px-6 md:px-12 text-center">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900">Real-Time Project Updates</h2>
        <p className="text-lg text-gray-700 mt-2">Stay informed on renovation progress at every step.</p>

        {/* Updates Container */}
        <div className="mt-10 flex flex-col items-center space-y-8">
          
          {/* Update 1 */}
          <div className="relative">
            <Image src="/MD - Home/IMG_0014.jpg" alt="Before Renovation" width={600} height={400} className="rounded-lg shadow-md" />
            <div className="absolute -top-10 left-5 bg-white rounded-lg p-3 shadow-md">
              <Image src="/MD - Home/Real-time project updates.png" alt="Update Icon" width={250} height={100} />
            </div>
          </div>

          {/* Update 2 */}
          <div className="relative">
            <Image src="/MD - Home/IMG_6158.jpg" alt="After Renovation" width={600} height={400} className="rounded-lg shadow-md" />
            <div className="absolute -bottom-10 right-5 bg-white rounded-lg p-3 shadow-md">
              <Image src="/MD - Home/Screen Recording 2023-06-16 at 9.49.48 AM 1.png" alt="Final Update Icon" width={250} height={100} />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
