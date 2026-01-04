import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
// Using ElevenLabs for transcription - favored for higher accuracy and better audio quality handling
import { transcribeAudio } from '@/lib/api/elevenlabs';
// Alternative: Gemini transcription (kept for reference, currently not in use)
// import { transcribeAudio } from '@/lib/api/gemini';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const durationSeconds = formData.get('duration') as string;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const timestamp = Date.now();
    const fileName = `${user.id}/${timestamp}.webm`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('reflections')
      .upload(fileName, buffer, {
        contentType: 'audio/webm',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload audio file' },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('reflections').getPublicUrl(fileName);

    // Transcribe audio using ElevenLabs (preferred over Gemini for better transcription quality)
    let transcript: string;
    try {
      transcript = await transcribeAudio(buffer, 'audio/webm');
    } catch (transcribeError) {
      console.error('Transcription error:', transcribeError);
      // Clean up uploaded file
      await supabase.storage.from('reflections').remove([fileName]);
      return NextResponse.json(
        { error: 'Failed to transcribe audio' },
        { status: 500 }
      );
    }

    // Create reflection record
    const { data: reflection, error: dbError } = await supabase
      .from('reflections')
      .insert({
        user_id: user.id,
        audio_url: publicUrl,
        transcript,
        duration_seconds: durationSeconds ? parseInt(durationSeconds) : null,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Clean up uploaded file
      await supabase.storage.from('reflections').remove([fileName]);
      return NextResponse.json(
        { error: 'Failed to save reflection' },
        { status: 500 }
      );
    }

    // Trigger analysis in background (fire and forget)
    fetch(`${request.nextUrl.origin}/api/reflections/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reflectionId: reflection.id }),
    }).catch((err) => console.error('Background analysis trigger failed:', err));

    return NextResponse.json({
      reflectionId: reflection.id,
      transcript,
      audioUrl: publicUrl,
      message: 'Reflection uploaded successfully. Analysis in progress.',
    });
  } catch (error) {
    console.error('Upload route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
