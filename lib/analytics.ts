import { event } from '../components/analytics/GoogleAnalytics';

export enum AnalyticsEvent {
  // Form Events
  FORM_START = 'form_start',
  FORM_SUBMIT = 'form_submit',
  FORM_ERROR = 'form_error',
  FORM_SUCCESS = 'form_success',
  
  // Navigation Events
  CLICK_CTA = 'click_cta',
  CLICK_MENU = 'click_menu',
  CLICK_SOCIAL = 'click_social',
  
  // Engagement Events
  SCROLL_DEPTH = 'scroll_depth',
  TIME_ON_PAGE = 'time_on_page',
  VIDEO_PLAY = 'video_play',
  
  // Business Events
  LEAD_GENERATED = 'lead_generated',
  ESTIMATE_REQUESTED = 'estimate_requested',
  QUALIFICATION_STARTED = 'qualification_started',
  CONTACT_SUBMITTED = 'contact_submitted',
  AFFILIATE_SIGNUP = 'affiliate_signup',
}

export enum AnalyticsCategory {
  FORMS = 'Forms',
  NAVIGATION = 'Navigation',
  ENGAGEMENT = 'Engagement',
  CONVERSION = 'Conversion',
  USER = 'User',
}

export const trackEvent = (
  eventName: AnalyticsEvent | string,
  category: AnalyticsCategory | string,
  label?: string,
  value?: number
) => {
  try {
    // Google Analytics 4 Event
    event({
      action: eventName,
      category,
      label,
      value,
    });

    // Also push to dataLayer for GTM
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: eventName,
        category,
        label,
        value,
        timestamp: new Date().toISOString(),
      });
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics Event:', {
        event: eventName,
        category,
        label,
        value,
      });
    }
  } catch (error) {
    console.error('Analytics tracking error:', error);
  }
};

export const trackFormSubmission = (formName: string, formData?: Record<string, any>) => {
  trackEvent(
    AnalyticsEvent.FORM_SUBMIT,
    AnalyticsCategory.FORMS,
    formName
  );

  // Track as conversion event
  if (formName === 'get-estimate' || formName === 'get-qualified') {
    trackEvent(
      AnalyticsEvent.LEAD_GENERATED,
      AnalyticsCategory.CONVERSION,
      formName
    );
  }
};

export const trackFormError = (formName: string, errorMessage?: string) => {
  trackEvent(
    AnalyticsEvent.FORM_ERROR,
    AnalyticsCategory.FORMS,
    `${formName}: ${errorMessage || 'Unknown error'}`
  );
};

export const trackCTAClick = (ctaName: string, location: string) => {
  trackEvent(
    AnalyticsEvent.CLICK_CTA,
    AnalyticsCategory.NAVIGATION,
    `${ctaName} - ${location}`
  );
};

export const trackScrollDepth = (percentage: number) => {
  trackEvent(
    AnalyticsEvent.SCROLL_DEPTH,
    AnalyticsCategory.ENGAGEMENT,
    `${percentage}%`,
    percentage
  );
};

export const initializeScrollTracking = () => {
  if (typeof window === 'undefined') return;

  let maxScroll = 0;
  const thresholds = [25, 50, 75, 90, 100];

  const handleScroll = () => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPosition = window.scrollY;
    const scrollPercentage = Math.round((scrollPosition / scrollHeight) * 100);

    thresholds.forEach(threshold => {
      if (scrollPercentage >= threshold && maxScroll < threshold) {
        trackScrollDepth(threshold);
        maxScroll = threshold;
      }
    });
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  
  return () => {
    window.removeEventListener('scroll', handleScroll);
  };
};