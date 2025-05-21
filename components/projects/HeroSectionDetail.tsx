import React from 'react';

interface HeroSectionDetailProps {
  title: string;
}

export default function HeroSectionDetail({ title }: HeroSectionDetailProps) {
  return (
    <section className="bg-gradient-to-r from-primary to-primary-dark text-white py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{title}</h1>
          <p className="text-lg opacity-90">
            Explore the details of this project and see how we delivered exceptional results
          </p>
        </div>
      </div>
    </section>
  );
}