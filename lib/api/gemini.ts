import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AnalysisResult } from '@/types';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not set in environment variables');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Transcribe audio using Gemini's multimodal capabilities
 * @param audioBuffer Audio file as Buffer
 * @param mimeType MIME type of the audio (e.g., 'audio/webm', 'audio/mp3')
 * @returns Transcribed text
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  mimeType: string
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const result = await model.generateContent([
      {
        inlineData: {
          data: audioBuffer.toString('base64'),
          mimeType,
        },
      },
      'Transcribe this audio recording word-for-word. Only provide the transcription text, nothing else.',
    ]);

    const response = await result.response;
    const text = response.text().trim();

    return text;
  } catch (error) {
    console.error('Transcription error:', error);
    throw new Error('Failed to transcribe audio');
  }
}

/**
 * Analyze a reflection transcript and extract emotional patterns
 * @param transcript The transcribed text to analyze
 * @returns Analysis result with tags, themes, insights, and sentiment
 */
export async function analyzeReflection(
  transcript: string
): Promise<AnalysisResult> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are analyzing a personal voice reflection. Extract the following information from this transcript:

Transcript:
"${transcript}"

Provide your analysis in this exact JSON format:
{
  "emotional_tags": ["tag1", "tag2", "tag3"],
  "themes": ["theme1", "theme2"],
  "key_insights": ["insight1", "insight2"],
  "sentiment_score": 0.5
}

Guidelines:
- emotional_tags: 2-4 emotion words (e.g., "hopeful", "anxious", "grateful", "frustrated", "peaceful", "uncertain")
- themes: 1-3 life areas (e.g., "career", "relationships", "self-growth", "health", "creativity", "family")
- key_insights: 1-3 key realizations or lessons (direct quotes or paraphrases, 1 sentence each)
- sentiment_score: -1.0 (very negative) to 1.0 (very positive)

Only extract what's actually present. Be grounded and non-judgmental. Return ONLY the JSON, no other text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    // Extract JSON from response (in case there's any extra text)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON in response');
    }

    const analysis = JSON.parse(jsonMatch[0]) as Omit<
      AnalysisResult,
      'embedding'
    >;

    // Generate embedding for semantic search
    const embedding = await generateEmbedding(transcript);

    return {
      ...analysis,
      embedding,
    };
  } catch (error) {
    console.error('Analysis error:', error);
    throw new Error('Failed to analyze reflection');
  }
}

/**
 * Generate embedding vector for semantic search
 * @param text Text to embed
 * @returns Embedding vector (768 dimensions)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

    const result = await model.embedContent(text);
    const embedding = result.embedding;

    return embedding.values;
  } catch (error) {
    console.error('Embedding error:', error);
    throw new Error('Failed to generate embedding');
  }
}

/**
 * Find semantically similar reflections using cosine similarity
 * This is a helper function for the query API
 * @param queryText The user's query
 * @returns Embedding vector to use in database query
 */
export async function generateQueryEmbedding(
  queryText: string
): Promise<number[]> {
  return generateEmbedding(queryText);
}
