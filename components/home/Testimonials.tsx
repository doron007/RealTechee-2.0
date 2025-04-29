import { useVideoPlayer } from '../../utils/componentUtils';

// Define TestimonialsProps interface directly in the file
interface TestimonialsProps {
  className?: string;
}

export default function Testimonials(props: TestimonialsProps) {
  const {
    isPlaying,
    isVideoLoaded,
    videoRef,
    handlePlayVideo,
    handleVideoEnded,
    handleVideoLoaded
  } = useVideoPlayer();

  return (
    <section className="py-16 bg-[#FCF9F8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Video Testimonial */}
          <div className="relative aspect-video rounded-lg overflow-hidden shadow-lg">
            {/* Video Thumbnail with Play Button Overlay */}
            <div className="relative w-full h-full">
              {/* Static Image */}
              <div className={`absolute inset-0 transition-opacity duration-300 ${isPlaying ? 'opacity-0' : 'opacity-100 z-10'}`}>
                <img
                  src="/videos/realtechee_testimonial_image.png"
                  alt="Testimonial video thumbnail"
                  className="object-cover w-full h-full"
                />
              </div>
              
              {/* Play Button */}
              {!isPlaying && (
                <div 
                  className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-20 cursor-pointer"
                >
                  <button
                    onClick={handlePlayVideo}
                    className="group"
                    aria-label="Play testimonial video"
                  >
                    <div className="w-[50px] h-[50px] flex items-center justify-center rounded-full bg-transparent border-4 border-white group-hover:scale-110 group-hover:bg-white group-hover:bg-opacity-20 transition-all duration-300">
                      {/* Using regular img tag instead of Next.js Image to properly render SVG colors */}
                      <img 
                        src="/icons/play.svg" 
                        alt="Play" 
                        width="32" 
                        height="32"
                      />
                    </div>
                  </button>
                </div>
              )}
              
              {/* Video Element */}
              <div className={`absolute inset-0 transition-opacity duration-300 ${isPlaying ? 'opacity-100 z-30' : 'opacity-0'}`}>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  poster="/videos/realtechee_testimonial_image.png"
                  controls={isPlaying}
                  onEnded={handleVideoEnded}
                  onLoadedData={handleVideoLoaded}
                  controlsList="nodownload"
                  playsInline
                  preload="auto"
                >
                  <source src="/videos/realtechee_testimonial.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
          
          {/* Testimonial Text */}
          <div>
            <p 
              className="text-medium-gray font-body"
              style={{
                fontSize: "clamp(16px, 1.2vw, 18px)",
                lineHeight: "1.6em",
                textAlign: "start",
                width: "100%",
                marginBottom: "24px",
                mixBlendMode: "normal"
              }}
            >
              We helped hundreds of clients to improve their living space and increase value to their properties. Here is how we help our clients.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}