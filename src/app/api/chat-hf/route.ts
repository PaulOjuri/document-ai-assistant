import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { pipeline, env } from '@huggingface/transformers';

// Configure environment for Transformers.js
env.allowRemoteModels = true;
env.allowLocalModels = true;
env.localOnly = false;

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
          local_files_only: false,
          use_remote: true,
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
          local_files_only: false,
          use_remote: true,
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

    // Build folder hierarchy for context (same as Claude API)
    const folderMap = new Map(folders.map(f => [f.id, f]));
    const getFolderPath = (folderId: string): string => {
      const folder = folderMap.get(folderId);
      if (!folder) return 'No folder';
      if (folder.parent_id) {
        const parentPath = getFolderPath(folder.parent_id);
        return `${parentPath} > ${folder.name}`;
      }
      return folder.name;
    };

    // Build context data with folder organization
    const contextData = {
      folderStructure: folders.map(f => ({
        name: f.name,
        path: getFolderPath(f.id),
        isFeatureFolder: f.name.includes('Context') || f.name.includes('Meeting') || f.name.includes('User Stories'),
        isGeneralContext: f.name === 'General Context' || f.name.includes('Technology') || f.name.includes('Team')
      })),
      documents: documents.map(doc => ({
        title: doc.title,
        file_type: doc.file_type,
        artifact_type: doc.artifact_type,
        priority: doc.priority,
        tags: doc.tags,
        folder: doc.folder_id ? getFolderPath(doc.folder_id) : 'No folder',
        content: doc.content?.substring(0, 5000), // Reduced for GPT-2 context limits
        fullContentLength: doc.content?.length || 0,
        contentPreview: doc.content?.length > 5000 ? 'TRUNCATED' : 'COMPLETE'
      })),
      notes: notes.map(note => ({
        title: note.title,
        content: note.content?.substring(0, 3000),
        fullContentLength: note.content?.length || 0,
        contentPreview: note.content?.length > 3000 ? 'TRUNCATED' : 'COMPLETE',
        meeting_type: note.meeting_type,
        participants: note.participants,
        folder: note.folder_id ? getFolderPath(note.folder_id) : 'No folder'
      })),
      audios: audios.map(audio => ({
        title: audio.title,
        transcription: audio.transcription?.substring(0, 3000),
        fullTranscriptionLength: audio.transcription?.length || 0,
        transcriptionPreview: audio.transcription?.length > 3000 ? 'TRUNCATED' : 'COMPLETE',
        meeting_type: audio.meeting_type,
        participants: audio.participants,
        folder: audio.folder_id ? getFolderPath(audio.folder_id) : 'No folder'
      })),
      todos: todos.map(todo => ({
        title: todo.title,
        description: todo.description,
        status: todo.status,
        priority: todo.priority,
        due_date: todo.due_date,
        source: todo.source,
        source_type: todo.source_type,
        folder: todo.folder_id ? getFolderPath(todo.folder_id) : 'No folder'
      }))
    };

    // Deep Analysis Context - Optimized for GPT-2
    const contextSummary = `SAFe/Agile Expert Assistant

ANALYSIS TASK: Perform deep content analysis with practical insights

WORKSPACE: ${documents.length} docs, ${notes.length} notes, ${todos.length} todos, ${folders.length} folders

CAPABILITIES:
- Extract key themes, requirements, risks from actual content
- Identify patterns and gaps across artifacts
- Apply SAFe principles (INVEST criteria, WSJF prioritization)
- Suggest organizational improvements

KEY CONTENT:
Documents: ${documents.slice(0, 3).map(d => `"${d.title}" (${d.artifact_type || 'unknown type'})`).join(', ')}
Recent Todos: ${todos.slice(0, 3).map(t => `${t.title} [${t.status}]`).join(', ')}
Notes: ${notes.slice(0, 2).map(n => `"${n.title}" (${n.meeting_type || 'meeting'})`).join(', ')}

USER QUERY: ${message}

ANALYSIS RESPONSE (be specific, reference actual content, provide actionable SAFe insights):`;

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
    if (aiResponse.includes('ANALYSIS RESPONSE (be specific, reference actual content, provide actionable SAFe insights):')) {
      aiResponse = aiResponse.split('ANALYSIS RESPONSE (be specific, reference actual content, provide actionable SAFe insights):')[1]?.trim() || aiResponse;
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