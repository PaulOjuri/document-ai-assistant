'use client';

import { useEffect, useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';

export function AuthDebug() {
  const [authState, setAuthState] = useState<any>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createSupabaseClient();

        // Test basic connection
        const { data, error: testError } = await supabase.auth.getSession();

        setAuthState({
          hasSession: !!data.session,
          error: testError?.message,
          url: supabase.supabaseUrl,
          key: supabase.supabaseKey?.substring(0, 20) + '...',
        });

        if (testError) {
          setError(testError.message);
        }
      } catch (err: any) {
        setError(err.message || 'Unknown error');
      }
    };

    checkAuth();
  }, []);

  return (
    <div className="fixed bottom-4 right-4 bg-blue-100 border border-blue-400 p-4 rounded text-xs z-50 max-w-md">
      <h3 className="font-bold">Auth Debug</h3>
      <div className="mt-2">
        <p>Has Session: {authState.hasSession ? 'Yes' : 'No'}</p>
        <p>URL: {authState.url}</p>
        <p>Key: {authState.key}</p>
        {error && <p className="text-red-600 mt-2">Error: {error}</p>}
        {authState.error && <p className="text-red-600 mt-2">Auth Error: {authState.error}</p>}
      </div>
    </div>
  );
}