import React from 'react';
import { HeroSection, ProjectsGridSection } from '../components/projects';
import Head from 'next/head';
import type { NextPage } from 'next';

const ProjectsPage: NextPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>Projects | RealTechee</title>
        <meta name="description" content="Explore impeccable renovations completed by RealTechee." />
        <link rel="icon" href="/favicon.ico" />
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
