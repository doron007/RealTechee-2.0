/**
 * Type definitions for ColorTile component props
 */
export interface ColorTileProps {
  /** Background color CSS class */
  bgColor: string;
  /** Color name label */
  name: string;
  /** Hex color code */
  colorCode: string;
  /** Text color CSS class for the content */
  textColor?: string;
  /** Whether to show a border around the tile */
  withBorder?: boolean;
}

/**
 * Type definitions for StatItem component props
 */
export interface StatItemProps {
  /** The numerical value to display */
  value: string | number;
  /** The label describing the statistic */
  label: string;
  /** Icon component or element to display (optional) */
  icon?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}