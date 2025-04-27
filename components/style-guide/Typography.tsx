import React from 'react';

// Define props interface for Typography component
interface TypographyProps {
  type: string;
  size: string;
  ptSize: string;
  content: string;
  borderColor?: string;
  className?: string;
}

/**
 * Typography component for displaying typography styles in the style guide
 * 
 * @param {Object} props Component props
 * @param {string} props.type Type of typography element (e.g., "Heading", "Body", "Note")
 * @param {string} props.size Size identifier (e.g., "H1", "P1")
 * @param {string} props.ptSize Point size (e.g., "49pt")
 * @param {string} props.content Text content to display
 * @param {string} props.borderColor Border color class (default: "border-black")
 * @param {string} props.className Additional CSS classes
 * @returns {JSX.Element} The Typography component
 */
export default function Typography({ 
  type, 
  size, 
  ptSize, 
  content,
  borderColor = "border-black",
  className = "" 
}: TypographyProps) {
  const getTextClass = () => {
    switch(size) {
      case 'H1':
        return 'text-black text-5xl font-normal font-heading leading-[3.5rem]';
      case 'H2':
        return 'text-black text-4xl font-normal font-heading leading-10';
      case 'H3':
        return 'text-black text-3xl font-normal font-heading leading-9';
      case 'H4':
        return 'text-black text-2xl font-normal font-heading leading-tight';
      case 'H5':
        return 'text-black text-xl font-normal font-heading leading-normal';
      case 'P1':
        return 'text-black text-xl font-normal font-body leading-loose';
      case 'P2':
        return 'text-black text-base font-normal font-body leading-relaxed';
      case 'P3':
        return 'text-black text-xs font-normal font-body leading-tight';
      default:
        return 'text-black text-base font-normal';
    }
  };

  return (
    <div className="inline-flex justify-start items-center gap-2">
      <div className="origin-top-left -rotate-90 text-center text-neutral-400 text-base font-normal font-body">
        {type}
      </div>
      <div className={`px-8 border-l-[3px] ${borderColor} inline-flex flex-col justify-start items-start gap-6 ${className}`}>
        <div className="inline-flex justify-start items-baseline gap-7">
          <div className="text-neutral-400 text-lg font-normal font-body">{size} | {ptSize}</div>
          <div className={getTextClass()}>
            {content}
          </div>
        </div>
      </div>
    </div>
  );
}