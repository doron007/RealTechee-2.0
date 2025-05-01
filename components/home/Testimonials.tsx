import { useVideoPlayer } from '../../utils/componentUtils';
import { BodyText } from '../Typography';

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
    <section className="py-[88px] bg-[#FCF9F8]">
      <div className="max-w-[1440px] mx-auto px-[120px]">
        <div className="flex flex-col md:flex-row gap-[64px] items-center">
          {/* Video Testimonial - Using auto height to display naturally */}
          <div className="relative w-full md:w-[628px] overflow-hidden shadow-lg flex-shrink-0">
            {/* Video Thumbnail with Play Button Overlay */}
            <div className="relative w-full">
              {/* Static Image - No rounded corners as per Figma and using natural height */}
              <div className={`transition-opacity duration-300 ${isPlaying ? 'opacity-0' : 'opacity-100 z-10'}`}>
                <img
                  src="/videos/realtechee_testimonial_image.png"
                  alt="Testimonial video thumbnail"
                  className="w-full h-auto"
                  style={{ display: 'block' }}
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
                    <div className="w-[76px] h-[76px] flex items-center justify-center rounded-full bg-transparent border-4 border-white group-hover:scale-110 group-hover:bg-white group-hover:bg-opacity-20 transition-all duration-300">
                      <img 
                        src="/assets/icons/play.svg" 
                        alt="Play" 
                        width="32" 
                        height="32"
                      />
                    </div>
                  </button>
                </div>
              )}
              
              {/* Video Element - No rounded corners as per Figma */}
              <div className={`absolute inset-0 transition-opacity duration-300 ${isPlaying ? 'opacity-100 z-30' : 'opacity-0'}`}>
                <video
                  ref={videoRef}
                  className="w-full h-auto"
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
          
          {/* Testimonial Text - Using exact text from Figma design */}
          <div className="w-full md:w-[628px] flex items-center justify-center">
            <p className="text-[20px] leading-[1.6em] text-[#2A2B2E] font-body text-center">
              We helped 368 clients to improve their living space and increase value to their properties. Here is how we help our clients.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}