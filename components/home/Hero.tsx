import { 
  PageHeader,
  SectionTitle,
  SubtitlePill, 
  BodyContent,
  ButtonText 
} from '../';
import Button from '../common/buttons/Button';
import Section from '../common/layout/Section';

// Define HeroProps interface directly in the file
interface HeroProps {
  className?: string;
}

export default function Hero(props: HeroProps) {
  return (
    <Section 
      animated
      staggerChildren
      staggerDelay={100}
      withDecorativeElements
      backgroundImage="/assets/images/hero-bg.png"
      mobileBackgroundImage="/assets/images/hero-bg-mobile.png"
      background="none"
      spacing="none"
      className={`${props.className || ''}`}
      constrained={false} // Set to false to match exact Header alignment
      marginTop={0}
      marginBottom={0}
      // Use responsive padding that scales with screen size
      paddingTop={{ default: 50, md: 80, '2xl': 100 }}
      paddingBottom={{ default: 50, md: 80, '2xl': 100 }}
    >
      {/* Hero Content - Use max-width to control text width */}
      <div className="flex flex-col gap-4 md:gap-5 lg:gap-6 xl:gap-8 w-full lg:max-w-[60%]">
        {/* Hero Text */}
        <div className="flex flex-col gap-2 sm:gap-3 md:gap-4">
          {/* Hero Pill - Wrapped in div with width fit-content to match text width only */}
          <div className="w-fit">
            <SubtitlePill>
              Meet RealTechee, Your Home Preparation Partner
            </SubtitlePill>
          </div>
          
          {/* Hero Title */}
          <SectionTitle>Close More Deals Faster by Maximizing Your Client's Sale Value & Minimizing Buying Cost</SectionTitle>
        </div>
        
        {/* Hero Details */}
        <BodyContent>
          Supercharge your agents' success with a proven real estate home preparation platform. Attract the right customers, dominate the market, and achieve outstanding results effortlessly.
        </BodyContent>
        
        {/* Hero Buttons */}
        <div className="flex flex-wrap gap-3 sm:gap-4 pt-3 sm:pt-4 md:pt-6">
          <Button
            variant="primary"
            href="/learn-more"
            withIcon={true}
            iconPosition="left"
          >
            <ButtonText>Learn More</ButtonText>
          </Button>
          <Button
            variant="tertiary"
            href="/get-in-touch"
            text="Get in touch"
            underline={true}
          />
        </div>
      </div>
    </Section>
  );
}