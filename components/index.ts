/**
 * Root components barrel file
 * This file re-exports all components for easier imports
 */

// Export Typography components
export {
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  SectionLabel,
  SubtitlePill,
  BodyText,
  BodyTextSecondary,
  CardTitle,
  CardSubtitle,
  CardText,
  CardContent
} from './Typography';

// Export Responsive Typography components
export {
  PageHeader,
  SectionTitle,
  Subtitle,
  BodyContent,
  SubContent,
  ButtonText
} from './ResponsiveTypography';

// Export Animated Typography components
export {
  AnimatedSectionLabel,
  AnimatedSectionTitle,
  AnimatedSubtitle,
  AnimatedBodyContent,
  AnimatedSubContent
} from './AnimatedTypography';

// Export sections by page
export * from './home';
export * from './contact';
export * from './common';
export * from './style-guide';