import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const { audioId, userId, transcription, audioTitle } = await request.json();

    if (!audioId || !userId || !transcription || !audioTitle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if we have OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const supabase = createSupabaseClient();

    // Generate summary using OpenAI
    const summaryPrompt = `
You are an expert Agile coach and meeting facilitator. Please analyze the following meeting transcript and create a comprehensive SAFe Agile meeting summary document with the following structure:

## Meeting Summary: ${audioTitle}

### Key Decisions Made
- List all concrete decisions that were made during the meeting

### Action Items
- List all action items with clear ownership and deadlines where mentioned
- Format: [Action] - Owner: [Name] - Due: [Date/Timeline]

### Discussion Points
- Summarize the main topics discussed
- Include any concerns or blockers identified

### Next Steps
- Outline what needs to happen next
- Include any follow-up meetings or deliverables

### Participants & Contributions
- Note key participants and their main contributions (if identifiable from transcript)

### SAFe Agile Context
- Identify which SAFe events, artifacts, or roles were discussed
- Note any Epic, Feature, User Story, or Capability mentions
- Highlight any PI Planning, Sprint Planning, or other ceremony references

Please keep the summary concise but comprehensive, focusing on actionable items and decisions rather than conversational details.

Transcript:
${transcription}
`;

    const summaryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'user',
            content: summaryPrompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    if (!summaryResponse.ok) {
      const error = await summaryResponse.text();
      console.error('OpenAI API error:', error);
      return NextResponse.json({ error: 'Summary generation failed' }, { status: 500 });
    }

    const summaryData = await summaryResponse.json();
    const summary = summaryData.choices[0]?.message?.content;

    if (!summary) {
      return NextResponse.json({ error: 'No summary generated' }, { status: 500 });
    }

    // Create or get "Meeting Summaries" folder
    let summariesFolderId: string;
    const { data: existingFolder } = await supabase
      .from('folders')
      .select('id')
      .eq('name', 'Meeting Summaries')
      .eq('user_id', userId)
      .single();

    if (existingFolder) {
      summariesFolderId = existingFolder.id;
    } else {
      const { data: newFolder, error: folderError } = await supabase
        .from('folders')
        .insert([{
          name: 'Meeting Summaries',
          user_id: userId,
        }])
        .select()
        .single();

      if (folderError || !newFolder) {
        return NextResponse.json({ error: 'Failed to create summaries folder' }, { status: 500 });
      }

      summariesFolderId = newFolder.id;
    }

    // Create the summary document
    const { data: summaryDoc, error: docError } = await supabase
      .from('documents')
      .insert([{
        title: `${audioTitle} - Meeting Summary`,
        content: summary,
        file_url: '', // No file URL since this is generated content
        file_type: 'md',
        file_size: summary.length,
        tags: ['summary', 'meeting', 'agile', 'actionable'],
        artifact_type: 'Meeting Summary',
        priority: 'High',
        folder_id: summariesFolderId,
        user_id: userId,
      }])
      .select()
      .single();

    if (docError) {
      console.error('Summary document creation error:', docError);
      return NextResponse.json({ error: 'Failed to create summary document' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      summaryDocumentId: summaryDoc.id,
      summary,
      message: 'Meeting summary created successfully'
    });

  } catch (error) {
    console.error('Create summary error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}