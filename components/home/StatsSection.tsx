import Image from 'next/image';
import { SectionTitle, BodyContent, SubContent, Heading3 } from '../';

// Define StatsProps interface directly in the file
interface StatsSectionProps {
  className?: string;
}

export default function StatsSection(props: StatsSectionProps) {
  return (
    <section id="stats" className="section-container bg-gray-50 py-16">
      <div className="section-content text-center">
        <SectionTitle className="text-gray-900">Our Impact</SectionTitle>
        <BodyContent className="text-gray-700 mt-2">Helping real estate professionals maximize their client's sale value.</BodyContent>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
          
          {/* Stat 1 */}
          <div className="flex flex-col items-center">
            <Image src="/assets/icons/pages_home_stats_ic-homemoney.svg" alt="Revenue Icon" width={50} height={50} />
            <Heading3 className="text-4xl font-bold text-gray-900 mt-4">25%</Heading3>
            <SubContent className="text-gray-600">Average value increase rate</SubContent>
          </div>

          {/* Stat 2 */}
          <div className="flex flex-col items-center">
            <Image src="/assets/icons/pages_home_stats_ic-clipboard-tick.svg" alt="Projects Icon" width={50} height={50} />
            <Heading3 className="text-4xl font-bold text-gray-900 mt-4">500+</Heading3>
            <SubContent className="text-gray-600">Renovation projects completed</SubContent>
          </div>

          {/* Stat 3 */}
          <div className="flex flex-col items-center">
            <Image src="/assets/icons/pages_home_stats_ic-chart.svg" alt="Profit Icon" width={50} height={50} />
            <Heading3 className="text-4xl font-bold text-gray-900 mt-4">15%</Heading3>
            <SubContent className="text-gray-600">Average ROI per property</SubContent>
          </div>

        </div>
      </div>
    </section>
  );
}
