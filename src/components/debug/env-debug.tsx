'use client';

export function EnvDebug() {
  // Show in production temporarily for debugging
  // if (process.env.NODE_ENV === 'production') {
  //   return null;
  // }

  return (
    <div className="fixed top-4 right-4 bg-red-100 border border-red-400 p-4 rounded text-xs z-50 max-w-md">
      <h3 className="font-bold">Environment Debug</h3>
      <div>
        <p>SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</p>
        <p>SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</p>
        <p>NODE_ENV: {process.env.NODE_ENV}</p>
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <p className="mt-2 break-all">URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
        )}
      </div>
    </div>
  );
}