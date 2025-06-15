import Head from 'next/head';
import GraphQLDebugger from '../components/GraphQLDebugger';
import AmplifyTestClient from '../components/AmplifyTestClient';

export default function DebugPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>GraphQL Debug - RealTechee</title>
        <meta name="description" content="Debug GraphQL queries and data issues" />
      </Head>
      
      <main>
        <GraphQLDebugger />
        <hr className="my-8" />
        <AmplifyTestClient />
      </main>
    </div>
  );
}