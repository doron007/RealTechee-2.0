/**
 * Root components barrel file
 * This file re-exports all components for easier imports
 */

// Export ONLY modern semantic typography components
export { default as H1 } from './typography/H1';
export { default as H2 } from './typography/H2';
export { default as H3 } from './typography/H3';
export { default as H4 } from './typography/H4';
export { default as H5 } from './typography/H5';
export { default as H6 } from './typography/H6';
export { default as P1 } from './typography/P1';
export { default as P2 } from './typography/P2';
export { default as P3 } from './typography/P3';

// Export new Animated Typography components
export {
  AnimatedH1,
  AnimatedH2,
  AnimatedH3,
  AnimatedH4,
  AnimatedH5,
  AnimatedH6,
  AnimatedP1,
  AnimatedP2,
  AnimatedP3
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
export * from './notifications';