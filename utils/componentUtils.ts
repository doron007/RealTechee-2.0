import Link from 'next/link';
import Image from 'next/image';
import React, { useState, useRef, useEffect, MouseEvent, RefObject, ReactElement } from 'react';

interface NavLinkProps {
  href: string;
  text: string;
}

/**
 * Reusable navigation link component
 */
export const NavLink = (props: NavLinkProps) => {
  const { href, text } = props;
  return React.createElement(
    Link,
    { href, className: "font-medium text-sm lg:text-base text-dark-gray hover:text-black transition-colors" },
    text
  );
};

interface DropdownButtonProps {
  text: string;
  isOpen: boolean;
  onClick: () => void;
}

/**
 * Reusable dropdown button component
 */
export const DropdownButton = (props: DropdownButtonProps) => {
  const { text, isOpen, onClick } = props;
  return React.createElement(
    'button',
    { 
      className: "font-medium text-sm lg:text-base text-dark-gray hover:text-black transition-colors flex items-center",
      onClick 
    },
    text,
    React.createElement(
      Image,
      { 
        src: "/icons/chevron-down.svg", 
        alt: "Dropdown", 
        width: 16, 
        height: 16, 
        className: `ml-1 transform ${isOpen ? 'rotate-180' : ''}` 
      }
    )
  );
};

interface DropdownLinkProps {
  href: string;
  text: string;
  onClick?: () => void;
}

/**
 * Reusable dropdown link component
 */
export const DropdownLink = (props: DropdownLinkProps) => {
  const { href, text, onClick } = props;
  return React.createElement(
    Link,
    { 
      href, 
      className: "block px-4 py-2 text-sm font-heading font-normal text-dark-gray hover:bg-off-white transition-colors",
      onClick 
    },
    text
  );
};

/**
 * Reusable mobile dropdown link component
 */
export const MobileDropdownLink = (props: DropdownLinkProps) => {
  const { href, text, onClick } = props;
  return React.createElement(
    Link,
    { 
      href, 
      className: "block px-3 py-2 rounded-md text-sm font-body font-medium text-medium-gray hover:bg-off-white hover:text-black",
      onClick 
    },
    text
  );
};

interface PrimaryActionButtonProps {
  href: string;
  text: string;
  mobile?: boolean;
}

/**
 * Primary action button with arrow icon
 */
export const PrimaryActionButton = (props: PrimaryActionButtonProps) => {
  const { href, text, mobile = false } = props;
  return React.createElement(
    Link,
    {
      href,
      className: `${mobile ? 'w-full justify-center' : ''} px-3 lg:px-4 py-1.5 lg:py-2 bg-black text-white rounded-md font-medium text-sm lg:text-base hover:bg-dark-gray transition-colors flex items-center`
    },
    React.createElement(
      Image,
      {
        src: "/icons/arrow-right.svg",
        alt: "Arrow Right",
        width: 16,
        height: 16,
        className: `${mobile ? 'mr-2' : 'mr-1 lg:mr-2'} h-3 w-3 lg:h-4 lg:w-4 invert`
      }
    ),
    React.createElement('span', null, text)
  );
};

interface ActionButtonProps {
  href: string;
  text: string;
  primary?: boolean;
  variant?: 'primary' | 'secondary' | 'dark';
  showArrow?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
}

/**
 * Action button for Hero and CTA sections
 */
export const ActionButton = (props: ActionButtonProps) => {
  const { 
    href, 
    text, 
    primary = true, 
    variant,
    showArrow = true,
    disabled = false,
    className = '',
    onClick
  } = props;
  
  return React.createElement(
    Link,
    {
      href,
      className: `px-6 py-3 ${primary ? 'bg-black' : 'border border-dark-gray'} 
      ${primary ? 'text-white' : 'text-dark-gray'} 
      rounded-md font-medium 
      ${primary ? 'hover:bg-dark-gray' : 'hover:bg-off-white'} 
      transition-colors flex items-center ${className}`,
      onClick
    },
    React.createElement('span', null, text),
    primary && showArrow 
      ? React.createElement(
          'span',
          { className: 'ml-2' },
          React.createElement(
            Image,
            {
              src: "/icons/button-arrow.svg",
              alt: "Arrow",
              width: 18,
              height: 18
            }
          )
        ) 
      : null
  );
};

interface ProductCategory {
  href: string;
  text: string;
}

/**
 * Common product categories data for reuse
 */
export const productCategories: ProductCategory[] = [
  { href: "/products/sellers", text: "For Sellers" },
  { href: "/products/buyers", text: "For Buyers" },
  { href: "/products/kitchen-and-bath", text: "Kitchen & Bath Showroom" },
  { href: "/products/commercial", text: "Commercial Program" },
  { href: "/products/architects-and-designers", text: "Architects & Designers" }
];

/**
 * Common contact options data for reuse
 */
export const contactOptions: ProductCategory[] = [
  { href: "/contact/contact-us", text: "Contact Us" },
  { href: "/contact/get-estimate", text: "Get Estimate" },
  { href: "/contact/get-qualified", text: "Get Qualified" },
  { href: "/contact/affiliate", text: "Become an Affiliate" }
];

interface VideoPlayerHook {
  isPlaying: boolean;
  isVideoLoaded: boolean;
  videoRef: RefObject<HTMLVideoElement>;
  handlePlayVideo: () => void;
  handleVideoEnded: () => void;
  handleVideoLoaded: () => void;
}

/**
 * Video player utility hook for handling video playback state
 */
export function useVideoPlayer(): VideoPlayerHook {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);

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
    videoRef: videoRef as RefObject<HTMLVideoElement>,
    handlePlayVideo,
    handleVideoEnded,
    handleVideoLoaded
  };
}