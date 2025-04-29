// filepath: /Users/doron/Projects/RealTechee 2.0/components/home/AboutSection.tsx
import Image from 'next/image';

export default function AboutSection(props: any) {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Illustration */}
          <div className="flex justify-center">
            <div className="relative w-64 h-64 md:w-80 md:h-80 bg-white rounded-full p-8">
              <Image
                src="/illustrations/teamwork.svg"
                alt="Team collaboration illustration"
                width={300}
                height={300}
                className="object-contain"
              />
            </div>
          </div>
          
          {/* Content */}
          <div>
            <p className="text-gray-800 text-lg leading-relaxed">
              RealTechee was founded with a vision: to provide turn-key tools and technology to various 
              industries, including automated programs, virtual walk-throughs, CRM, and UI. Our goal is to 
              enhance user experience and execution for professionals and their clients, driving improved 
              performance, conversion rates, and value.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}