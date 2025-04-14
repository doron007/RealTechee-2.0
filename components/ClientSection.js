import Image from 'next/image';

export default function ClientSection() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-sm font-medium text-[#FF5F45] uppercase tracking-wider mb-2">ABOUT US</p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Empowering Agents, Maximizing Performance</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* For Sellers */}
          <div className="bg-gray-50 p-8 rounded-lg flex flex-col h-full">
            <h3 className="text-2xl font-bold text-[#FF5F45] mb-4">For Sellers</h3>
            <p className="text-gray-700">
              We offer your homeowner clients $0 out-of-pocket construction costs until the close of escrow, payment is made with the escrow proceeds. Eliminating deal withdrawals and price concessions for sellers due to inspection findings.
            </p>
          </div>
          
          {/* Sellers Image */}
          <div className="relative h-72 md:h-auto overflow-hidden rounded-lg">
            <Image
              src="/images/modern-interior.jpg"
              alt="Modern interior design"
              fill
              className="object-cover"
            />
          </div>
          
          {/* Buyers Image */}
          <div className="relative h-72 md:h-auto overflow-hidden rounded-lg md:order-3 order-4">
            <Image
              src="/images/home-renovation.jpg"
              alt="Home renovation project"
              fill
              className="object-cover"
            />
          </div>
          
          {/* For Buyers */}
          <div className="bg-gray-50 p-8 rounded-lg flex flex-col h-full md:order-4 order-3">
            <h3 className="text-2xl font-bold text-[#FF5F45] mb-4">For Buyers</h3>
            <p className="text-gray-700">
              We provide your home-buying clients with post-buy quotes, cost analysis, and project scope for informed decision-making when purchasing a new home. Efficient financial allocations and world-class virtual contractors ensure on-time & on-budget delivery of buyer's goals.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}