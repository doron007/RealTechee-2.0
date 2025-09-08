import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Button from '../buttons/Button';
import P3 from '../../typography/P3';

export interface CookieConsentPreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

const COOKIE_CONSENT_KEY = 'realtechee_cookie_consent';
const CONSENT_VERSION = '1.0';

export const defaultConsentPreferences: CookieConsentPreferences = {
  necessary: true, // Always required
  analytics: false,
  marketing: false,
  preferences: false
};

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user has already given consent
    const savedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (savedConsent) {
      try {
        const parsed = JSON.parse(savedConsent);
        if (parsed.version === CONSENT_VERSION) {
          setHasConsent(true);
          setIsVisible(false);
          return;
        }
      } catch (e) {
        // Invalid stored consent, show banner
      }
    }
    
    // Show consent banner after short delay for better UX
    const timer = setTimeout(() => {
      setHasConsent(false);
      setIsVisible(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleAcceptAll = () => {
    const fullConsent: CookieConsentPreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true
    };
    
    saveConsent(fullConsent);
    setIsVisible(false);
    setHasConsent(true);
  };

  const handleRejectAll = () => {
    const minimalConsent: CookieConsentPreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false
    };
    
    saveConsent(minimalConsent);
    setIsVisible(false);
    setHasConsent(true);
  };

  const saveConsent = (preferences: CookieConsentPreferences) => {
    const consentData = {
      preferences,
      timestamp: new Date().toISOString(),
      version: CONSENT_VERSION
    };
    
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentData));
    
    // Trigger custom event for other components that need to know about consent
    window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { 
      detail: preferences 
    }));
  };

  // Don't render anything if consent already given or not yet determined
  if (!isVisible || hasConsent === null) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-25 z-40 pointer-events-none" />
      
      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Content */}
            <div className="flex-1">
              <div className="flex items-start gap-3">
                {/* Cookie Icon */}
                <div className="flex-shrink-0 mt-1">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-amber-600">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
                  </svg>
                </div>
                
                <div className="flex-1">
                  <P3 className="text-gray-800 mb-2">
                    <strong>We use cookies to improve your experience</strong>
                  </P3>
                  <P3 className="text-gray-600 text-sm leading-relaxed">
                    We use necessary cookies to make our site work. We'd also like to set optional cookies 
                    to help us improve our website and analyze site usage. By clicking "Accept All", 
                    you consent to our use of cookies. You can manage your preferences anytime.{' '}
                    <Link href="/privacy" className="text-primary hover:text-primary-dark underline">
                      Learn more in our Privacy Policy
                    </Link>
                  </P3>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 md:flex-shrink-0">
              <Button
                variant="secondary"
                onClick={handleRejectAll}
                size="sm"
                text="Reject All"
                className="whitespace-nowrap"
              />
              <Button
                variant="primary"
                onClick={handleAcceptAll}
                size="sm"
                text="Accept All"
                className="whitespace-nowrap"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Utility function to check if user has consented to specific cookie type
export const hasConsentFor = (cookieType: keyof CookieConsentPreferences): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    const savedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!savedConsent) return false;
    
    const parsed = JSON.parse(savedConsent);
    return parsed.preferences?.[cookieType] || false;
  } catch (e) {
    return false;
  }
};

// Utility function to get all consent preferences
export const getConsentPreferences = (): CookieConsentPreferences => {
  if (typeof window === 'undefined') return defaultConsentPreferences;
  
  try {
    const savedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!savedConsent) return defaultConsentPreferences;
    
    const parsed = JSON.parse(savedConsent);
    return parsed.preferences || defaultConsentPreferences;
  } catch (e) {
    return defaultConsentPreferences;
  }
};