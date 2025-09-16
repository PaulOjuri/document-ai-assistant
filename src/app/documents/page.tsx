import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { DocumentsPageClient } from './documents-client';

export default async function DocumentsPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch initial documents
  const { data: documents, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching documents:', error);
  }

  return <DocumentsPageClient initialDocuments={documents || []} />;
}