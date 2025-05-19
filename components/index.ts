/**
 * Root components barrel file
 * This file re-exports all components for easier imports
 */

// Export all Typography components from consolidated file
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
  CardContent,
  PageHeader,
  SectionTitle,
  Subtitle,
  BodyContent,
  SubContent,
  ButtonText
} from './Typography';

// Export Animated Typography components
export {
  AnimatedSectionLabel,
  AnimatedSectionTitle,
  AnimatedSubtitle,
  AnimatedBodyContent,
  AnimatedSubContent,
  AnimatedPageHeader,
  AnimatedButtonText,
  AnimatedCardTitle,
  AnimatedCardSubtitle,
  AnimatedCardContent
} from './AnimatedTypography';

// Export specific UI components directly
import { SliderNavBar } from './common/ui';
export { SliderNavBar };

// Export sections by page
export * from './home';
export * from './contact';

// Explicitly re-export from common to avoid conflicts
import * as CommonComponents from './common';
export { CommonComponents };

export * from './style-guide';