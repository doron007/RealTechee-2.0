import { useCounter } from '../../utils/animationUtils';
import StatItem from '../common/ui/StatItem';

// Define StatsProps interface directly in the file
interface StatsProps {
  className?: string;
}

export default function Stats(props: StatsProps) {
  const statsData = [
    {
      value: 985,
      label: "Successful Projects",
      suffix: "",
      delay: 0,
      showPlus: true
    },
    {
      value: 368, // Updated according to Figma design
      label: "Happy Clients",
      suffix: "",
      delay: 200,
      showPlus: true
    },
    {
      value: 15,
      label: "Years of Experience",
      suffix: "Y",
      delay: 400,
      showPlus: true
    }
  ];

  return (
    <section className="section-container bg-black text-white py-8 sm:py-10 md:py-12 lg:py-[50px]">
      <div className="section-content">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 md:gap-10 lg:gap-[30px]">
          {statsData.map((stat, index) => (
            <div key={index} className={`flex justify-center ${
              // Center the middle item on small screens when in 2-column layout
              index === 1 && statsData.length === 3 ? 'sm:col-span-2 md:col-span-1' : ''
            }`}>
              <StatItem
                value={stat.value}
                label={stat.label}
                suffix={stat.suffix}
                delay={stat.delay}
                showPlus={stat.showPlus}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}