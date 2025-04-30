// filepath: /Users/doron/Projects/RealTechee 2.0/components/home/AboutSection.tsx
import { useState, useRef } from 'react';
import Image from 'next/image';

interface AboutSectionProps {
  className?: string;
}

export default function AboutSection({ className = '' }: AboutSectionProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } else {
      // If video ref is not available yet, just set isPlaying to true
      // so the video will be rendered and autoplay
      setIsPlaying(true);
    }
  };

  const handleResetVideo = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setIsPlaying(false);
  };

  return (
    <section className={`py-[88px] bg-[#FCF9F8] ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-[120px] flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
        {/* Video/Image Container */}
        <div className="relative w-full lg:w-1/2 rounded-lg overflow-hidden">
          {!isPlaying ? (
            <>
              <Image 
                src="/MD - Home/howItWorks.png" 
                alt="About RealTechee" 
                width={600} 
                height={400}
                className="w-full rounded-lg"
              />
              <div 
                className="absolute inset-0 flex items-center justify-center cursor-pointer"
                onClick={handleVideoClick}
              >
                <div className="w-16 h-16 bg-white/80 rounded-full flex items-center justify-center border-2 border-black">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-primary ml-1">
                    <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </>
          ) : (
            <div className="relative">
              <video 
                ref={videoRef}
                src="/videos/RealTechee Intro.mp4" 
                className="w-full rounded-lg"
                controls={true}
                autoPlay={true}
                onEnded={() => setIsPlaying(false)}
              />
              {/* Reset button overlay */}
              <div className="absolute top-4 left-4 z-10">
                <button 
                  onClick={handleResetVideo}
                  className="flex items-center justify-center gap-1 px-3 py-2 bg-black/70 hover:bg-black rounded-md text-white text-sm transition-colors"
                  aria-label="Reset video"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M9.53 2.47a.75.75 0 010 1.06L4.81 8.25H15a6.75 6.75 0 010 13.5h-3a.75.75 0 010-1.5h3a5.25 5.25 0 100-10.5H4.81l4.72 4.72a.75.75 0 11-1.06 1.06l-6-6a.75.75 0 010-1.06l6-6a.75.75 0 011.06 0z" clipRule="evenodd" />
                  </svg>
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Description Text */}
        <div className="w-full lg:w-1/2">
          <p className="text-[#2A2B2E] text-xl font-normal font-['Roboto'] leading-[1.6em] text-center lg:text-left">
            RealTechee was founded with a vision: to provide turn-key tools and technology to various industries, including automated programs, virtual walk-throughs, CRM, and UI. Our goal is to enhance user experience and execution for professionals and their clients, driving improved performance, conversion rates, and value.
          </p>
        </div>
      </div>
    </section>
  );
}