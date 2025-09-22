import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { pipeline, env } from '@huggingface/transformers';

// Configure environment for Transformers.js
env.allowRemoteModels = false;
env.allowLocalModels = true;

let textGenerationPipeline: any = null;

async function getTextGenerationPipeline() {
  if (!textGenerationPipeline) {
    try {
      // Use a lightweight conversational model optimized for business assistance
      textGenerationPipeline = await pipeline(
        'text-generation',
        'Xenova/gpt2',
        {
          revision: 'main',
        }
      );
    } catch (error) {
      console.error('Error loading Hugging Face model:', error);
      // Fallback to a simpler model if the preferred one fails
      textGenerationPipeline = await pipeline(
        'text-generation',
        'gpt2',
        {
          revision: 'main',
        }
      );
    }
  }
  return textGenerationPipeline;
}

export async function POST(request: NextRequest) {
  try {
    const { message, userId } = await request.json();

    if (!message || !userId) {
      return NextResponse.json(
        { error: 'Message and userId are required' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    // Verify user authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's content for context (same as Claude API)
    const [documentsResult, notesResult, audiosResult, todosResult, foldersResult] = await Promise.all([
      supabase
        .from('documents')
        .select(`
          title, content, file_type, artifact_type, priority, tags,
          folder_id,
          folders!inner(name, parent_id)
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(10), // Reduced for faster processing
      supabase
        .from('notes')
        .select(`
          title, content, meeting_type, participants,
          folder_id,
          folders!inner(name, parent_id)
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(10),
      supabase
        .from('audios')
        .select(`
          title, transcription, meeting_type, participants,
          folder_id,
          folders!inner(name, parent_id)
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(5),
      supabase
        .from('todos')
        .select(`
          title, description, status, priority, due_date, source, source_type,
          folder_id,
          folders(name, parent_id)
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(15),
      supabase
        .from('folders')
        .select('id, name, parent_id')
        .eq('user_id', userId)
        .order('name')
    ]);

    const documents = documentsResult.data || [];
    const notes = notesResult.data || [];
    const audios = audiosResult.data || [];
    const todos = todosResult.data || [];
    const folders = foldersResult.data || [];

    // Build context summary for Hugging Face model
    const contextSummary = `
SAFe/Agile Assistant Context:
- ${documents.length} documents available
- ${notes.length} meeting notes
- ${todos.length} todos tracked
- Focus: Product Owner guidance, user stories, backlog management

Recent todos: ${todos.slice(0, 3).map(t => `${t.title} (${t.status})`).join(', ')}
Recent documents: ${documents.slice(0, 3).map(d => d.title).join(', ')}

User query: ${message}

Response (be concise, practical, and actionable):`;

    // Get the text generation pipeline
    const generator = await getTextGenerationPipeline();

    // Generate response using Hugging Face model
    const result = await generator(contextSummary, {
      max_new_tokens: 300,
      temperature: 0.7,
      repetition_penalty: 1.1,
      do_sample: true,
      top_k: 50,
      top_p: 0.9,
      pad_token_id: 50256, // GPT-2 pad token
    });

    let aiResponse = result[0]?.generated_text || 'I apologize, but I encountered an issue generating a response. Please try again.';

    // Clean up the response - remove the input context
    if (aiResponse.includes('Response (be concise, practical, and actionable):')) {
      aiResponse = aiResponse.split('Response (be concise, practical, and actionable):')[1]?.trim() || aiResponse;
    }

    // Ensure response is not too long and is helpful
    if (aiResponse.length > 1000) {
      aiResponse = aiResponse.substring(0, 1000) + '...';
    }

    // Add a note about the model being used
    const finalResponse = `${aiResponse}

*Powered by Hugging Face Transformers.js*`;

    return NextResponse.json({ response: finalResponse });

  } catch (error) {
    console.error('Hugging Face Chat API error:', error);

    if (error instanceof Error && error.message.includes('model')) {
      return NextResponse.json({
        response: `🤖 **Model Loading Error**

The Hugging Face model is still loading or encountered an issue. This is normal on first use as models are downloaded locally.

Please try again in a moment, or use the Claude-powered chat for immediate assistance.

Error: ${error.message}`
      });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}