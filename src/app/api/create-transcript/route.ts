import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const { audioId, userId, transcription } = await request.json();

    if (!audioId || !userId || !transcription) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createSupabaseClient();

    // Get the audio record to get the title
    const { data: audioData, error: audioError } = await supabase
      .from('audios')
      .select('title')
      .eq('id', audioId)
      .eq('user_id', userId)
      .single();

    if (audioError || !audioData) {
      return NextResponse.json({ error: 'Audio record not found' }, { status: 404 });
    }

    // Create or get "Transcribed Meetings" folder
    let transcribedFolderId: string;
    const { data: existingFolder } = await supabase
      .from('folders')
      .select('id')
      .eq('name', 'Transcribed Meetings')
      .eq('user_id', userId)
      .single();

    if (existingFolder) {
      transcribedFolderId = existingFolder.id;
    } else {
      const { data: newFolder, error: folderError } = await supabase
        .from('folders')
        .insert([{
          name: 'Transcribed Meetings',
          user_id: userId,
        }])
        .select()
        .single();

      if (folderError || !newFolder) {
        return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 });
      }

      transcribedFolderId = newFolder.id;
    }

    // Create the transcript document
    const { data: transcriptDoc, error: docError } = await supabase
      .from('documents')
      .insert([{
        title: `${audioData.title} - Transcript`,
        content: transcription,
        file_url: '', // No file URL since this is generated content
        file_type: 'txt',
        file_size: transcription.length,
        tags: ['transcript', 'meeting'],
        artifact_type: 'Meeting Transcript',
        folder_id: transcribedFolderId,
        user_id: userId,
      }])
      .select()
      .single();

    if (docError) {
      console.error('Document creation error:', docError);
      return NextResponse.json({ error: 'Failed to create transcript document' }, { status: 500 });
    }

    // Now trigger the summary creation
    const baseUrl = request.nextUrl.origin;
    await fetch(`${baseUrl}/api/create-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audioId,
        userId,
        transcription,
        audioTitle: audioData.title,
      }),
    });

    return NextResponse.json({
      success: true,
      transcriptDocumentId: transcriptDoc.id,
      message: 'Transcript document created successfully'
    });

  } catch (error) {
    console.error('Create transcript error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}