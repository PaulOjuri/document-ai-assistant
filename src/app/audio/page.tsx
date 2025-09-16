import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { AudioClientPage } from './audio-client';

export default async function AudioPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch user's audio files with folder and date information
  const { data: audios, error } = await supabase
    .from('audios')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching audios:', error);
  }

  return <AudioClientPage initialAudios={audios || []} />;
}