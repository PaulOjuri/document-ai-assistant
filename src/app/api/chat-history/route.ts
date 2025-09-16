import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// GET - Fetch chat history for a user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Verify user authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's chat history
    const { data: chats, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(50); // Limit to last 50 conversations

    if (error) {
      console.error('Error fetching chat history:', error);
      return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: 500 });
    }

    return NextResponse.json({ chats: chats || [] });

  } catch (error) {
    console.error('Chat history API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Save/Update chat conversation
export async function POST(request: NextRequest) {
  try {
    const { chatId, messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    // Verify user authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let result;

    if (chatId) {
      // Update existing chat
      const { data, error } = await supabase
        .from('chats')
        .update({
          messages: messages,
          updated_at: new Date().toISOString()
        })
        .eq('id', chatId)
        .eq('user_id', user.id) // Ensure user can only update their own chats
        .select()
        .single();

      if (error) {
        console.error('Error updating chat:', error);
        return NextResponse.json({ error: 'Failed to update chat' }, { status: 500 });
      }

      result = data;
    } else {
      // Create new chat
      const { data, error } = await supabase
        .from('chats')
        .insert({
          messages: messages,
          user_id: user.id,
          context: [] // Can be enhanced later with document context
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating chat:', error);
        return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 });
      }

      result = data;
    }

    return NextResponse.json({ chat: result });

  } catch (error) {
    console.error('Chat history save API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a chat conversation
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const chatId = url.searchParams.get('chatId');

    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    // Verify user authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('id', chatId)
      .eq('user_id', user.id); // Ensure user can only delete their own chats

    if (error) {
      console.error('Error deleting chat:', error);
      return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Chat history delete API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}