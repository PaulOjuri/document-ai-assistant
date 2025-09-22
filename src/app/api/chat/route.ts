import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

// Initialize Claude client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { message, userId } = await request.json();

    if (!message || !userId) {
      return NextResponse.json(
        { error: 'Message and userId are required' },
        { status: 400 }
      );
    }

    // Check if Anthropic API key is configured
    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your_anthropic_api_key_here') {
      return NextResponse.json({
        response: `⚠️ **Claude API Key Required**

To enable the AI agent, please:
1. Get an API key from https://console.anthropic.com/
2. Add it to your .env.local file as ANTHROPIC_API_KEY=your_actual_key
3. Restart the development server

For now, I can provide SAFe guidance based on your content using built-in knowledge. What would you like help with?`
      });
    }

    const supabase = await createSupabaseServerClient();

    // Verify user authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's content for context with folder information
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
        .limit(15),
      supabase
        .from('notes')
        .select(`
          title, content, meeting_type, participants,
          folder_id,
          folders!inner(name, parent_id)
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(15),
      supabase
        .from('audios')
        .select(`
          title, transcription, meeting_type, participants,
          folder_id,
          folders!inner(name, parent_id)
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(15),
      supabase
        .from('todos')
        .select(`
          title, description, status, priority, due_date, source, source_type,
          folder_id,
          folders(name, parent_id)
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(20),
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

    // Build folder hierarchy for context
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

    // Build context for the AI with folder organization
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
        content: doc.content?.substring(0, 15000) // Increased limit for better analysis
      })),
      notes: notes.map(note => ({
        title: note.title,
        content: note.content?.substring(0, 10000),
        meeting_type: note.meeting_type,
        participants: note.participants,
        folder: note.folder_id ? getFolderPath(note.folder_id) : 'No folder'
      })),
      audios: audios.map(audio => ({
        title: audio.title,
        transcription: audio.transcription?.substring(0, 10000),
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

    // Simplified, natural system prompt
    const systemPrompt = `You are a helpful AI assistant specializing in SAFe (Scaled Agile Framework) and Agile practices. You help Product Owners and teams with practical guidance.

**Your expertise includes:**
- User story writing and INVEST criteria
- Backlog prioritization using WSJF
- Sprint planning and PI planning
- Dependency analysis and risk management
- Team retrospectives and process improvement

**User's Content:**
You have access to ${documents.length} documents, ${notes.length} notes, and ${todos.length} todos in their workspace.

**Communication Style:**
- Be concise and practical
- Give specific, actionable advice
- Reference their actual content when relevant
- Use a conversational, helpful tone
- Avoid unnecessary formatting or lengthy explanations
- Focus on solving their immediate problem

**Available Content:**
${JSON.stringify(contextData, null, 2)}`;

    // Call Claude API (non-streaming for now)
    const completion = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: message
        }
      ],
    });

    let aiResponse = completion.content[0]?.text || 'I apologize, but I encountered an issue generating a response. Please try again.';

    // Process folder creation commands
    const folderCreateRegex = /\*\*\[CREATE_FOLDER:\s*([^\]]+)\]\*\*/g;
    const folderMatches = Array.from(aiResponse.matchAll(folderCreateRegex));

    if (folderMatches.length > 0) {
      // Create folders
      const createdFolders = [];

      for (const match of folderMatches) {
        const folderName = match[1].trim();

        try {
          const { data: folder, error } = await supabase
            .from('folders')
            .insert([{
              name: folderName,
              user_id: user.id,
            }])
            .select()
            .single();

          if (!error && folder) {
            createdFolders.push(folderName);
          }
        } catch (error) {
          console.error('Error creating folder:', folderName, error);
        }
      }

      // Remove the commands from the response and add confirmation
      aiResponse = aiResponse.replace(folderCreateRegex, '');

      if (createdFolders.length > 0) {
        const folderConfirmation = `\n\n✅ **Folders Created Successfully:**\n${createdFolders.map(name => `- ${name}`).join('\n')}\n\nYou can now organize your documents, notes, and audio files into these folders through the respective sections of the application.`;
        aiResponse += folderConfirmation;
      }
    }

    // Process todo creation commands
    const todoCreateRegex = /\*\*\[CREATE_TODO:\s*([^|]+)\|([^|]*)\|([^|]*)\|([^\]]*)\]\*\*/g;
    const todoMatches = Array.from(aiResponse.matchAll(todoCreateRegex));

    if (todoMatches.length > 0) {
      // Create todos
      const createdTodos = [];

      for (const match of todoMatches) {
        const title = match[1].trim();
        const description = match[2].trim() || null;
        const priority = match[3].trim() || 'Medium';
        const dueDate = match[4].trim() || null;

        // Validate priority
        const validPriority = ['High', 'Medium', 'Low'].includes(priority) ? priority : 'Medium';

        // Validate due date format
        const validDueDate = dueDate && /^\d{4}-\d{2}-\d{2}$/.test(dueDate) ? dueDate : null;

        try {
          const { data: todo, error } = await supabase
            .from('todos')
            .insert([{
              title: title,
              description: description,
              priority: validPriority,
              due_date: validDueDate,
              source: 'auto_detected',
              user_id: user.id,
            }])
            .select()
            .single();

          if (!error && todo) {
            createdTodos.push(title);
          }
        } catch (error) {
          console.error('Error creating todo:', title, error);
        }
      }

      // Remove the commands from the response and add confirmation
      aiResponse = aiResponse.replace(todoCreateRegex, '');

      if (createdTodos.length > 0) {
        const todoConfirmation = `\n\n✅ **Todos Created Successfully:**\n${createdTodos.map(title => `- ${title}`).join('\n')}\n\nYou can view and manage these todos in the Todo section of the application.`;
        aiResponse += todoConfirmation;
      }
    }

    return NextResponse.json({ response: aiResponse });

  } catch (error) {
    console.error('Chat API error:', error);

    // Handle specific Claude errors
    if (error instanceof Error) {
      if (error.message.includes('API key') || error.message.includes('authentication')) {
        return NextResponse.json({
          response: `🔑 **API Key Error**

There's an issue with the Claude API key. Please check that:
1. Your API key is valid and active
2. You have sufficient credits/quota
3. The key has the necessary permissions

Error: ${error.message}`
        });
      }

      if (error.message.includes('rate limit')) {
        return NextResponse.json({
          response: `⏱️ **Rate Limit Reached**

The API rate limit has been exceeded. Please wait a moment and try again.

This happens when there are too many requests in a short time period.`
        });
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}