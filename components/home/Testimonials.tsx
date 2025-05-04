import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { VideoPlayButton, VideoBackButton } from '../common/ui';

// Define TestimonialsProps interface directly in the file
interface TestimonialsProps {
  className?: string;
}

export default function Testimonials(props: TestimonialsProps) {
  // Direct video ref and state management instead of using hook
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  
  // Direct video control functions
  const handlePlayVideo = () => {
    if (videoRef.current) {
      videoRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(error => {
          console.error("Video play failed:", error);
        });
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
  };
  
  // Reset video function
  const handleResetVideo = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setIsPlaying(false);
  };

  // Animation on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.15
      }
    );

    const section = document.querySelector('.testimonials-section');
    if (section) {
      observer.observe(section);
    }

    return () => {
      if (section) {
        observer.unobserve(section);
      }
    };
  }, []);

  // Add event listener for video ending
  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement) {
      videoElement.addEventListener('ended', handleVideoEnded);
      return () => {
        videoElement.removeEventListener('ended', handleVideoEnded);
      };
    }
  }, []);

  return (
    <section className="testimonials-section section-container bg-[#FCF9F8] py-10 sm:py-12 md:py-16 lg:py-20 xl:py-24">
      <div className="section-content">
        {/* Section Title */}
        <div className="mb-8 sm:mb-10 md:mb-12 text-center">
          <h2 className="text-dark-gray font-bold font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-tight">
            Testimonials
          </h2>
        </div>
        
        <div className={`flex flex-col lg:flex-row gap-8 sm:gap-10 md:gap-12 lg:gap-14 xl:gap-16 items-center ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        } transition-all duration-1000`}>
          {/* Video Container - Revised implementation */}
          <div className="relative w-full lg:w-1/2 max-w-[650px]">
            <div className="rounded-lg overflow-hidden shadow-md">
              {/* Use a more reliable aspect-ratio approach */}
              <div className="relative" style={{ paddingBottom: '56.25%' /* 16:9 aspect ratio */ }}>
                {/* Static Image Overlay */}
                <div 
                  className={`absolute inset-0 ${isPlaying ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity duration-300 z-10`}
                >
                  <Image
                    src="/videos/realtechee_testimonial_image.png"
                    alt="Client testimonial"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                  <VideoPlayButton onClick={handlePlayVideo} />
                </div>
                
                {/* Video Element with Back button */}
                <div className={`absolute inset-0 ${isPlaying ? 'opacity-100 z-30' : 'opacity-0 z-0'} transition-opacity duration-300`}>
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    poster="/videos/realtechee_testimonial_image.png"
                    controls={isPlaying}
                    onEnded={handleVideoEnded}
                    playsInline
                  >
                    <source src="/videos/realtechee_testimonial.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  
                  <VideoBackButton onClick={handleResetVideo} />
                </div>
              </div>
            </div>
          </div>
          
          {/* Testimonial Content */}
          <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className={`transition-all delay-300 duration-1000 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              {/* Quote Text */}
              <div className="font-body text-dark-gray text-lg sm:text-xl md:text-2xl lg:text-3xl leading-relaxed max-w-xl">
                <p className="mb-8">
                  We helped hundreds of clients to improve their living space and increase value to their properties. Here is how we help our clients.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}