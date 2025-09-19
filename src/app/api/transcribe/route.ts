import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/client';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const audioId = formData.get('audioId') as string;
    const userId = formData.get('userId') as string;

    if (!audioFile || !audioId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if we have OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    // Transcribe using OpenAI Whisper API
    const whisperFormData = new FormData();
    whisperFormData.append('file', audioFile);
    whisperFormData.append('model', 'whisper-1');
    whisperFormData.append('response_format', 'text');

    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: whisperFormData,
    });

    if (!whisperResponse.ok) {
      const error = await whisperResponse.text();
      console.error('Whisper API error:', error);
      return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
    }

    const transcription = await whisperResponse.text();

    // Update the audio record with the transcription
    const supabase = createSupabaseClient();
    const { error: updateError } = await supabase
      .from('audios')
      .update({ transcription })
      .eq('id', audioId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json({ error: 'Failed to save transcription' }, { status: 500 });
    }

    // Now trigger the creation of transcript document and summary
    const baseUrl = request.nextUrl.origin;

    // Create transcript document
    await fetch(`${baseUrl}/api/create-transcript`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audioId,
        userId,
        transcription,
      }),
    });

    return NextResponse.json({
      success: true,
      transcription,
      message: 'Audio transcribed successfully'
    });

  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}