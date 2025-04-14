import { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';

// Counter animation hook
const useCounter = (end, duration = 2000, start = 0, delay = 0) => {
  const [count, setCount] = useState(start);
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  useEffect(() => {
    if (!inView) return;

    let startTime;
    let animationFrame;
    
    const startAnimation = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsedTime = timestamp - startTime;
      
      if (elapsedTime > delay) {
        const progress = Math.min((elapsedTime - delay) / duration, 1);
        setCount(Math.floor(progress * (end - start) + start));
      }
      
      if (elapsedTime < duration + delay) {
        animationFrame = requestAnimationFrame(startAnimation);
      } else {
        setCount(end);
      }
    };
    
    animationFrame = requestAnimationFrame(startAnimation);
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [inView, end, duration, start, delay]);

  return [count, ref];
};

export default function Stats() {
  const [projectsCount, projectsRef] = useCounter(985);
  const [clientsCount, clientsRef] = useCounter(2462, 2500);
  const [yearsCount, yearsRef] = useCounter(15, 1500);

  return (
    <section className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {/* Projects Counter */}
          <div ref={projectsRef} className="py-6">
            <h2 className="text-5xl font-bold mb-2">{projectsCount}</h2>
            <p className="text-gray-300">Successful Projects</p>
          </div>
          
          {/* Clients Counter */}
          <div ref={clientsRef} className="py-6">
            <h2 className="text-5xl font-bold mb-2">{clientsCount}</h2>
            <p className="text-gray-300">Happy Clients</p>
          </div>
          
          {/* Years Counter */}
          <div ref={yearsRef} className="py-6">
            <h2 className="text-5xl font-bold mb-2">{yearsCount}Y</h2>
            <p className="text-gray-300">Years of Experience</p>
          </div>
        </div>
      </div>
    </section>
  );
}