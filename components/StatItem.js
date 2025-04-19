import { useCounter } from '../utils/animationUtils';

/**
 * StatItem component for displaying individual statistics with animation
 * @param {Object} props - Component properties
 * @param {number} props.value - The target value to count to
 * @param {string} props.label - The descriptive text below the number
 * @param {string} props.suffix - Optional suffix to display after the number (e.g., "Y" for years)
 * @param {number} props.delay - Optional delay before animation starts (in ms)
 * @param {number} props.duration - Optional animation duration (in ms)
 */
export default function StatItem({ value, label, suffix = "", delay = 0, duration = 2000 }) {
  const [count, counterRef] = useCounter(value, duration, 0, delay);

  return (
    <div ref={counterRef} className="py-6 text-center">
      <h2 
        className="text-5xl font-bold mb-2"
        style={{
          fontFamily: "'Nunito Sans', 'NunitoSans_10pt-ExtraBold', sans-serif",
          fontSize: "3rem", // Equivalent to text-5xl
          fontWeight: "700",
          lineHeight: "1.2",
          color: "rgb(255, 255, 255)"
        }}
      >
        {count}{suffix}
      </h2>
      <p 
        className="text-gray-300"
        style={{
          fontFamily: "'Roboto', 'Roboto-Regular', sans-serif",
          color: "rgb(209, 213, 219)", // Equivalent to text-gray-300
          fontSize: "1rem",
          lineHeight: "1.5"
        }}
      >
        {label}
      </p>
    </div>
  );
}