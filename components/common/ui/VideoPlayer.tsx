import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { VideoPlayButton, VideoBackButton } from './';
import { AnimationType, AnimationDelay, animations } from '../../../utils/animationUtils';

interface VideoPlayerProps {
  posterSrc: string;
  videoSrc: string;
  alt: string;
  className?: string;
  aspectRatio?: string; // e.g. '56.25%' for 16:9
  rounded?: boolean; // Default to false for straight corners per Figma
  shadow?: boolean; // Control shadow
  controls?: boolean; // Show video controls when playing
  animate?: boolean; // Whether to animate
  animationType?: AnimationType;
  animationDelay?: AnimationDelay;
  isVisible?: boolean; // For coordinating with parent's visibility
}

export default function VideoPlayer({ 
  posterSrc, 
  videoSrc, 
  alt,
  className = '',
  aspectRatio = '56.25%', // Default to 16:9 aspect ratio
  rounded = false, // Default to straight corners per Figma
  shadow = false, // Default to no shadow
  controls = true, // Default to showing controls
  animate = false,
  animationType = 'fadeIn',
  animationDelay,
  isVisible = true
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
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
  
  const handleResetVideo = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

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

  // Generate animation classes - updated to use imported animations from utils
  const getAnimationClass = () => {
    if (!animate) return '';
    
    // Use the base animation class from animations object
    const animClass = animations[animationType] || '';
    
    // For delay, we need just the class name without the initial state
    const delayClass = animationDelay ? animations[animationDelay] : '';
    
    // When visible, use the core animation classes, otherwise keep opacity at 0
    return isVisible 
      ? `opacity-100 transform-none transition-all duration-1000 ${delayClass}`.trim()
      : animClass;
  };

  // Apply conditional classes
  const containerClasses = [
    'relative',
    'overflow-hidden',
    shadow ? 'shadow-md' : '',
    rounded ? 'rounded-lg' : '', // Straight corners per Figma unless explicitly rounded
    animate ? getAnimationClass() : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      <div className="relative" style={{ paddingBottom: aspectRatio }}>
        {/* Static Image Overlay */}
        <div 
          className={`absolute inset-0 ${isPlaying ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity duration-300 z-10`}
        >
          <Image
            src={posterSrc}
            alt={alt}
            fill
            className="object-cover"
            sizes="(max-width: 767px) 100vw, (max-width: 1023px) 80vw, 56vw"
            priority
          />
          <VideoPlayButton onClick={handlePlayVideo} />
        </div>
        
        {/* Video Element with Back button */}
        <div className={`absolute inset-0 ${isPlaying ? 'opacity-100 z-30' : 'opacity-0 z-0'} transition-opacity duration-300`}>
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            poster={posterSrc}
            controls={isPlaying && controls}
            onEnded={handleVideoEnded}
            playsInline
          >
            <source src={videoSrc} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          
          <VideoBackButton onClick={handleResetVideo} />
        </div>
      </div>
    </div>
  );
}