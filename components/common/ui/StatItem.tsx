import { useCounter } from '../../../utils/animationUtils';
import H2 from '../../typography/H2';
import P2 from '../../typography/P2';
import P3 from '../../typography/P3';
import { twMerge } from 'tailwind-merge';

// Define StatItemProps interface directly in the file
interface StatItemProps {
  value: number;
  label: string;
  suffix?: string;
  delay?: number;
  duration?: number;
  showPlus?: boolean;
}

/**
 * StatItem component for displaying individual statistics with animation
 * @param {Object} props - Component properties
 * @param {number} props.value - The target value to count to
 * @param {string} props.label - The descriptive text below the number
 * @param {string} props.suffix - Optional suffix to display after the number (e.g., "Y" for years)
 * @param {number} props.delay - Optional delay before animation starts (in ms)
 * @param {number} props.duration - Optional animation duration (in ms)
 * @param {boolean} props.showPlus - Whether to show a plus symbol after the number
 */
export default function StatItem({ 
  value, 
  label, 
  suffix = "", 
  delay = 0, 
  duration = 2000,
  showPlus = true 
}: StatItemProps) {
  // The counter will now reset and animate each time the component enters the viewport
  const [count, counterRef] = useCounter(value, duration, 0, delay);

  return (
    <div ref={counterRef} className="text-center">
      <div className="flex justify-center items-start mb-1 sm:mb-1.5 md:mb-2">
        <H2 className="text-white font-extrabold">
          {count}{suffix}
        </H2>
        {showPlus && (
          <P3 className="text-[#F8E9E6] font-bold mt-1">+</P3>
        )}
      </div>
      <P2 className="text-[#F8E9E6] text-center font-bold">
        {label}
      </P2>
    </div>
  );
}