import Image from 'next/image';
import Link from 'next/link';
import { FeaturesProps } from '@types/components/home';

// Feature card component
const FeatureCard = ({ icon, title, description, highlight = false }) => {
  return (
    <div className={`p-6 rounded-lg ${highlight ? 'bg-red-50 border border-red-100' : ''}`}>
      <div className="flex items-start mb-4">
        <div className="flex-shrink-0 mr-3">
          <Image 
            src={icon} 
            alt={title} 
            width={24} 
            height={24}
          />
        </div>
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
      </div>
      <p className="text-gray-700 text-sm">{description}</p>
    </div>
  );
};

export default function Features(props: FeaturesProps) {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <p className="text-sm font-medium text-[#FF5F45] uppercase tracking-wider mb-2">FEATURES</p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Powerful Features to<br />Win More Deals</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            {/* Feature 1 */}
            <FeatureCard
              icon="/icons/overview-icon.svg"
              title="Project Overview at a Glance"
              description="Effortlessly keep track of all your client projects, both completed and ongoing. Get a comprehensive overview of the projects' statuses, ensuring you stay organized and informed throughout the entire project lifecycle."
            />
            
            {/* Feature 2 */}
            <FeatureCard
              icon="/icons/scope-icon.svg"
              title="Detailed Project Scope"
              description="Gain access to detailed project scopes that include descriptions, property details, and transparent price breakdowns. Empowering you and your client with the necessary information to make informed decisions and effectively manage your projects."
            />
            
            {/* Feature 3 */}
            <FeatureCard
              icon="/icons/updates-icon.svg"
              title="Real-Time Project Updates with Photo Interaction"
              description="Your clients stay connected and engaged with their projects through real-time updates accompanied by photos. Comment on updates, ask questions, and receive prompt responses from the experts working on your projects. Enjoy seamless communication and enhance collaboration to ensure the projects meet and exceed their expectations"
              highlight={true}
            />
            
            <div className="mt-8">
              <Link
                href="/learn-more"
                className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-md font-medium hover:bg-gray-800 transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>
          
          {/* Right side image */}
          <div className="relative">
            <Image
              src="/images/project-dashboard.png"
              alt="Project dashboard interface"
              width={600}
              height={500}
              className="rounded-lg shadow-lg"
            />
          </div>
        </div>
      </div>
    </section>
  );
}