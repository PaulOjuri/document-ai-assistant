import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Admin client for server-side operations only
// This should never be used on the client side
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);