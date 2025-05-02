import { useCounter } from '../../../utils/animationUtils';

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
  const [count, counterRef] = useCounter(value, duration, 0, delay);

  return (
    <div ref={counterRef} className="text-center">
      <div className="flex justify-center items-start mb-1 sm:mb-1.5 md:mb-2">
        <span className="font-heading font-extrabold text-3xl sm:text-4xl md:text-4xl lg:text-5xl text-white">{count}{suffix}</span>
        {showPlus && <span className="text-[14px] sm:text-[16px] md:text-[18px] font-bold text-[#F8E9E6]">+</span>}
      </div>
      <p className="text-[#F8E9E6] font-body font-extrabold text-base sm:text-lg md:text-xl text-center leading-relaxed">
        {label}
      </p>
    </div>
  );
}