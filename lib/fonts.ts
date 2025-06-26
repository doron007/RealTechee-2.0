import localFont from 'next/font/local';
import { Inter } from 'next/font/google';

// Nunito Sans - Local font (self-hosted for best performance)
export const nunitoSans = localFont({
  src: [
    {
      path: '../public/assets/fonts/NunitoSans_10pt-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/assets/fonts/NunitoSans_10pt-Medium.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/assets/fonts/NunitoSans_10pt-SemiBold.ttf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../public/assets/fonts/NunitoSans_10pt-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../public/assets/fonts/NunitoSans_10pt-ExtraBold.ttf',
      weight: '800',
      style: 'normal',
    },
  ],
  variable: '--font-heading',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
});

// Roboto - Local font (self-hosted for best performance)
export const roboto = localFont({
  src: [
    {
      path: '../public/assets/fonts/Roboto-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/assets/fonts/Roboto-Medium.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/assets/fonts/Roboto-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-body',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
});

// Inter - Google Font (optimized self-hosting by Next.js)
export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
});

// Export font class names for use in components
export const fontClasses = {
  heading: nunitoSans.variable,
  body: roboto.variable,
  inter: inter.variable,
} as const;

// Combined class string for easy application
export const allFonts = `${nunitoSans.variable} ${roboto.variable} ${inter.variable}`;