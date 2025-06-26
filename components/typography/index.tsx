// Typography Components with CSS Clamp for Responsive Scaling
// Use H1-H6 for semantic hierarchy, P1-P3 for body text importance

// Heading Components
export { H1 } from './H1';
export { H2 } from './H2';
export { H3 } from './H3';
export { H4 } from './H4';
export { H5 } from './H5';
export { H6 } from './H6';

// Body Text Components
export { P1 } from './P1';
export { P2 } from './P2';
export { P3 } from './P3';

// Typography Scale Reference:
// H1: clamp(2rem,4vw,3rem)         32px → 48px (Page titles)
// H2: clamp(1.5rem,3vw,2.5rem)     24px → 40px (Section headings)
// H3: clamp(1.25rem,2.5vw,2rem)    20px → 32px (Subsection titles)
// H4: clamp(1.125rem,2vw,1.75rem)  18px → 28px (Card titles)
// H5: clamp(1rem,1.5vw,1.5rem)     16px → 24px (Small headings)
// H6: clamp(0.875rem,1vw,1.25rem)  14px → 20px (Captions/labels)
// P1: clamp(1rem,1.5vw,1.25rem)    16px → 20px (Important body text)
// P2: clamp(0.875rem,1vw,1rem)     14px → 16px (Regular body text)
// P3: clamp(0.75rem,0.5vw,0.875rem) 12px → 14px (Small text/captions)

// Usage Examples:
// <H1>Page Title</H1>
// <H2>Section Heading</H2>
// <H3>Card Title</H3>
// <P1>Important description text</P1>
// <P2>Regular paragraph content</P2>
// <P3>Small text or captions</P3>