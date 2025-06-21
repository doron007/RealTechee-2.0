import React from 'react';
import Image from 'next/image';
import Section from '../common/layout/Section';

export default function ContactMapSection() {
  return (
    <Section 
      backgroundColor="#FCF9F8" 
      spacing="large"
      paddingTop={80}
      paddingBottom={80}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Column: Contact Information */}
        <div className="space-y-4">
          <p className="text-sm font-bold text-accent-2 uppercase tracking-wider">HEAD OFFICE</p>
          <h2 className="text-4xl font-bold text-primary">Los Angeles</h2>
          <p className="text-xl text-primary leading-relaxed">
            10880 Wilshire Blvd., Suite 1101, Los Angeles, California, 90024
          </p>
          
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" fill="#2A2B2E"/>
                </svg>
              </div>
              <span className="text-base text-primary">office@realtechee.com</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6.62 10.79C8.06 13.62 10.38 15.94 13.21 17.38L15.41 15.18C15.69 14.9 16.08 14.82 16.43 14.93C17.55 15.3 18.75 15.5 20 15.5C20.55 15.5 21 15.95 21 16.5V20C21 20.55 20.55 21 20 21C10.61 21 3 13.39 3 4C3 3.45 3.45 3 4 3H7.5C8.05 3 8.5 3.45 8.5 4C8.5 5.25 8.7 6.45 9.07 7.57C9.18 7.92 9.1 8.31 8.82 8.59L6.62 10.79Z" fill="#2A2B2E"/>
                </svg>
              </div>
              <span className="text-base text-primary">(805) 419-3114</span>
            </div>
          </div>
        </div>

        {/* Right Column: Map Image */}
        <div className="relative h-80">
          <Image 
            src="/assets/images/contact-map.png" 
            alt="RealTechee Los Angeles Office Location Map"
            fill
            className="object-cover rounded-lg"
          />
        </div>
      </div>
    </Section>
  );
}