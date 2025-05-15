import React from 'react';
import { withAnimation } from '../utils/animationUtils';
import { 
  SectionTitle, 
  Subtitle, 
  BodyContent,
  SubContent,
  PageHeader,
  ButtonText,
  CardTitle,
  CardSubtitle,
  CardContent,
  SectionLabel
} from './Typography';

// Create animated versions of our typography components
export const AnimatedPageHeader = withAnimation(PageHeader);
export const AnimatedSectionLabel = withAnimation(SectionLabel);
export const AnimatedSectionTitle = withAnimation(SectionTitle);
export const AnimatedSubtitle = withAnimation(Subtitle);
export const AnimatedBodyContent = withAnimation(BodyContent);
export const AnimatedSubContent = withAnimation(SubContent);
export const AnimatedButtonText = withAnimation(ButtonText);
export const AnimatedCardTitle = withAnimation(CardTitle);
export const AnimatedCardSubtitle = withAnimation(CardSubtitle);
export const AnimatedCardContent = withAnimation(CardContent);