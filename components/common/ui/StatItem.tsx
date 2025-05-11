import { useCounter } from '../../../utils/animationUtils';
import { SectionTitle, BodyContent } from '../../ResponsiveTypography';
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
        <SectionTitle 
          as="span" 
          className="text-white font-extrabold text-3xl sm:text-4xl md:text-4xl lg:text-5xl"
        >
          {count}{suffix}
        </SectionTitle>
        {showPlus && (
          <span className="text-[14px] sm:text-[16px] md:text-[18px] font-bold text-[#F8E9E6] mt-1">+</span>
        )}
      </div>
      <BodyContent 
        as="p" 
        className={twMerge(
          "text-[#F8E9E6]",
          // "font-extrabold", 
          "text-center"
        )}
      >
        {label}
      </BodyContent>
    </div>
  );
}