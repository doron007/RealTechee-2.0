// filepath: /Users/doron/Projects/RealTechee 2.0/components/common/ui/VideoPlayButton.tsx
import React from 'react';

interface VideoPlayButtonProps {
  onClick: () => void;
  className?: string;
}

/**
 * A reusable play button component for video thumbnails
 * Displays a button with a thin black border and solid black play triangle
 */
export default function VideoPlayButton({ onClick, className = '' }: VideoPlayButtonProps) {
  return (
    <button 
      onClick={onClick}
      className={`absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-20 group cursor-pointer ${className}`}
      aria-label="Play video"
      type="button"
    >
      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white bg-opacity-50 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-lg border border-black">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="black" 
          stroke="black" 
          strokeWidth="1" 
          className="w-8 h-8 sm:w-10 sm:h-10 ml-1"
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    </button>
  );
}