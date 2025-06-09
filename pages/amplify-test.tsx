import dynamic from 'next/dynamic';

// Dynamically import the Amplify API to avoid SSR issues
const AmplifyTestClient = dynamic(
  () => import('../components/AmplifyTestClient').then(mod => ({ default: mod.default })),
  { 
    ssr: false,
    loading: () => <div className="max-w-4xl mx-auto p-6">Loading Amplify test page...</div>
  }
);

export default function AmplifyTest() {
  return <AmplifyTestClient />;
}
