import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import { I18n } from 'aws-amplify/utils';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { createLogger } from '../utils/logger';

const logger = createLogger('LoginPage');

// Configure I18n labels for form fields
I18n.putVocabulariesForLanguage('en', {
  'Given Name': 'First Name',
  'Family Name': 'Last Name',
});

const LoginPage = () => {
  const router = useRouter();
  const { user } = useAuthenticator((context) => [context.user]);
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting to prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if already authenticated - must be before early return
  useEffect(() => {
    if (user && router.isReady) {
      const redirectTo = (router.query.redirect as string) || '/';
      const action = router.query.action as string;

      if (action && redirectTo !== '/') {
        // Add action parameter to redirect URL to trigger the desired action
        const separator = redirectTo.includes('?') ? '&' : '?';
        router.push(`${redirectTo}${separator}action=${encodeURIComponent(action)}`);
      } else {
        router.push(redirectTo);
      }
    }
  }, [user, router.isReady, router.query, router]);

  // Wait for router to be ready and component to be mounted
  if (!router.isReady || !mounted) {
    return (
      <>
        <Head>
          <title>Login | RealTechee - Home Preparation Partner</title>
          <meta name="description" content="Sign in to your RealTechee account to access exclusive features and manage your projects." />
        </Head>
        <div className="min-h-screen bg-off-white flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl">
            <div className="flex justify-center">
              <Link href="/" className="flex items-center">
                <div className="border border-very-light-gray p-3 rounded-lg bg-white shadow-sm">
                  <Image
                    src="/assets/logos/web_realtechee_horizontal_no_border.png"
                    alt="RealTechee Logo"
                    width={240}
                    height={48}
                    className="h-10 sm:h-12 w-auto"
                    priority
                  />
                </div>
              </Link>
            </div>
            <div className="mt-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-teal mx-auto"></div>
              <p className="mt-4 text-sm text-medium-gray">Loading...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  const { signup } = router.query;
  // Ensure consistent behavior between server and client
  const isSignUp = router.isReady && signup === 'true';

  // Debug: log the values to verify they're correct
  logger.debug('Router query parameters', router.query);
  logger.debug('Signup parameter value', {
    signup,
    signupType: typeof signup,
    signupString: String(signup),
    signupBoolean: !!signup,
    isSignUp
  });
  logger.debug('Authenticator configuration', {
    initialState: isSignUp ? 'signUp' : 'signIn',
    key: isSignUp ? 'signup' : 'signin',
    hasSignupParam: !!signup,
    signupTruthy: signup === 'true'
  });

  return (
    <>
      <Head>
        <title>Login | RealTechee - Home Preparation Partner</title>
        <meta name="description" content="Sign in to your RealTechee account to access exclusive features and manage your projects." />
      </Head>

      <div className="min-h-screen bg-off-white flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl">
          {/* Logo */}
          <div className="flex justify-center">
            <Link href="/" className="flex items-center">
              <div className="border border-very-light-gray p-3 rounded-lg bg-white shadow-sm">
                <Image
                  src="/assets/logos/web_realtechee_horizontal_no_border.png"
                  alt="RealTechee Logo"
                  width={240}
                  height={48}
                  className="h-10 sm:h-12 w-auto"
                  priority
                />
              </div>
            </Link>
          </div>

          <h2 className="mt-6 sm:mt-8 text-center text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-dark-gray">
            Welcome Back
          </h2>
          <p className="mt-2 sm:mt-3 text-center text-base sm:text-lg font-body text-medium-gray leading-relaxed px-4">
            Sign in to access your projects and connect with our community
          </p>
          <p className="mt-2 text-center text-sm font-body text-light-gray">
            New here?{' '}
            <Link href="/" className="font-medium text-accent-coral hover:text-btn-hover transition-colors">
              Explore RealTechee
            </Link>
          </p>
        </div>

        <div className="mt-8 sm:mt-10 mx-auto w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl">
          <div className="bg-white py-8 sm:py-10 px-4 sm:px-6 md:px-8 lg:px-10 shadow-card rounded-2xl border border-very-light-gray">

            <Authenticator
              key={isSignUp ? 'signup' : 'signin'} // Force remount when signup parameter changes
              socialProviders={[]}
              initialState={isSignUp ? 'signUp' : 'signIn'}
              signUpAttributes={['given_name', 'family_name']}
              components={{
                Header() {
                  return null; // Hide default header since we have our own
                },
                Footer() {
                  return (
                    <div className="mt-8">
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-very-light-gray" />
                        </div>
                        <div className="relative flex justify-center text-responsive-sm">
                          <span className="px-4 bg-white text-light-gray font-body">
                            Need assistance?
                          </span>
                        </div>
                      </div>
                      <div className="mt-6 text-center">
                        <Link
                          href="/contact"
                          className="text-responsive-sm font-body text-accent-coral hover:text-btn-hover transition-colors font-medium"
                        >
                          Contact our support team
                        </Link>
                      </div>
                    </div>
                  );
                },
              }}
            />
          </div>
        </div>

        {/* Additional Info Section */}
        <div className="mt-6 sm:mt-8 mx-auto w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl">
          <div className="bg-gradient-to-r from-accent-teal/5 to-accent-blue/5 border border-accent-teal/20 rounded-2xl p-4 sm:p-6 shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <Image
                  src="/assets/icons/info.svg"
                  alt="Info"
                  width={24}
                  height={24}
                  className="h-5 w-5 sm:h-6 sm:w-6 text-accent-teal"
                />
              </div>
              <div className="ml-3 sm:ml-4">
                <h3 className="text-sm sm:text-base font-heading font-semibold text-dark-gray">
                  New to RealTechee?
                </h3>
                <div className="mt-1 sm:mt-2 text-xs sm:text-sm font-body text-medium-gray leading-relaxed">
                  <p>
                    Join our community to access exclusive project insights, connect with industry experts, and share your home preparation journey.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Migrated Users Notice */}
        <div className="mt-4 mx-auto w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl">
          <div className="bg-gradient-to-r from-accent-yellow/5 to-accent-coral/5 border border-accent-yellow/20 rounded-2xl p-4 sm:p-6 shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <Image
                  src="/assets/icons/warning.svg"
                  alt="Returning User"
                  width={24}
                  height={24}
                  className="h-5 w-5 sm:h-6 sm:w-6 text-accent-coral"
                />
              </div>
              <div className="ml-3 sm:ml-4">
                <h3 className="text-sm sm:text-base font-heading font-semibold text-dark-gray">
                  Returning User?
                </h3>
                <div className="mt-1 sm:mt-2 text-xs sm:text-sm font-body text-medium-gray leading-relaxed">
                  <p>
                    Welcome back! Use <span className="font-medium text-accent-coral">"Forgot Password"</span> to securely reset your credentials and continue where you left off.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Use a custom layout that doesn't include the header/footer
LoginPage.getLayout = (page: React.ReactElement) => {
  return page;
};

export default LoginPage;