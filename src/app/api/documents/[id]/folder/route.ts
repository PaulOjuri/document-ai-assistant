import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createSupabaseServerClient();

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { folderId } = await request.json();
    const documentId = params.id;

    // Update the document's folder assignment
    const { data: document, error } = await supabase
      .from('documents')
      .update({ folder_id: folderId })
      .eq('id', documentId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Database error updating document folder:', error);
      return NextResponse.json(
        { error: 'Failed to update document folder' },
        { status: 500 }
      );
    }

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Document folder updated successfully',
      document
    });

  } catch (error) {
    console.error('Update document folder error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}