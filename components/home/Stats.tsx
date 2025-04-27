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
      delay: 0
    },
    {
      value: 2462,
      label: "Happy Clients",
      suffix: "",
      delay: 200
    },
    {
      value: 15,
      label: "Years of Experience",
      suffix: "Y",
      delay: 400
    }
  ];

  return (
    <section 
      className="bg-black text-white w-full" 
      style={{ 
        height: "200px",
        maxHeight: "200px",
        display: "grid",
        alignSelf: "stretch",
        justifySelf: "stretch",
        gridArea: "3/1/4/2",
        position: "relative"
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full w-full">
        <div className="h-full w-full grid grid-cols-3 items-center">
          {/* Left stat */}
          <div className="flex justify-start">
            <StatItem
              value={statsData[0].value}
              label={statsData[0].label}
              suffix={statsData[0].suffix}
              delay={statsData[0].delay}
            />
          </div>
          
          {/* Middle stat */}
          <div className="flex justify-center">
            <StatItem
              value={statsData[1].value}
              label={statsData[1].label}
              suffix={statsData[1].suffix}
              delay={statsData[1].delay}
            />
          </div>
          
          {/* Right stat */}
          <div className="flex justify-end">
            <StatItem
              value={statsData[2].value}
              label={statsData[2].label}
              suffix={statsData[2].suffix}
              delay={statsData[2].delay}
            />
          </div>
        </div>
      </div>
    </section>
  );
}