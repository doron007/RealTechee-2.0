import Image from 'next/image';

// Define StatsProps interface directly in the file
interface StatsSectionProps {
  className?: string;
}

export default function StatsSection(props: StatsSectionProps) {
  return (
    <section id="stats" className="bg-gray-50 py-16 px-6 md:px-12 text-center">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900">Our Impact</h2>
        <p className="text-lg text-gray-700 mt-2">Helping real estate professionals maximize their client's sale value.</p>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
          
          {/* Stat 1 */}
          <div className="flex flex-col items-center">
            <Image src="/MD - Home/ic-homemoney.svg" alt="Revenue Icon" width={50} height={50} />
            <h3 className="text-4xl font-bold text-gray-900 mt-4">25%</h3>
            <p className="text-gray-600">Average value increase rate</p>
          </div>

          {/* Stat 2 */}
          <div className="flex flex-col items-center">
            <Image src="/MD - Home/ic-clipboard-tick.svg" alt="Projects Icon" width={50} height={50} />
            <h3 className="text-4xl font-bold text-gray-900 mt-4">500+</h3>
            <p className="text-gray-600">Renovation projects completed</p>
          </div>

          {/* Stat 3 */}
          <div className="flex flex-col items-center">
            <Image src="/MD - Home/ic-chart.svg" alt="Profit Icon" width={50} height={50} />
            <h3 className="text-4xl font-bold text-gray-900 mt-4">15%</h3>
            <p className="text-gray-600">Average ROI per property</p>
          </div>

        </div>
      </div>
    </section>
  );
}
