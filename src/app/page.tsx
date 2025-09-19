import { LandingPage } from './landing-page';
import { EnvDebug } from '@/components/debug/env-debug';

export default function Home() {
  // Show landing page - client-side redirect will be handled by AuthProvider
  return (
    <>
      <EnvDebug />
      <LandingPage />
    </>
  );
}
