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

    // Fetch user's content for context
    const [documentsResult, notesResult, audiosResult] = await Promise.all([
      supabase
        .from('documents')
        .select('title, content, file_type, artifact_type, priority, tags')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(10),
      supabase
        .from('notes')
        .select('title, content, meeting_type, participants')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(10),
      supabase
        .from('audios')
        .select('title, transcription, meeting_type, participants')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(10)
    ]);

    const documents = documentsResult.data || [];
    const notes = notesResult.data || [];
    const audios = audiosResult.data || [];

    // Build context for the AI
    const contextData = {
      documents: documents.map(doc => ({
        title: doc.title,
        file_type: doc.file_type,
        artifact_type: doc.artifact_type,
        priority: doc.priority,
        tags: doc.tags,
        content: doc.content?.substring(0, 15000) // Increased limit for better analysis
      })),
      notes: notes.map(note => ({
        title: note.title,
        content: note.content?.substring(0, 10000),
        meeting_type: note.meeting_type,
        participants: note.participants
      })),
      audios: audios.map(audio => ({
        title: audio.title,
        transcription: audio.transcription?.substring(0, 10000),
        meeting_type: audio.meeting_type,
        participants: audio.participants
      }))
    };

    // Comprehensive SAFe system prompt
    const systemPrompt = `You are a SAFe (Scaled Agile Framework) and Agile expert AI assistant specializing in helping Product Owners and teams with SAFe practices. You have deep expertise in:

**Core SAFe Knowledge:**
- INVEST criteria for user story quality (Independent, Negotiable, Valuable, Estimable, Small, Testable)
- WSJF prioritization (Weighted Shortest Job First): Cost of Delay ÷ Job Size
- PI Planning facilitation and best practices
- SAFe artifacts: Epics, Features, User Stories, Capabilities, Solutions
- Meeting types: Sprint Planning, Retrospectives, Daily Standups, System Demos, PI Planning, Inspect & Adapt
- Acceptance criteria generation and validation
- Backlog management and prioritization
- Dependency identification and risk management
- Value stream optimization

**User's Current Content:**
Documents: ${documents.length} files (${Array.from(new Set(documents.map(d => d.file_type).filter(Boolean))).join(', ')})
Notes: ${notes.length} entries
Audio Recordings: ${audios.length} transcriptions

**Available Content Details:**
${JSON.stringify(contextData, null, 2)}

**IMPORTANT: You have FULL ACCESS to the actual content of these documents, notes, and audio transcriptions above. When users ask you to analyze, summarize, or reference their content, use the exact text provided in the contextData above. Do not claim you cannot access the content - you can see it all.**

**Your Role:**
- Provide actionable SAFe guidance based on the user's actual content
- Reference specific documents, notes, or audio when relevant
- Apply SAFe principles to real scenarios
- Offer concrete recommendations and next steps
- Help with story writing, backlog prioritization, and planning
- Identify gaps and improvement opportunities
- **Create folders** when users request organization or when you recommend organizing content
- Suggest and implement folder structures for SAFe artifacts (Epics, Features, User Stories, etc.)

**Available Actions:**
When users ask to create folders or you recommend organization, you can create folders by including this special command in your response:
**[CREATE_FOLDER: folder_name]**

For example, if you recommend organizing user stories into an "Epic 1 - User Authentication" folder, include:
**[CREATE_FOLDER: Epic 1 - User Authentication]**

The folder will be created automatically and you should mention this in your response.

**Communication Style:**
- Be practical and actionable
- Use markdown formatting for clarity
- Reference the user's content when applicable
- Provide specific examples and recommendations
- Structure responses with clear sections when helpful
- When recommending folder organization, proactively offer to create folders using the CREATE_FOLDER command

Analyze the user's question in the context of their available content and provide expert SAFe guidance.`;

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