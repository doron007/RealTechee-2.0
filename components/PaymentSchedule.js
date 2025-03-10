import Image from 'next/image';

export default function PaymentSchedule() {
  return (
    <section id="payment-schedule" className="bg-gray-50 py-16 px-6 md:px-12 text-center">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900">Payment Schedule</h2>
        <p className="text-lg text-gray-700 mt-2">
          Track your project payments and milestones with complete transparency.
        </p>

        {/* Payment Schedule Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">

          {/* Payment Example 1 */}
          <div className="relative">
            <Image 
              src="/MD - Home/Screen Recording 2023-06-16 at 9.49.48 AM 1.png" 
              alt="Living Room Renovation Payment" 
              width={600} 
              height={400} 
              className="rounded-lg shadow-md"
            />
            <div className="absolute bottom-4 left-4 bg-white shadow-lg p-3 rounded-lg">
              <Image 
                src="/MD - Home/Frame 427321849.png" 
                alt="Payment schedule icon" 
                width={300} 
                height={200} 
              />
            </div>
          </div>

          {/* Payment Example 2 */}
          <div className="relative">
            <Image 
              src="/MD - Home/Screen Recording 2023-06-20 at 3.11.33 PM 1.png" 
              alt="Luxury Home Payment Schedule" 
              width={600} 
              height={400} 
              className="rounded-lg shadow-md"
            />
            <div className="absolute bottom-4 left-4 bg-white shadow-lg p-3 rounded-lg">
              <Image 
                src="/MD - Home/detailed project scope.png" 
                alt="Detailed payment breakdown" 
                width={300} 
                height={200} 
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
