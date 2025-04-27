import React from 'react';
import Image from 'next/image';
import BrandIdentitySection from './BrandIdentitySection';
import ColorTile from '../common/ui/ColorTile';
import StyleGuideButton from '../common/buttons/StyleGuideButton';

export default function BrandGuidelines(props: any) {
  return (
    <div className="bg-white flex justify-start items-start flex-col w-full">
      {/* First Section */}
      <div className="w-full relative bg-white overflow-hidden px-4 py-12 lg:px-12">
        <h1 className="mb-16 text-black text-3xl md:text-5xl font-bold font-inter">Brand Colour</h1>
        
        <div className="flex flex-col justify-start items-start gap-12 w-full">
          {/* Brand Identity - Using the new component */}
          <BrandIdentitySection />
          
          {/* Web Colour Set */}
          <div className="flex flex-col justify-start items-start gap-3 w-full overflow-x-auto">
            <div className="self-stretch inline-flex justify-start items-start gap-2.5">
              <div className="text-neutral-400 text-lg md:text-xl font-normal font-inter">Web colour set</div>
            </div>
            
            <div className="w-full flex flex-col justify-start items-start">
              {/* Primary Colors Row */}
              <div className="self-stretch grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 w-full">
                <ColorTile 
                  bgColor="bg-black" 
                  name="Primary" 
                  colorCode="#000000" 
                />
                <ColorTile 
                  bgColor="bg-white" 
                  name="Secondary · Web background" 
                  colorCode="#FFFFFF" 
                  textColor="text-neutral-900"
                  withBorder={true}
                />
                <ColorTile 
                  bgColor="bg-stone-50" 
                  name="Neutral-light" 
                  colorCode="#D2CAC8" 
                  textColor="text-black"
                />
                <ColorTile 
                  bgColor="bg-neutral-500" 
                  name="Secondary text" 
                  colorCode="#6E6E73" 
                />
                <ColorTile 
                  bgColor="bg-zinc-800" 
                  name="CTA · Text colour" 
                  colorCode="#2A2B2E" 
                />
              </div>
              
              {/* Accent Colors Row */}
              <div className="self-stretch grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 w-full">
                <ColorTile 
                  bgColor="bg-red-600" 
                  name="Accent 1" 
                  colorCode="#D11919" 
                />
                <ColorTile 
                  bgColor="bg-red-500" 
                  name="Accent 2" 
                  colorCode="#E9664A" 
                />
                <ColorTile 
                  bgColor="bg-yellow-500" 
                  name="Accent 3" 
                  colorCode="#FFB900" 
                  textColor="text-neutral-900"
                />
                <ColorTile 
                  bgColor="bg-teal-400" 
                  name="Accent 4" 
                  colorCode="#3BE8B0" 
                  textColor="text-neutral-900"
                />
                <ColorTile 
                  bgColor="bg-sky-700" 
                  name="Accent 5" 
                  colorCode="#17619C" 
                />
              </div>
            </div>
            
            <div className="self-stretch text-right text-neutral-400 text-[10px] md:text-xs font-normal font-inter mt-3">
              *Accent colours can be used to highlight text and content. Using a colour in the same colour shade is allowed.
            </div>
          </div>
          
          {/* Web Colour Use */}
          <div className="w-full flex flex-col justify-start items-start gap-3 overflow-x-auto">
            <div className="text-neutral-400 text-lg md:text-xl font-normal font-inter">Web colour use</div>
            <div className="self-stretch h-auto md:h-80 relative bg-white rounded-md outline outline-1 outline-neutral-200 overflow-hidden w-full">
              <div className="w-full h-44 left-0 top-[38px] absolute bg-white overflow-hidden">
                <div className="absolute left-0 top-0 hidden md:block">
                  <Image 
                    src="/brand-assets/sunflower_pattern_left.png" 
                    alt="Left sunflower pattern" 
                    width={345} 
                    height={176} 
                    className="object-contain"
                  />
                </div>
                
                <div className="absolute right-0 top-0 hidden md:block">
                  <Image 
                    src="/brand-assets/sunflower_pattern_right.png" 
                    alt="Right sunflower pattern" 
                    width={345} 
                    height={176} 
                    className="object-contain"
                  />
                </div>
                
                <div className="left-1/2 transform -translate-x-1/2 md:left-[285px] md:transform-none top-[49px] absolute inline-flex flex-col justify-start items-center gap-4 z-10">
                  <div className="flex flex-col justify-start items-center gap-0.5">
                    <div className="w-32 h-5 text-center">
                      <span className="text-zinc-800 text-base font-bold font-inter">Catch</span>
                      <span className="text-neutral-500 text-base font-bold font-inter">phrase</span>
                    </div>
                    <div className="w-16 h-3 text-center text-zinc-800 text-[8px] font-normal font-inter">Supporting text</div>
                  </div>
                  <div className="px-10 py-1.5 bg-zinc-800 rounded inline-flex justify-start items-start gap-2.5 overflow-hidden">
                    <div className="text-white text-[8px] font-normal font-inter">CTA</div>
                  </div>
                </div>
              </div>
              
              {/* Header example */}
              <div className="w-full left-0 top-0 absolute bg-white shadow-[0px_4px_9px_0px_rgba(0,0,0,0.08)] inline-flex flex-col justify-start items-center z-20">
                <div className="self-stretch bg-white inline-flex justify-start items-center gap-5">
                  <div className="flex-1 px-3 md:px-6 py-2 bg-white rounded-tl-md rounded-tr-md shadow-[0px_4px_4px_0px_rgba(0,0,0,0.03)] flex justify-between items-center">
                    <div className="h-5 flex justify-center items-center gap-2.5 overflow-hidden">
                      <Image 
                        src="/brand-assets/Small logo 118x16.png" 
                        alt="RealTechee Small Logo" 
                        width={118} 
                        height={16} 
                        className="object-contain"
                      />
                    </div>
                    <div className="flex justify-start items-center gap-2 md:gap-5">
                      <div className="flex justify-start items-start gap-2">
                        <div className="w-7 h-3 text-black text-[8px] font-normal font-inter">Menu</div>
                        <div className="w-7 h-3 text-black text-[8px] font-normal font-inter">Menu</div>
                        <div className="w-7 h-3 text-black text-[8px] font-normal font-inter">Menu</div>
                      </div>
                      <div className="px-3 md:px-7 py-1.5 bg-zinc-800 rounded flex justify-start items-start gap-2.5 overflow-hidden">
                        <div className="text-white text-[8px] font-normal font-inter">CTA</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Tabs example */}
              <div className="w-full px-3 md:px-6 pt-6 left-0 top-[209.76px] absolute inline-flex flex-col justify-start items-start gap-2 overflow-hidden">
                <div className="flex flex-col justify-start items-start gap-0.5">
                  <div className="w-10 h-5 text-zinc-800 text-base font-normal font-inter">Title</div>
                  <div className="w-16 h-3 text-zinc-800 text-[8px] font-normal font-inter">Supporting text</div>
                </div>
                <div className="self-stretch grid grid-cols-3 gap-2 w-full">
                  <div className="px-2 md:px-4 py-3.5 bg-stone-100 rounded-tl-md rounded-tr-md flex justify-center items-center gap-2.5 overflow-hidden">
                    <div className="text-neutral-500 text-[8px] font-bold font-inter">TITLE</div>
                  </div>
                  <div className="px-2 md:px-4 py-3.5 bg-stone-100 rounded-tl-md rounded-tr-md flex justify-center items-center gap-2.5 overflow-hidden">
                    <div className="text-neutral-500 text-[8px] font-bold font-inter">TITLE</div>
                  </div>
                  <div className="px-2 md:px-4 py-3.5 bg-stone-100 rounded-tl-md rounded-tr-md flex justify-center items-center gap-2.5 overflow-hidden">
                    <div className="text-neutral-500 text-[8px] font-bold font-inter">TITLE</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Buttons - Using StyleGuideButton components */}
          <div className="flex flex-col justify-start items-start gap-6 w-full">
            <div className="w-full text-black text-4xl font-bold font-inter mb-6">Buttons</div>
            
            <div className="w-full overflow-x-auto">
              <div className="min-w-[640px]">
                {/* Row 1: Headers */}
                <div className="flex w-full mb-8 md:mb-12">
                  <div className="w-24 md:w-36 text-black text-base md:text-xl font-normal font-inter">Status</div>
                  <div className="flex-1 flex justify-between">
                    <div className="w-24 md:w-32 text-center text-neutral-400 text-sm md:text-lg font-normal font-inter">Normal</div>
                    <div className="w-24 md:w-32 text-center text-neutral-400 text-sm md:text-lg font-normal font-inter">Hover</div>
                    <div className="w-24 md:w-32 text-center text-neutral-400 text-sm md:text-lg font-normal font-inter">Pressed</div>
                    <div className="w-24 md:w-32 text-center text-neutral-400 text-sm md:text-lg font-normal font-inter">Disabled</div>
                  </div>
                </div>
                
                {/* Row 2: Primary Buttons */}
                <div className="flex w-full items-center mb-8 md:mb-12">
                  <div className="w-24 md:w-36 text-black text-base md:text-lg font-normal font-inter">Primary</div>
                  <div className="flex-1 flex justify-between">
                    <StyleGuideButton bgColor="bg-zinc-800" />
                    <StyleGuideButton bgColor="bg-black" />
                    <StyleGuideButton bgColor="bg-neutral-600" />
                    <StyleGuideButton bgColor="bg-stone-300" />
                  </div>
                </div>
                
                {/* Row 3: Secondary Buttons */}
                <div className="flex w-full items-center mb-8 md:mb-12">
                  <div className="w-24 md:w-36 text-black text-base md:text-lg font-normal font-inter">Secondary</div>
                  <div className="flex-1 flex justify-between">
                    <StyleGuideButton bgColor="bg-white" textColor="text-zinc-800" border={true} borderColor="border-zinc-800" />
                    <StyleGuideButton bgColor="bg-stone-300" textColor="text-zinc-800" border={true} borderColor="border-zinc-800" />
                    <StyleGuideButton bgColor="bg-black" border={true} borderColor="border-zinc-800" />
                    <StyleGuideButton bgColor="bg-white" textColor="text-stone-300" border={true} borderColor="border-stone-300" />
                  </div>
                </div>
                
                {/* Row 4: Tertiary Buttons */}
                <div className="flex w-full items-center mb-8 md:mb-12">
                  <div className="w-24 md:w-36 text-black text-base md:text-lg font-normal font-inter">Tertiary<br/>In-line link</div>
                  <div className="flex-1 flex justify-between">
                    <div className="flex flex-col items-center">
                      <div className="w-24 md:w-32 px-4 md:px-10 py-2 flex justify-center items-center">
                        <span className="text-center text-black text-base md:text-xl font-normal font-inter">Click</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-24 md:w-32 px-4 md:px-10 py-2 flex justify-center items-center">
                        <span className="text-center text-zinc-800 text-base md:text-xl font-normal font-inter">Click</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-24 md:w-32 px-4 md:px-10 py-2 flex justify-center items-center">
                        <span className="text-center text-neutral-600 text-base md:text-xl font-normal font-inter">Click</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-24 md:w-32 px-4 md:px-10 py-2 flex justify-center items-center">
                        <span className="text-center text-stone-300 text-base md:text-xl font-normal font-inter">Click</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Row 5: Colors */}
                <div className="flex w-full items-center">
                  <div className="w-24 md:w-36 text-black text-base md:text-lg font-normal font-inter">Colours</div>
                  <div className="flex-1 flex justify-between">
                    <StyleGuideButton bgColor="bg-zinc-800" isColorOnly={true} colorLabel="Normal" colorCode="#CE635E" />
                    <StyleGuideButton bgColor="bg-black" isColorOnly={true} colorLabel="Hover" colorCode="#A54F4B" />
                    <StyleGuideButton bgColor="bg-neutral-600" isColorOnly={true} colorLabel="Pressed" colorCode="#7C3B38" />
                    <StyleGuideButton bgColor="bg-stone-300" isColorOnly={true} colorLabel="Disabled" colorCode="#F0CFCD" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Second Section - Typography */}
      <div className="w-full relative bg-white overflow-hidden px-6 py-12">
        <h1 className="mb-16 text-black text-3xl md:text-4xl font-bold font-inter">Typography</h1>
        
        <div className="flex flex-col justify-start items-start gap-12">
          {/* Heading Scales */}
          <div className="inline-flex justify-start items-center gap-2">
            <div className="origin-top-left -rotate-90 text-center text-neutral-400 text-base font-normal font-body">
              Heading
            </div>
            <div className="px-8 border-l-[3px] border-black inline-flex flex-col justify-start items-start gap-6">
              <div className="inline-flex justify-start items-baseline gap-7">
                <div className="text-neutral-400 text-lg font-normal font-body">H1 | 49pt</div>
                <div className="text-black text-5xl font-normal font-heading leading-[3.5rem]">
                  It is impossible to begin to learn that which one thinks one already knows
                </div>
              </div>
              <div className="inline-flex justify-start items-baseline gap-7">
                <div className="text-neutral-400 text-lg font-normal font-body">H2 | 39pt</div>
                <div className="text-black text-4xl font-normal font-heading leading-10">
                  It is impossible to begin to learn that which one thinks one already knows
                </div>
              </div>
              <div className="inline-flex justify-start items-baseline gap-7">
                <div className="text-neutral-400 text-lg font-normal font-body">H3 | 31pt</div>
                <div className="text-black text-3xl font-normal font-heading leading-9">
                  It is impossible to begin to learn that which one thinks one already knows
                </div>
              </div>
              <div className="inline-flex justify-start items-baseline gap-7">
                <div className="text-neutral-400 text-lg font-normal font-body">H4 | 25pt</div>
                <div className="text-black text-2xl font-normal font-heading leading-tight">
                  It is impossible to begin to learn that which one thinks one already knows
                </div>
              </div>
              <div className="inline-flex justify-start items-baseline gap-7">
                <div className="text-neutral-400 text-lg font-normal font-body">H5 | 20pt</div>
                <div className="text-black text-xl font-normal font-heading leading-normal">
                  It is impossible to begin to learn that which one thinks one already knows
                </div>
              </div>
              <div className="inline-flex justify-start items-baseline gap-7">
                <div className="text-neutral-400 text-lg font-normal font-body">H6 | 16pt</div>
              </div>
            </div>
          </div>
          
          {/* Body Scales */}
          <div className="inline-flex justify-start items-center gap-2">
            <div className="origin-top-left -rotate-90 text-center text-neutral-400 text-base font-normal font-body">
              Body
            </div>
            <div className="px-8 border-l-[3px] border-sky-700 inline-flex flex-col justify-start items-start gap-6">
              <div className="inline-flex justify-start items-baseline gap-7">
                <div className="text-neutral-400 text-lg font-normal font-body">P1 | 20pt</div>
                <div className="text-black text-xl font-normal font-body leading-loose">
                  It is impossible to begin to learn that which one thinks one already knows
                </div>
              </div>
              <div className="inline-flex justify-start items-baseline gap-7">
                <div className="text-neutral-400 text-lg font-normal font-body">P2 | 16pt</div>
                <div className="text-black text-base font-normal font-body leading-relaxed">
                  It is impossible to begin to learn that which one thinks one already knows
                </div>
              </div>
              <div className="inline-flex justify-start items-baseline gap-7">
                <div className="text-neutral-400 text-lg font-normal font-body">P3 | 13pt</div>
                <div className="text-black text-xs font-normal font-body leading-tight">
                  It is impossible to begin to learn that which one thinks one already knows
                </div>
              </div>
            </div>
          </div>
          
          {/* Note */}
          <div className="inline-flex justify-start items-center gap-2">
            <div className="origin-top-left -rotate-90 text-center text-neutral-400 text-base font-normal font-body">
              Note
            </div>
            <div className="px-8 border-l-[3px] border-zinc-400 flex justify-start items-start gap-2.5">
              <div className="justify-start">
                <span className="text-black text-xl font-normal font-inter leading-loose">Font weight can change when needed<br/>Leading (line height) for </span>
                <span className="text-black text-xl font-bold font-inter leading-loose">body text</span>
                <span className="text-black text-xl font-normal font-inter leading-loose">: 160% (1.6x) </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Third Section - Moodboard */}
      <div className="w-full max-w-[808px] relative bg-white overflow-hidden px-6 py-12">
        <h1 className="mb-16 text-black text-4xl font-bold font-inter">Moodboard</h1>
        
        {/* Moodboard Images */}
        <div className="w-full h-[513px] mb-16 relative overflow-hidden">
          <div className="w-52 h-64 left-0 top-0 absolute">
            <Image 
              src="/brand-assets/moodboard 206x252.png" 
              alt="Moodboard Image 1" 
              width={206} 
              height={252} 
              className="object-cover"
            />
          </div>
          <div className="w-44 h-64 left-[206px] top-0 absolute">
            <Image 
              src="/brand-assets/moodboard 178x252.png" 
              alt="Moodboard Image 2" 
              width={178} 
              height={252} 
              className="object-cover"
            />
          </div>
          <div className="w-40 h-72 left-[522px] top-[219px] absolute">
            <Image 
              src="/brand-assets/moodboard 166x294.png" 
              alt="Moodboard Image 3" 
              width={166} 
              height={294} 
              className="object-cover"
            />
          </div>
          <div className="w-44 h-64 left-0 top-[252px] absolute">
            <Image 
              src="/brand-assets/moodboard 174x261.png" 
              alt="Moodboard Image 4" 
              width={174} 
              height={261} 
              className="object-cover"
            />
          </div>
          <div className="w-80 h-64 left-[174px] top-[252px] absolute">
            <Image 
              src="/brand-assets/moodboard 348x261.png" 
              alt="Moodboard Image 5" 
              width={348} 
              height={261} 
              className="object-cover"
            />
          </div>
          <div className="w-80 h-64 left-[384px] top-0 absolute">
            <Image 
              src="/brand-assets/moodboard 338x252.png" 
              alt="Moodboard Image 6" 
              width={338} 
              height={252} 
              className="object-cover"
            />
          </div>
        </div>
        
        <h2 className="mb-16 text-black text-4xl font-bold font-inter">Brand Keywords</h2>
        
        {/* Brand Keywords */}
        <div className="flex flex-col justify-center items-center gap-6 mb-16">
          <div className="inline-flex justify-start items-center gap-7">
            <div className="text-center text-black text-3xl font-normal font-inter">Modern</div>
            <div className="w-4 h-5 bg-black"></div>
            <div className="text-center text-black text-3xl font-normal font-inter">Clean</div>
            <div className="w-4 h-5 bg-black"></div>
            <div className="text-center text-black text-3xl font-normal font-inter">Timeless</div>
          </div>
          <div className="inline-flex justify-start items-center gap-7">
            <div className="text-center text-black text-3xl font-normal font-inter">Simplistic</div>
            <div className="w-4 h-5 bg-black"></div>
            <div className="text-center text-black text-3xl font-normal font-inter">Luxury</div>
          </div>
        </div>
        
        <div className="text-right text-black text-xl font-normal font-inter">Created by Mango Digital</div>
      </div>
    </div>
  );
}