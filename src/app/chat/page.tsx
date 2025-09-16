import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ChatClientPage } from './chat-client';

export default async function ChatPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch user's content summary for display
  const [documentsResult, notesResult, audiosResult] = await Promise.all([
    supabase
      .from('documents')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id),
    supabase
      .from('notes')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id),
    supabase
      .from('audios')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id),
  ]);

  const contentSummary = {
    documents: documentsResult.count || 0,
    notes: notesResult.count || 0,
    audios: audiosResult.count || 0,
  };

  return <ChatClientPage contentSummary={contentSummary} />;
}