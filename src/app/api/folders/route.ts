import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// GET - Fetch folders for a user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Verify user authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's folders
    const { data: folders, error } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching folders:', error);
      return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 });
    }

    return NextResponse.json({ folders: folders || [] });

  } catch (error) {
    console.error('Folders API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new folder
export async function POST(request: NextRequest) {
  try {
    const { name, parent_id, safe_artifact } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Folder name is required' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    // Verify user authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create new folder
    const folderData: any = {
      name: name.trim(),
      user_id: user.id,
    };

    if (parent_id) {
      folderData.parent_id = parent_id;
    }

    if (safe_artifact) {
      folderData.safe_artifact = safe_artifact;
    }

    const { data, error } = await supabase
      .from('folders')
      .insert([folderData])
      .select()
      .single();

    if (error) {
      console.error('Error creating folder:', error);
      return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 });
    }

    return NextResponse.json({ folder: data });

  } catch (error) {
    console.error('Folder creation API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a folder
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const folderId = url.searchParams.get('folderId');

    if (!folderId) {
      return NextResponse.json({ error: 'Folder ID is required' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    // Verify user authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', folderId)
      .eq('user_id', user.id); // Ensure user can only delete their own folders

    if (error) {
      console.error('Error deleting folder:', error);
      return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Folder deletion API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}