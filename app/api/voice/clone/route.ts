import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createVoiceClone } from '@/lib/api/elevenlabs';

export async function POST(request: NextRequest) {
  try {
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
    const audioFiles: File[] = [];

    // Collect all audio files
    for (let i = 0; i < 5; i++) {
      const file = formData.get(`sample_${i}`) as File;
      if (file) {
        audioFiles.push(file);
      }
    }

    if (audioFiles.length < 3) {
      return NextResponse.json(
        { error: 'At least 3 voice samples required' },
        { status: 400 }
      );
    }

    // Convert files to buffers
    const buffers = await Promise.all(
      audioFiles.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        return Buffer.from(arrayBuffer);
      })
    );

    // Upload samples to Supabase Storage first
    const sampleUrls: string[] = [];
    for (let i = 0; i < buffers.length; i++) {
      const fileName = `${user.id}/samples/sample_${Date.now()}_${i}.webm`;
      const { error: uploadError } = await supabase.storage
        .from('voice-samples')
        .upload(fileName, buffers[i], {
          contentType: 'audio/webm',
        });

      if (uploadError) {
        console.error('Sample upload error:', uploadError);
        continue;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('voice-samples').getPublicUrl(fileName);
      sampleUrls.push(publicUrl);
    }

    // Create voice clone with ElevenLabs
    const voiceId = await createVoiceClone(
      `${user.email}'s Voice`,
      buffers,
      `Voice profile for ${user.email}`
    );

    // Check if user already has a voice profile
    const { data: existingProfile } = await supabase
      .from('voice_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existingProfile) {
      // Update existing profile
      const { error: updateError } = await supabase
        .from('voice_profiles')
        .update({
          elevenlabs_voice_id: voiceId,
          sample_audio_urls: sampleUrls,
          updated_at: new Date().toISOString(),
          is_active: true,
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Update error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update voice profile' },
          { status: 500 }
        );
      }
    } else {
      // Create new profile
      const { error: insertError } = await supabase
        .from('voice_profiles')
        .insert({
          user_id: user.id,
          elevenlabs_voice_id: voiceId,
          sample_audio_urls: sampleUrls,
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        return NextResponse.json(
          { error: 'Failed to create voice profile' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      voiceId,
      message: 'Voice profile created successfully',
    });
  } catch (error) {
    console.error('Voice clone route error:', error);
    return NextResponse.json(
      { error: 'Failed to create voice clone' },
      { status: 500 }
    );
  }
}
