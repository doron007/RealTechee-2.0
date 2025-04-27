/**
 * Type definitions for Button component props
 */

export interface ButtonProps {
  /** Button variant: 'primary', 'secondary', or 'dark' */
  variant?: 'primary' | 'secondary' | 'dark';
  /** URL for the button to link to */
  href?: string;
  /** Button text content */
  text?: string;
  /** Whether to show the arrow icon */
  showArrow?: boolean;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Click handler function */
  onClick?: (event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
  /** Children elements (alternative to text) */
  children?: React.ReactNode;
}

/**
 * Type definitions for StyleGuideButton component props
 */
export interface StyleGuideButtonProps {
  /** Background color CSS class */
  bgColor: string;
  /** Text color CSS class */
  textColor?: string;
  /** Whether to show a border */
  border?: boolean;
  /** Border color CSS class */
  borderColor?: string;
  /** Whether this is a color-only display for the style guide */
  isColorOnly?: boolean;
  /** Color label for style guide display */
  colorLabel?: string;
  /** Color code for style guide display */
  colorCode?: string;
}