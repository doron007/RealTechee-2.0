import React from 'react';
import Button, { ButtonProps } from './Button';
import { twMerge } from 'tailwind-merge';

export type EstimatePriority = 'primary' | 'secondary' | 'tertiary';
export type EstimateStatus = 'normal' | 'hover' | 'pressed' | 'disabled';
export type EstimateMode = 'light' | 'dark';

export interface EstimateButtonProps extends Omit<ButtonProps, 'text' | 'iconSvg' | 'iconPosition' | 'variant'> {
  /**
   * Custom text (default is "Get an Estimate")
   */
  text?: string;
  
  /**
   * Button priority - maps to variant in Button component
   */
  priority?: EstimatePriority;
  
  /**
   * Force button status (for style guide and testing)
   */
  forceStatus?: EstimateStatus;
}

/**
 * GetAnEstimateButton component implementing the RealTechee design system
 * 
 * Specialized button for "Get an Estimate" calls to action
 * 
 * Extends the base Button component with fixed icon and text defaults
 */
const EstimateButton: React.FC<EstimateButtonProps> = ({
  text = "Get an Estimate",
  withIcon = true,
  priority = 'primary',
  mode = 'light',
  forceStatus,
  className = '',
  size = 'md',
  textSize,
  ...rest
}) => {
  // Determine responsive text size based on button size if not explicitly provided
  const responsiveTextSize = textSize || (size === 'sm' ? 'sm' : 'base');
  
  // Add responsive adjustments for XS screens without affecting text color
  // Only add size-related classes, not color-related ones
  const responsiveClasses = twMerge(
    // Base classes from the component
    className,
    // Only add font size classes, not text color
    'xs:text-xs'
  );
  
  return (
    <Button
      variant={priority} // Map priority prop to Button's variant prop
      mode={mode}
      text={text}
      withIcon={withIcon}
      iconPosition="left"
      iconSvg="/assets/icons/arrow-right.svg"
      forceState={forceStatus} // Map forceStatus prop to Button's forceState prop
      size={size}
      textSize={responsiveTextSize}
      className={responsiveClasses}
      {...rest}
    />
  );
};

export default EstimateButton;