/**
 * Reusable form status message components for success/error states
 */

import React from 'react';
import Button from '../common/buttons/Button';
import H2 from '../typography/H2';
import H3 from '../typography/H3';
import P1 from '../typography/P1';

interface FormSuccessMessageProps {
  title: string;
  message: string;
  steps: Array<{
    number: number;
    text: string;
  }>;
  primaryAction?: {
    text: string;
    href?: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    text: string;
    href?: string;
    onClick?: () => void;
  };
  maxWidth?: string;
}

export const FormSuccessMessage: React.FC<FormSuccessMessageProps> = ({
  title,
  message,
  steps,
  primaryAction,
  secondaryAction,
  maxWidth = 'w-[692px]'
}) => {
  return (
    <div className={`${maxWidth} flex flex-col gap-8 text-center`}>
      <div className="flex flex-col items-center gap-6">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Success Message */}
        <div className="space-y-4">
          <H2 className="text-[#22C55E]">{title}</H2>
          <P1 className="max-w-lg mx-auto">
            {message}
          </P1>
        </div>

        {/* Next Steps */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 w-full max-w-md mx-auto">
          <H3 className="text-green-800 mb-3">What happens next?</H3>
          <div className="space-y-2 text-left">
            {steps.map((step) => (
              <div key={step.number} className="flex items-start gap-3">
                <span className="text-green-600 font-bold">{step.number}.</span>
                <span className="text-green-700 text-sm">{step.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        {(primaryAction || secondaryAction) && (
          <div className="flex gap-4">
            {secondaryAction && (
              <Button 
                variant="secondary" 
                onClick={secondaryAction.onClick}
                href={secondaryAction.href}
                size="lg"
              >
                {secondaryAction.text}
              </Button>
            )}
            {primaryAction && (
              <Button 
                variant="primary" 
                onClick={primaryAction.onClick}
                href={primaryAction.href}
                size="lg"
              >
                {primaryAction.text}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface FormErrorMessageProps {
  title?: string;
  message?: string;
  error?: Error | null;
  onRetry?: () => void;
  onContactSupport?: () => void;
  maxWidth?: string;
}

const parseErrorMessage = (error?: Error | null): {
  type: 'auth' | 'network' | 'validation' | 'server' | 'general';
  userMessage: string;
  actions: string[];
} => {
  if (!error) {
    return {
      type: 'general',
      userMessage: 'An unexpected error occurred. Please try again or contact support.',
      actions: ['retry', 'contact']
    };
  }

  const errorMessage = error.message.toLowerCase();
  
  // Authentication errors
  if (errorMessage.includes('federated jwt') || errorMessage.includes('authentication') || errorMessage.includes('unauthorized')) {
    return {
      type: 'auth',
      userMessage: 'Authentication required. Please log in to submit forms or contact us directly.',
      actions: ['login', 'contact']
    };
  }
  
  // Network errors
  if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('timeout') || errorMessage.includes('connection')) {
    return {
      type: 'network',
      userMessage: 'Network connection issue. Please check your internet connection and try again.',
      actions: ['retry', 'contact']
    };
  }
  
  // Validation errors
  if (errorMessage.includes('validation') || errorMessage.includes('required') || errorMessage.includes('invalid')) {
    return {
      type: 'validation',
      userMessage: 'Please check your form fields and ensure all required information is provided correctly.',
      actions: ['retry']
    };
  }
  
  // Server errors
  if (errorMessage.includes('server') || errorMessage.includes('500') || errorMessage.includes('internal')) {
    return {
      type: 'server',
      userMessage: 'Our servers are experiencing issues. Please try again in a few minutes or contact us directly.',
      actions: ['retry', 'contact']
    };
  }
  
  // General fallback
  return {
    type: 'general',
    userMessage: 'Something went wrong with your submission. Please try again or contact us for assistance.',
    actions: ['retry', 'contact']
  };
};

export const FormErrorMessage: React.FC<FormErrorMessageProps> = ({
  title,
  message,
  error,
  onRetry,
  onContactSupport,
  maxWidth = 'w-[692px]'
}) => {
  const errorInfo = parseErrorMessage(error);
  const finalTitle = title || (errorInfo.type === 'auth' ? 'Authentication Required' : 'Submission Failed');
  const finalMessage = message || errorInfo.userMessage;
  
  const handleContactSupport = () => {
    if (onContactSupport) {
      onContactSupport();
    } else {
      // Default contact action - scroll to contact info or open phone dialer
      window.open('tel:+15551234567', '_self');
    }
  };
  
  const handleLogin = () => {
    // Redirect to login or trigger auth flow
    window.location.href = '/login';
  };

  return (
    <div className={`${maxWidth} flex flex-col gap-6`}>
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        {/* Error Icon and Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <H3 className="text-red-800 mb-2">{finalTitle}</H3>
          <P1 className="text-red-700 mb-4">
            {finalMessage}
          </P1>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {errorInfo.actions.includes('retry') && onRetry && (
            <Button 
              variant="primary" 
              onClick={onRetry}
              size="lg"
            >
              Try Again
            </Button>
          )}
          
          {errorInfo.actions.includes('login') && (
            <Button 
              variant="secondary" 
              onClick={handleLogin}
              size="lg"
            >
              Log In
            </Button>
          )}
          
          {errorInfo.actions.includes('contact') && (
            <Button 
              variant="secondary" 
              onClick={handleContactSupport}
              size="lg"
            >
              Contact Support
            </Button>
          )}
        </div>
        
        {/* Support Information */}
        {errorInfo.actions.includes('contact') && (
          <div className="mt-6 pt-4 border-t border-red-200 text-center">
            <P1 className="text-red-600 text-sm mb-2">Need immediate assistance?</P1>
            <div className="flex flex-col sm:flex-row gap-2 justify-center text-sm">
              <a href="tel:+15551234567" className="text-red-700 hover:text-red-800 font-medium">
                📞 Call (555) 123-4567
              </a>
              <span className="hidden sm:inline text-red-400">•</span>
              <a href="mailto:support@realtechee.com" className="text-red-700 hover:text-red-800 font-medium">
                ✉️ support@realtechee.com
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Pre-configured success messages for common form types
export const EstimateSuccessMessage: React.FC<{ onReset: () => void }> = ({ onReset }) => (
  <FormSuccessMessage
    title="Request Submitted Successfully!"
    message="Thank you for your estimate request. Our team at RealTechee will review your submission and connect back with you shortly to discuss your project and schedule the next steps."
    steps={[
      { number: 1, text: "We'll review your project details" },
      { number: 2, text: "Our team will contact you within 24 hours" },
      { number: 3, text: "We'll schedule your consultation or walkthrough" }
    ]}
    primaryAction={{
      text: "Return to Homepage",
      href: "/"
    }}
    secondaryAction={{
      text: "Submit Another Request",
      onClick: onReset
    }}
  />
);

export const InquirySuccessMessage: React.FC<{ onReset: () => void }> = ({ onReset }) => (
  <FormSuccessMessage
    title="Inquiry Submitted Successfully!"
    message="Thank you for contacting us. Our team at RealTechee will review your inquiry and get back to you promptly with the information you need."
    steps={[
      { number: 1, text: "We'll review your inquiry details" },
      { number: 2, text: "Our team will respond within 24 hours" },
      { number: 3, text: "We'll provide the assistance you requested" }
    ]}
    primaryAction={{
      text: "Return to Homepage",
      href: "/"
    }}
    secondaryAction={{
      text: "Submit Another Inquiry",
      onClick: onReset
    }}
  />
);