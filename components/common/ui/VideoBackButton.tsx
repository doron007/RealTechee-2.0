// filepath: /Users/doron/Projects/RealTechee 2.0/components/common/ui/VideoBackButton.tsx
import React from 'react';

interface VideoBackButtonProps {
  onClick: () => void;
  className?: string;
}

/**
 * A reusable back button component for video players
 * Displays a back button with an arrow icon to return from video to thumbnail
 */
export default function VideoBackButton({ onClick, className = '' }: VideoBackButtonProps) {
  return (
    <div className={`absolute top-4 left-4 z-50 ${className}`}>
      <button 
        onClick={onClick}
        className="flex items-center justify-center gap-1 px-3 py-2 bg-black/70 hover:bg-black rounded-md text-white text-sm transition-colors"
        aria-label="Go back"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="currentColor" 
          className="w-4 h-4"
        >
          <path 
            fillRule="evenodd" 
            d="M9.53 2.47a.75.75 0 010 1.06L4.81 8.25H15a6.75 6.75 0 010 13.5h-3a.75.75 0 010-1.5h3a5.25 5.25 0 100-10.5H4.81l4.72 4.72a.75.75 0 11-1.06 1.06l-6-6a.75.75 0 010-1.06l6-6a.75.75 0 011.06 0z" 
            clipRule="evenodd" 
          />
        </svg>
        Back
      </button>
    </div>
  );
}