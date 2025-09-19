import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function PATCH(request: NextRequest) {
  try {
    const { documentId, folderId } = await request.json();

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    // Verify user authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update document folder assignment
    const { data, error } = await supabase
      .from('documents')
      .update({ folder_id: folderId || null })
      .eq('id', documentId)
      .eq('user_id', user.id) // Ensure user owns the document
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to update document folder' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Document not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({ document: data });

  } catch (error) {
    console.error('Documents API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}