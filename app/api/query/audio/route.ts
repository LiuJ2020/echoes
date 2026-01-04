import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { transcribeAudio } from '@/lib/api/elevenlabs';
import { generateResponseWithAllReflections } from '@/lib/api/gemini';
import { synthesizeSpeechWithFallback } from '@/lib/api/elevenlabs';

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse audio file from FormData
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Transcribe using ElevenLabs
    const queryTranscript = await transcribeAudio(buffer, 'audio/webm');

    if (!queryTranscript || queryTranscript.trim().length === 0) {
      return NextResponse.json(
        { error: 'Failed to transcribe audio or audio was empty' },
        { status: 400 }
      );
    }

    // 4. Fetch all user reflections
    const { data: allReflections, error: fetchError } = await supabase
      .from('reflections')
      .select('id, transcript, audio_url, created_at, emotional_tags, themes')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Failed to fetch reflections:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch reflections' },
        { status: 500 }
      );
    }

    // 5. Generate Gemini response with all reflections as context
    const geminiResponse = await generateResponseWithAllReflections(
      queryTranscript,
      allReflections || []
    );

    // 6. Get user's voice profile
    const { data: voiceProfile } = await supabase
      .from('voice_profiles')
      .select('elevenlabs_voice_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    // 7. Synthesize response to audio with user's voice
    const audioBuffer = await synthesizeSpeechWithFallback(
      geminiResponse.cleanText,
      voiceProfile?.elevenlabs_voice_id
    );

    // 8. Store response audio in Supabase Storage
    const timestamp = Date.now();
    const fileName = `${user.id}/responses/${timestamp}.mp3`;

    const { error: uploadError } = await supabase.storage
      .from('reflections')
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      // Fallback: return base64 data URL instead of public URL
      const base64Audio = audioBuffer.toString('base64');
      const audioDataUrl = `data:audio/mpeg;base64,${base64Audio}`;

      return NextResponse.json({
        queryTranscript,
        responseAudioUrl: audioDataUrl,
        referencedReflections: geminiResponse.referencedReflections,
      });
    }

    // 9. Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('reflections').getPublicUrl(fileName);

    // 10. Return complete response (audio + selected reflection clips only)
    return NextResponse.json({
      queryTranscript,
      responseAudioUrl: publicUrl,
      referencedReflections: geminiResponse.referencedReflections,
    });
  } catch (error) {
    console.error('Audio query error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process audio query',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
