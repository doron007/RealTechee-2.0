import { useCounter } from '../../utils/animationUtils';
import StatItem from '../common/ui/StatItem';
import Section from '../common/layout/Section';
import ContainerThreeColumns from '../common/layout/ContainerThreeColumns';

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
      showPlus: true
    },
    {
      value: 368, // Updated according to Figma design
      label: "Happy Clients",
      suffix: "",
      showPlus: true
    },
    {
      value: 15,
      label: "Years of Experience",
      suffix: "Y",
      showPlus: true
    }
  ];

  // Create content for each column - simplified since horizontalAlign handles centering
  const leftColumn = (
    <StatItem
      value={statsData[0].value}
      label={statsData[0].label}
      suffix={statsData[0].suffix}
      showPlus={statsData[0].showPlus}
    />
  );

  const middleColumn = (
    <StatItem
      value={statsData[1].value}
      label={statsData[1].label}
      suffix={statsData[1].suffix}
      showPlus={statsData[1].showPlus}
    />
  );

  const rightColumn = (
    <StatItem
      value={statsData[2].value}
      label={statsData[2].label}
      suffix={statsData[2].suffix}
      showPlus={statsData[2].showPlus}
    />
  );

  return (
    <Section
      background="black"
      textColor="white"
      className={props.className || ''}
      constrained={false} // Set to false to make background extend full width
      animated
      staggerChildren
      staggerDelay={200}
      id="stats"
    >
      {/* Content container to maintain proper width for the content */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <ContainerThreeColumns
          leftContent={leftColumn}
          middleContent={middleColumn}
          rightContent={rightColumn}
          gap="medium"
          breakpoint="md"
          verticalAlign="center"
          horizontalAlign="center" // Using the new horizontalAlign prop
        />
      </div>
    </Section>
  );
}