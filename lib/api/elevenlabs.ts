import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

if (!process.env.ELEVENLABS_API_KEY) {
  throw new Error('ELEVENLABS_API_KEY is not set in environment variables');
}

const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

/**
 * Create a voice clone from audio samples using Instant Voice Cloning (IVC)
 * @param name Display name for the voice
 * @param audioFiles Array of audio file buffers
 * @param description Optional description of the voice
 * @returns Voice ID from ElevenLabs
 */
export async function createVoiceClone(
  name: string,
  audioFiles: Buffer[],
  description?: string
): Promise<string> {
  try {
    // Convert buffers to File objects
    const files = audioFiles.map((buffer, index) => {
      const blob = new Blob([new Uint8Array(buffer)], { type: 'audio/mpeg' });
      return new File([blob], `sample-${index}.mp3`, { type: 'audio/mpeg' });
    });

    const voice = await client.voices.ivc.create({
      name,
      files,
      description: description || `Voice profile for ${name}`,
      removeBackgroundNoise: true,
    });

    return voice.voiceId;
  } catch (error) {
    console.error('Voice cloning error:', error);
    throw new Error('Failed to create voice clone');
  }
}

/**
 * Generate speech from text using a specific voice
 * @param text Text to convert to speech
 * @param voiceId ElevenLabs voice ID
 * @returns Audio buffer
 */
export async function synthesizeSpeech(
  text: string,
  voiceId: string
): Promise<Buffer> {
  try {
    const audio = await client.textToSpeech.convert(voiceId, {
      text,
      modelId: 'eleven_monolingual_v1',
      voiceSettings: {
        stability: 0.5,
        similarityBoost: 0.75,
      },
    });

    // Convert the ReadableStream to buffer
    const reader = audio.getReader();
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    return Buffer.concat(chunks);
  } catch (error) {
    console.error('Speech synthesis error:', error);
    throw new Error('Failed to synthesize speech');
  }
}

/**
 * Get voice details
 * @param voiceId ElevenLabs voice ID
 * @returns Voice information
 */
export async function getVoiceInfo(voiceId: string) {
  try {
    const voice = await client.voices.get(voiceId);
    return voice;
  } catch (error) {
    console.error('Get voice error:', error);
    throw new Error('Failed to get voice information');
  }
}

/**
 * Delete a voice
 * @param voiceId ElevenLabs voice ID
 */
export async function deleteVoice(voiceId: string): Promise<void> {
  try {
    await client.voices.delete(voiceId);
  } catch (error) {
    console.error('Delete voice error:', error);
    throw new Error('Failed to delete voice');
  }
}

/**
 * Transcribe audio using ElevenLabs Speech-to-Text API
 * @param audioBuffer Audio file as Buffer
 * @param mimeType MIME type of the audio (e.g., 'audio/webm', 'audio/mp3')
 * @returns Transcribed text
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  mimeType: string
): Promise<string> {
  try {
    // Convert buffer to File object for the API
    const blob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType });
    const audioFile = new File([blob], 'audio.webm', { type: mimeType });

    const result = await client.speechToText.convert({
      file: audioFile,
      modelId: 'scribe_v1',
    });

    // The response can be different types, but for standard requests we get SpeechToTextChunkResponseModel
    if ('text' in result) {
      return result.text.trim();
    }

    throw new Error('Unexpected response format from ElevenLabs');
  } catch (error) {
    console.error('ElevenLabs transcription error:', error);
    throw new Error('Failed to transcribe audio with ElevenLabs');
  }
}

/**
 * Get a default narrator voice ID (fallback if voice cloning fails)
 * Using Rachel - a warm, friendly female voice
 */
export const DEFAULT_NARRATOR_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel

/**
 * Synthesize speech with fallback to default narrator
 * @param text Text to convert to speech
 * @param voiceId Optional custom voice ID
 * @returns Audio buffer
 */
export async function synthesizeSpeechWithFallback(
  text: string,
  voiceId?: string
): Promise<Buffer> {
  try {
    const targetVoiceId = voiceId || DEFAULT_NARRATOR_VOICE_ID;
    return await synthesizeSpeech(text, targetVoiceId);
  } catch (error) {
    console.error('Failed with custom voice, trying default narrator:', error);
    // Fallback to default narrator
    return await synthesizeSpeech(text, DEFAULT_NARRATOR_VOICE_ID);
  }
}
