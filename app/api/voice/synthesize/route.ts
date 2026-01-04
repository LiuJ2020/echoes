import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { synthesizeSpeechWithFallback } from '@/lib/api/elevenlabs';


export async function POST(request: NextRequest) {
  try {
    const { reflectionId, text } = await request.json();

    if (!reflectionId && !text) {
      return NextResponse.json(
        { error: 'Either reflectionId or text required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let textToSynthesize = text;

    // If reflectionId provided, get the transcript
    if (reflectionId) {
      const { data: reflection, error: fetchError } = await supabase
        .from('reflections')
        .select('transcript')
        .eq('id', reflectionId)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !reflection) {
        return NextResponse.json(
          { error: 'Reflection not found' },
          { status: 404 }
        );
      }

      textToSynthesize = reflection.transcript;
    }

    // Get user's voice profile
    const { data: voiceProfile } = await supabase
      .from('voice_profiles')
      .select('elevenlabs_voice_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    // Synthesize speech (with fallback to default narrator)
    const audioBuffer = await synthesizeSpeechWithFallback(
      textToSynthesize,
      voiceProfile?.elevenlabs_voice_id
    );

    // Store synthesized audio in Supabase Storage
    const timestamp = Date.now();
    const fileName = `${user.id}/synthesized/${timestamp}.mp3`;

    const { error: uploadError } = await supabase.storage
      .from('reflections')
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      // Return audio directly if upload fails
      return new NextResponse(new Uint8Array(audioBuffer), {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': audioBuffer.length.toString(),
        },
      });
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('reflections').getPublicUrl(fileName);

    return NextResponse.json({
      audioUrl: publicUrl,
      voiceId: voiceProfile?.elevenlabs_voice_id || 'default',
    });
  } catch (error) {
    console.error('Synthesize route error:', error);
    return NextResponse.json(
      { error: 'Failed to synthesize speech' },
      { status: 500 }
    );
  }
}
