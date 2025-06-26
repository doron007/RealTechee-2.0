import React from 'react';
import { withAnimation } from '../utils/animationUtils';
import H1 from './typography/H1';
import H2 from './typography/H2';
import H3 from './typography/H3';
import H4 from './typography/H4';
import H5 from './typography/H5';
import H6 from './typography/H6';
import P1 from './typography/P1';
import P2 from './typography/P2';
import P3 from './typography/P3';

// Create animated versions of our new semantic typography components
export const AnimatedH1 = withAnimation(H1);
export const AnimatedH2 = withAnimation(H2);
export const AnimatedH3 = withAnimation(H3);
export const AnimatedH4 = withAnimation(H4);
export const AnimatedH5 = withAnimation(H5);
export const AnimatedH6 = withAnimation(H6);
export const AnimatedP1 = withAnimation(P1);
export const AnimatedP2 = withAnimation(P2);
export const AnimatedP3 = withAnimation(P3);