import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';

/**
 * Reusable navigation link component
 * @param {Object} props - Component properties
 * @param {string} props.href - Link destination
 * @param {string} props.text - Link text
 * @returns {JSX.Element} Navigation link component
 */
export const NavLink = ({ href, text }) => (
  <Link 
    href={href} 
    className="font-medium text-sm lg:text-base text-gray-900 hover:text-accent transition-colors"
  >
    {text}
  </Link>
);

/**
 * Reusable dropdown button component
 * @param {Object} props - Component properties
 * @param {string} props.text - Button text
 * @param {boolean} props.isOpen - Whether the dropdown is open
 * @param {Function} props.onClick - Click handler function
 * @returns {JSX.Element} Dropdown button component
 */
export const DropdownButton = ({ text, isOpen, onClick }) => (
  <button 
    className="font-medium text-sm lg:text-base text-gray-900 hover:text-accent transition-colors flex items-center"
    onClick={onClick}
  >
    {text}
    <Image 
      src="/icons/chevron-down.svg" 
      alt="Dropdown" 
      width={16} 
      height={16} 
      className={`ml-1 transform ${isOpen ? 'rotate-180' : ''}`} 
    />
  </button>
);

/**
 * Reusable dropdown link component
 * @param {Object} props - Component properties
 * @param {string} props.href - Link destination
 * @param {string} props.text - Link text
 * @param {Function} props.onClick - Click handler function
 * @returns {JSX.Element} Dropdown link component
 */
export const DropdownLink = ({ href, text, onClick }) => (
  <Link 
    href={href} 
    className="block px-4 py-2 text-sm text-gray-800 hover:bg-gray-100 hover:text-accent"
    onClick={onClick}
  >
    {text}
  </Link>
);

/**
 * Reusable mobile dropdown link component
 * @param {Object} props - Component properties
 * @param {string} props.href - Link destination
 * @param {string} props.text - Link text
 * @param {Function} props.onClick - Click handler function
 * @returns {JSX.Element} Mobile dropdown link component
 */
export const MobileDropdownLink = ({ href, text, onClick }) => (
  <Link 
    href={href} 
    className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
    onClick={onClick}
  >
    {text}
  </Link>
);

/**
 * Primary action button with arrow icon
 * @param {Object} props - Component properties
 * @param {string} props.href - Link destination
 * @param {string} props.text - Button text
 * @param {boolean} props.mobile - Whether this is in mobile view
 * @returns {JSX.Element} Primary action button component
 */
export const PrimaryActionButton = ({ href, text, mobile = false }) => (
  <Link 
    href={href} 
    className={`${mobile ? 'w-full justify-center' : ''} px-3 lg:px-4 py-1.5 lg:py-2 bg-[#333333] text-white rounded-md font-medium text-sm lg:text-base hover:bg-gray-800 transition-colors flex items-center`}
  >
    <Image 
      src="/icons/arrow-right.svg" 
      alt="Arrow Right" 
      width={16} 
      height={16} 
      className={`${mobile ? 'mr-2' : 'mr-1 lg:mr-2'} h-3 w-3 lg:h-4 lg:w-4 invert`} 
    />
    <span>{text}</span>
  </Link>
);

/**
 * Action button for Hero and CTA sections
 * @param {Object} props - Component properties
 * @param {string} props.href - Link destination
 * @param {string} props.text - Button text
 * @param {boolean} props.primary - Whether this is a primary button (true) or secondary button (false)
 * @returns {JSX.Element} Action button component
 */
export const ActionButton = ({ href, text, primary = true }) => (
  <Link
    href={href}
    className={`px-6 py-3 ${primary ? 'bg-accent' : 'border border-gray-900'} 
    ${primary ? 'text-white' : 'text-gray-900'} 
    rounded-md font-medium 
    ${primary ? 'hover:bg-accent-hover' : 'hover:bg-gray-100'} 
    transition-colors flex items-center`}
  >
    <span>{text}</span>
    {primary && (
      <span className="ml-2">
        <Image
          src="/icons/button-arrow.svg"
          alt="Arrow"
          width={18}
          height={18}
        />
      </span>
    )}
  </Link>
);

/**
 * Common product categories data for reuse
 */
export const productCategories = [
  { href: "/products/for-sellers", text: "For Sellers" },
  { href: "/products/for-buyers", text: "For Buyers" },
  { href: "/products/kitchen-and-bath", text: "Kitchen & Bath Showroom" },
  { href: "/products/commercial", text: "Commercial Program" },
  { href: "/products/architects-and-designers", text: "Architects & Designers" }
];

/**
 * Common contact options data for reuse
 */
export const contactOptions = [
  { href: "/contact", text: "Contact Us" },
  { href: "/get-estimate", text: "Get Estimate" },
  { href: "/get-qualified", text: "Get Qualified" },
  { href: "/become-affiliate", text: "Become an Affiliate" }
];

/**
 * Video player utility hook for handling video playback state
 * @param {Object} initialState - Initial state for video playback
 * @returns {Object} Video control state and handler functions
 */
export const useVideoPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    // Preload video when component mounts
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, []);

  const handlePlayVideo = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        const playPromise = videoRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
            })
            .catch(error => {
              console.error("Video playback failed:", error);
              setIsPlaying(false);
            });
        }
      }
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  const handleVideoLoaded = () => {
    setIsVideoLoaded(true);
  };

  return {
    isPlaying,
    isVideoLoaded,
    videoRef,
    handlePlayVideo,
    handleVideoEnded,
    handleVideoLoaded
  };
};