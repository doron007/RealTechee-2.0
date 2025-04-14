import { useState, useRef } from 'react';
import Image from 'next/image';

export default function Testimonials() {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayVideo = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Video Testimonial */}
          <div className="relative aspect-video rounded-lg overflow-hidden shadow-lg">
            {/* Video Thumbnail with Play Button Overlay */}
            <div className="relative w-full h-full">
              <Image
                src="/testimonials/testimonial-thumbnail.jpg"
                alt="Testimonial video thumbnail"
                fill
                className={`object-cover transition-opacity duration-300 ${isPlaying ? 'opacity-0' : 'opacity-100'}`}
              />
              
              {/* Play Button */}
              {!isPlaying && (
                <button
                  onClick={handlePlayVideo}
                  className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-40 transition-all duration-300"
                >
                  <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded-full bg-white bg-opacity-90 hover:bg-opacity-100 transition-all duration-300">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 5.14V19.14L19 12.14L8 5.14Z" fill="#FF5F45"/>
                    </svg>
                  </div>
                </button>
              )}
              
              {/* Video Element */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                poster="/testimonials/testimonial-thumbnail.jpg"
                controls={isPlaying}
                onClick={() => isPlaying && handlePlayVideo()}
              >
                <source src="/testimonials/testimonial-video.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              
              {/* Video Attribution */}
              <div className="absolute bottom-4 left-4 bg-white px-3 py-1 rounded-md shadow-md">
                <p className="text-xs font-medium">Matthew Engle</p>
                <p className="text-xs text-gray-600">Vista Sotheby's</p>
              </div>
            </div>
          </div>
          
          {/* Testimonial Text */}
          <div>
            <p className="text-xl text-gray-700 mb-6 leading-relaxed">
              We helped hundreds of clients to improve their living space and increase value to their properties. Here is how we help our clients.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}