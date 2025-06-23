import React from 'react';
import Head from 'next/head';
import type { NextPage } from 'next';
import { 
  HeroSection, 
  ProjectsGridSection 
} from '../components/projects';

const ProjectsPage: NextPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>Projects | RealTechee</title>
        <meta name="description" content="Explore impeccable renovations completed by RealTechee." />
        <link rel="icon" href="/favicon_white.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="flex-grow">
        <HeroSection />
        <ProjectsGridSection />
      </main>
    </div>
  );
};

export default ProjectsPage;
