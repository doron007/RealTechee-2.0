import React, { ReactNode, useState } from 'react';
import Image from 'next/image';
import { twMerge } from 'tailwind-merge';
import { CardTitle, CardSubtitle, CardContent } from '../../';

// Variants based on different cards in the site
export type CardVariant = 'default' | 'feature' | 'dealBreaker' | 'step';

export interface CardProps {
  /**
   * Card variant affects the overall layout and styling
   */
  variant?: CardVariant;
  
  /**
   * Optional icon to display with the card
   */
  icon?: string;
  
  /**
   * The title text for the card
   */
  title: string | ReactNode;
  
  /**
   * Optional subtitle for the card
   */
  subtitle?: string | ReactNode;
  
  /**
   * The main content for the card
   */
  content?: string | ReactNode;
  
  /**
   * Additional content to render at the bottom of the card
   */
  footer?: ReactNode;
  
  /**
   * For step cards, the step number
   */
  step?: number;
  
  /**
   * Control the position of the icon
   */
  iconPosition?: 'left' | 'top';
  
  /**
   * Whether the icon should be white/inverse on hover or active states
   */
  inverseIconOnHover?: boolean;
  
  /**
   * Whether the card should have hover effects
   */
  hasHoverEffect?: boolean;
  
  /**
   * Optional custom icon component
   */
  iconComponent?: ReactNode;
  
  /**
   * Additional CSS class names
   */
  className?: string;
  
  /**
   * Additional CSS class names for the icon container
   */
  iconClassName?: string;
  
  /**
   * Additional CSS class names for the content container
   */
  contentClassName?: string;
  
  /**
   * Any other props to pass to the root element
   */
  [key: string]: any;
}

/**
 * A reusable Card component that supports different variants and layouts
 */
const Card: React.FC<CardProps> = ({
  variant = 'default',
  icon,
  title,
  subtitle,
  content,
  footer,
  step,
  iconPosition = variant === 'feature' ? 'left' : 'top',
  inverseIconOnHover = false,
  hasHoverEffect = variant === 'dealBreaker',
  iconComponent,
  className = '',
  iconClassName = '',
  contentClassName = '',
  ...props
}) => {
  // State for hover effects
  const [isHovered, setIsHovered] = useState(false);

  // Determine card styles based on variant
  const getCardStyles = () => {
    switch (variant) {
      case 'feature':
        return 'p-4 sm:p-5 md:p-6 bg-white rounded-md outline outline-1 outline-offset-[-1px] outline-stone-200';
      case 'dealBreaker':
        return `p-6 sm:p-8 md:p-10 lg:p-12 rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-[30px] 
          ${isHovered ? 'bg-zinc-800 shadow-lg' : 'bg-white'} 
          transition-all duration-300 ease-in-out
          ${hasHoverEffect ? 'hover:transform hover:-translate-y-1 cursor-pointer' : ''}`;
      case 'step':
        return 'bg-gradient-to-tr from-[#4F4F4F] via-[#4F4F4F]/50 to-[#4F4F4F] border border-[#6C6C6C] rounded-lg p-5 sm:p-6 md:p-8 h-full';
      default:
        return 'p-5 sm:p-6 md:p-7 bg-white rounded-lg shadow-sm';
    }
  };

  // Determine text color based on variant and hover state
  const getTextColorClass = () => {
    if (variant === 'step') return 'text-white';
    if (variant === 'dealBreaker' && isHovered) return 'text-white';
    return 'text-dark-gray';
  };

  // Determine description color based on variant and hover state
  const getDescriptionColorClass = () => {
    if (variant === 'step') return 'text-white opacity-90';
    if (variant === 'dealBreaker' && isHovered) return 'text-white';
    return 'text-medium-gray';
  };

  // Get icon container classes
  const getIconContainerClass = () => {
    switch (variant) {
      case 'feature':
        return 'min-w-[20px] min-h-[20px] w-[20px] h-[20px] sm:min-w-[24px] sm:min-h-[24px] sm:w-[24px] sm:h-[24px] mr-2 flex-shrink-0 text-accent';
      case 'dealBreaker':
        return 'w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 relative overflow-hidden flex items-center justify-center mb-4';
      case 'step':
        return 'flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-transparent mb-4';
      default:
        return 'w-10 h-10 mb-4 flex items-center justify-center';
    }
  };

  // Get icon classes
  const getIconClass = () => {
    if (!icon) return '';
    
    if (variant === 'dealBreaker' && inverseIconOnHover) {
      return `w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 ${isHovered ? '' : 'brightness-0'} transition-all duration-300`;
    }
    
    if (variant === 'dealBreaker' && !inverseIconOnHover) {
      return `w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 ${isHovered ? 'invert' : 'brightness-0'} transition-all duration-300`;
    }
    
    if (variant === 'step') {
      return 'text-white w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10';
    }
    
    return 'w-full h-full';
  };

  // Handle hover events if needed
  const hoverProps = hasHoverEffect ? {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  } : {};

  // Render functions for different parts of the card
  const renderIcon = () => {
    if (iconComponent) return iconComponent;
    
    if (icon) {
      return (
        <div className={twMerge(getIconContainerClass(), iconClassName)}>
          <Image
            src={icon}
            alt={typeof title === 'string' ? title : 'Card icon'}
            width={24}
            height={24}
            className={getIconClass()}
          />
        </div>
      );
    }
    
    return null;
  };

  const renderTitle = () => {
    if (variant === 'step' && step) {
      return (
        <CardTitle className={getTextColorClass()}>
          Step {step}<br/>
          {title}
        </CardTitle>
      );
    }
    
    return typeof title === 'string' ? (
      <CardTitle className={getTextColorClass()}>{title}</CardTitle>
    ) : (
      title
    );
  };

  const renderSubtitle = () => {
    if (!subtitle) return null;
    
    return typeof subtitle === 'string' ? (
      <CardSubtitle className={getDescriptionColorClass()}>{subtitle}</CardSubtitle>
    ) : (
      subtitle
    );
  };

  const renderContent = () => {
    if (!content) return null;
    
    return typeof content === 'string' ? (
      <CardContent className={getDescriptionColorClass()}>{content}</CardContent>
    ) : (
      content
    );
  };

  return (
    <div 
      className={twMerge(
        'flex flex-col',
        iconPosition === 'left' ? 'flex-row' : 'flex-col',
        getCardStyles(),
        className
      )}
      {...hoverProps}
      {...props}
    >
      {renderIcon()}
      
      <div className={twMerge(
        'flex flex-col gap-2', 
        iconPosition === 'left' ? 'flex-1' : '',
        contentClassName
      )}>
        {renderTitle()}
        {renderSubtitle()}
        {renderContent()}
        {footer && <div className="mt-4">{footer}</div>}
      </div>
    </div>
  );
};

export default Card;