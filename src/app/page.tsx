import { LandingPage } from './landing-page';
import { EnvDebug } from '@/components/debug/env-debug';
import { AuthDebug } from '@/components/debug/auth-debug';

export default function Home() {
  // Show landing page - client-side redirect will be handled by AuthProvider
  return (
    <>
      <EnvDebug />
      <AuthDebug />
      <LandingPage />
    </>
  );
}
