// filepath: /Users/doron/Projects/RealTechee 2.0/components/home/AboutSection.tsx
import { useState, useRef } from 'react';
import Image from 'next/image';
import { VideoPlayButton, VideoBackButton } from '../common/ui';
import { SectionLabel, SectionTitle, BodyContent } from '..';

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
    <section className={`section-container bg-[#FCF9F8] py-[88px] ${className}`}>
      <div className="section-content">
        {/* Section Title and Label */}
        <div className="text-center mb-12">
          <SectionLabel className="text-primary">About Us</SectionLabel>
          <SectionTitle className="mt-2">Our Mission</SectionTitle>
        </div>

        {/* Using grid to ensure equal heights with 2 columns on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* Video/Image Container - Using aspect ratio to match Figma design */}
          <div className="w-full aspect-[16/9] rounded-lg overflow-hidden">
            {!isPlaying ? (
              <div className="relative w-full h-full">
                <Image 
                  src="/assets/images/pages_home_howItWorks.png" 
                  alt="About RealTechee" 
                  fill
                  className="object-cover rounded-lg"
                />
                <VideoPlayButton onClick={handleVideoClick} />
              </div>
            ) : (
              <div className="relative w-full h-full">
                <video 
                  ref={videoRef}
                  src="/videos/RealTechee Intro.mp4" 
                  className="w-full h-full object-cover rounded-lg"
                  controls={true}
                  autoPlay={true}
                  onEnded={() => setIsPlaying(false)}
                />
                <VideoBackButton onClick={handleResetVideo} />
              </div>
            )}
          </div>
          
          {/* Description Text - Maintaining vertical alignment */}
          <div className="w-full flex items-center">
            <BodyContent className="text-[#2A2B2E] leading-[1.6em] text-center md:text-left">
              RealTechee was founded with a vision: to provide turn-key tools and technology to various industries, including automated programs, virtual walk-throughs, CRM, and UI. Our goal is to enhance user experience and execution for professionals and their clients, driving improved performance, conversion rates, and value.
            </BodyContent>
          </div>
        </div>
      </div>
    </section>
  );
}