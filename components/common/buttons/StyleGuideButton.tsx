import React from 'react';

interface StyleGuideButtonProps {
  status?: string;
  type?: string;
  bgColor?: string;
  textColor?: string;
  border?: boolean;
  borderColor?: string;
  colorCode?: string;
  colorLabel?: string;
  isColorOnly?: boolean;
}

/**
 * StyleGuideButton component for displaying button styles in the style guide
 * @param {Object} props - Component properties
 * @param {string} props.status - Button status (Normal, Hover, Pressed, Disabled)
 * @param {string} props.type - Button type (Primary, Secondary, Tertiary)
 * @param {string} props.bgColor - Background color
 * @param {string} props.textColor - Text color
 * @param {boolean} props.border - Whether to show border
 * @param {string} props.borderColor - Border color
 * @param {string} props.colorCode - Color code value (for color display)
 * @param {string} props.colorLabel - Color label (for color display)
 * @param {boolean} props.isColorOnly - Whether to only show color without text
 */
export default function StyleGuideButton({ 
  status,
  type = 'Primary',
  bgColor = 'bg-zinc-800',
  textColor = 'text-white',
  border = false,
  borderColor = 'border-zinc-800',
  colorCode,
  colorLabel,
  isColorOnly = false
}: StyleGuideButtonProps) {
  return (
    <div className="flex flex-col items-center">
      <div 
        className={`w-24 md:w-32 h-10 md:h-14 ${bgColor} ${border ? 'border' : ''} ${borderColor} rounded flex items-center justify-center mb-2`}
      >
        {!isColorOnly && (
          <span className={`text-center ${textColor} text-base md:text-xl font-normal font-inter`}>Click</span>
        )}
      </div>
      {colorCode && (
        <div className="text-center">
          <span className="text-black text-xs font-normal font-inter">{colorLabel}<br/></span>
          <span className="text-black text-base font-normal font-inter">{colorCode}</span>
        </div>
      )}
    </div>
  );
}