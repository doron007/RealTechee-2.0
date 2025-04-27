import React from 'react';

// Define ColorTileProps interface directly in the file
interface ColorTileProps {
  bgColor: string;
  name: string;
  textColor?: string;
  colorCode: string;
  withBorder?: boolean;
}

/**
 * ColorTile component for displaying color swatches in the style guide
 * @param {Object} props - Component properties
 * @param {string} props.bgColor - Background color class
 * @param {string} props.name - Color name 
 * @param {string} props.textColor - Text color class
 * @param {string} props.colorCode - Color hex code
 * @param {boolean} props.withBorder - Whether to add a border (for white/light colors)
 */
export default function ColorTile({ 
  bgColor,
  name,
  textColor = 'text-white',
  colorCode,
  withBorder = false
}: ColorTileProps) {
  return (
    <div className={`px-4 pt-14 pb-4 ${bgColor} ${withBorder ? 'outline outline-1 outline-offset-[-1px] outline-neutral-200' : ''} flex justify-start items-end gap-2.5`}>
      <div className="flex-1 justify-start">
        <span className={`${textColor} text-xs md:text-sm font-normal font-inter`}>{name}<br/></span>
        <span className={`${textColor} text-base md:text-lg font-normal font-inter`}>{colorCode}</span>
      </div>
    </div>
  );
}