import Link from 'next/link';

export default function CtaSection() {
  return (
    <section className="py-16 bg-gray-900 relative overflow-hidden">
      {/* Background pattern overlay */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="diagonalPatternCta" patternUnits="userSpaceOnUse" width="100" height="100">
              <path d="M0 0L100 100Z" stroke="white" strokeWidth="2" fill="none" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#diagonalPatternCta)" />
        </svg>
      </div>
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
          Ready to win more listings or<br />open escrow with buyers faster?
        </h2>
        <p className="text-lg text-gray-300 mb-8">Get a Renovation Estimate Today</p>
        <Link
          href="/get-estimate"
          className="inline-block px-8 py-3 bg-white text-gray-900 rounded-md font-medium hover:bg-gray-100 transition-colors"
        >
          Get an Estimate
        </Link>
      </div>
    </section>
  );
}