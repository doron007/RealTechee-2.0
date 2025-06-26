import { useIntersectionObserver, withAnimation } from '../../utils/animationUtils';
import { VideoPlayer } from '../common/ui';
import { Section, ContainerTwoColumns, ContentWrapper } from '../common/layout';
import P1 from '../typography/P1';

// Create animated version of P1 for this component
const AnimatedP1 = withAnimation(P1);

// Define TestimonialsProps interface directly in the file
interface TestimonialsProps {
  className?: string;
}

export default function Testimonials({ className = '' }: TestimonialsProps) {
  // Use our custom hook for animation
  const { ref, isVisible } = useIntersectionObserver();

  return (
    <Section 
      id="testimonials"
      className="testimonials-section"
      background="light" 
      spacing="large"
    >
      <div ref={ref}>
        <ContainerTwoColumns
          videoSide="left"
          gap="figma"
          breakpoint="lg"
          verticalAlign="center"
          leftContent={
            <VideoPlayer 
              posterSrc="/videos/realtechee_testimonial_image.png"
              videoSrc="/videos/realtechee_testimonial.mp4"
              alt="Client testimonial"
              rounded={false}
              shadow={false}
              animate={true}
              animationType="fadeIn"
              animationDelay="delay200"
              isVisible={isVisible}
            />
          }
          rightContent={
            <ContentWrapper 
              verticalAlign="center"
              textAlign="left"
              maxWidth="90%"
            >
              <AnimatedP1 
                animate={isVisible}
                animationType="slideInUp" 
                animationDelay="delay300"
                className="text-center"
              >
                We helped 368 clients to improve their living space and increase value to their properties. Here is how we help our clients.
              </AnimatedP1>
            </ContentWrapper>
          }
        />
      </div>
    </Section>
  );
}