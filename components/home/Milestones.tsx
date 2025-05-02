// filepath: /Users/doron/Projects/RealTechee 2.0/components/home/Milestones.tsx
import Image from 'next/image';

export default function Milestones(props: any) {
  return (
    <section id="milestones" className="section-container bg-white py-16">
      <div className="section-content text-center">
        <h2 className="text-3xl font-bold text-gray-900">Project Milestones</h2>
        <p className="text-lg text-gray-700 mt-2">
          Track the key phases of your project, from start to completion.
        </p>

        {/* Milestone Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">

          {/* Milestone Example 1 */}
          <div className="relative">
            <Image 
              src="/assets/images/pages_home_milestones_Real-time project updates.png" 
              alt="Project progress" 
              width={600} 
              height={400} 
              className="rounded-lg shadow-md"
            />
            <div className="absolute bottom-4 left-4 bg-white shadow-lg p-3 rounded-lg">
              <Image 
                src="/assets/images/pages_home_milestones_features.png" 
                alt="Project timeline" 
                width={300} 
                height={200} 
              />
            </div>
          </div>

          {/* Milestone Example 2 */}
          <div className="relative">
            <Image 
              src="/assets/images/pages_home_milestones_features-2.png" 
              alt="Detailed scope" 
              width={600} 
              height={400} 
              className="rounded-lg shadow-md"
            />
            <div className="absolute bottom-4 left-4 bg-white shadow-lg p-3 rounded-lg">
              <Image 
                src="/assets/images/pages_home_milestones_arrow-right.svg" 
                alt="Next milestone" 
                width={50} 
                height={50} 
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}