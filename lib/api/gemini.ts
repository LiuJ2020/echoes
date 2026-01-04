import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import type { AnalysisResult, GeminiResponseWithSearch, ReflectionReference } from '@/types';

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
  console.log('[Gemini] transcribeAudio: Starting transcription', {
    bufferSize: audioBuffer.length,
    mimeType,
  });

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    console.log('[Gemini] transcribeAudio: Model initialized');

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

    console.log('[Gemini] transcribeAudio: Success', {
      textLength: text.length,
      preview: text.substring(0, 100),
    });

    return text;
  } catch (error) {
    console.error('[Gemini] transcribeAudio: Error', error);
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
  console.log('[Gemini] analyzeReflection: Starting analysis', {
    transcriptLength: transcript.length,
    preview: transcript.substring(0, 100),
  });

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    console.log('[Gemini] analyzeReflection: Model initialized');

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

    console.log('[Gemini] analyzeReflection: Raw response received', {
      responseLength: text.length,
    });

    // Extract JSON from response (in case there's any extra text)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[Gemini] analyzeReflection: No valid JSON found in response');
      throw new Error('No valid JSON in response');
    }

    const analysis = JSON.parse(jsonMatch[0]) as Omit<
      AnalysisResult,
      'embedding'
    >;

    console.log('[Gemini] analyzeReflection: Analysis parsed', {
      emotionalTags: analysis.emotional_tags,
      themes: analysis.themes,
      sentimentScore: analysis.sentiment_score,
    });

    // Generate embedding for semantic search
    const embedding = await generateEmbedding(transcript);

    console.log('[Gemini] analyzeReflection: Success', {
      embeddingDimensions: embedding.length,
    });

    return {
      ...analysis,
      embedding,
    };
  } catch (error) {
    console.error('[Gemini] analyzeReflection: Error', error);
    throw new Error('Failed to analyze reflection');
  }
}

/**
 * Generate embedding vector for semantic search
 * @param text Text to embed
 * @returns Embedding vector (768 dimensions)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  console.log('[Gemini] generateEmbedding: Starting', {
    textLength: text.length,
    preview: text.substring(0, 100),
  });

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

    const result = await model.embedContent(text);
    const embedding = result.embedding;

    console.log('[Gemini] generateEmbedding: Success', {
      dimensions: embedding.values.length,
    });

    return embedding.values;
  } catch (error) {
    console.error('[Gemini] generateEmbedding: Error', error);
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
  console.log('[Gemini] generateQueryEmbedding: Called with query:', queryText);
  return generateEmbedding(queryText);
}

/**
 * Generate a response with all reflections as grounding information
 * The LLM will select which reflections are relevant and return their IDs
 * @param queryText The user's question
 * @param allReflections All of the user's reflections
 * @returns Response with selected reflection IDs
 */
export async function generateResponseWithAllReflections(
  queryText: string,
  allReflections: Array<{
    id: string;
    transcript: string;
    audio_url: string;
    created_at: string;
    emotional_tags: string[] | null;
    themes: string[] | null;
  }>
): Promise<GeminiResponseWithSearch> {
  console.log('[Gemini] generateResponseWithAllReflections: Starting', {
    queryText,
    reflectionCount: allReflections.length,
  });

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          response: {
            type: SchemaType.STRING,
            description:
              'The spoken response to the user (2-4 sentences, warm and empathetic)',
          },
          selectedReflectionIds: {
            type: SchemaType.ARRAY,
            description:
              'Array of reflection IDs that are most relevant to this response',
            items: {
              type: SchemaType.STRING,
            },
          },
        },
        required: ['response', 'selectedReflectionIds'],
      },
    },
  });

  console.log('[Gemini] generateResponseWithAllReflections: Model initialized with structured output');

  // Format all reflections for the prompt
  const reflectionsContext = allReflections
    .map((r) => {
      const tags = r.emotional_tags?.join(', ') || 'none';
      const themes = r.themes?.join(', ') || 'none';
      const date = new Date(r.created_at).toLocaleDateString();
      return `[ID: ${r.id}]
Date: ${date}
Tags: ${tags}
Themes: ${themes}
Transcript: ${r.transcript}
`;
    })
    .join('\n---\n\n');

  const prompt = `You are a thoughtful AI assistant helping users reflect on their past thoughts and feelings.

The user has recorded voice reflections over time. Below are ALL of their reflections:

${reflectionsContext}

User's question: "${queryText}"

Your task:
1. Review all the reflections above
2. Select the 2-4 most relevant reflections that help answer the user's question
3. Generate a warm, empathetic spoken response (2-4 sentences) that synthesizes insights from the selected reflections
4. Return the response text and the IDs of the selected reflections in JSON format

Remember:
- Be conversational and speak as if you're helping the user connect with their past self
- Keep the response concise since it will be spoken aloud
- Only select reflections that are truly relevant to answering the question`;

  console.log('[Gemini] generateResponseWithAllReflections: Sending prompt to Gemini');

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  console.log('[Gemini] generateResponseWithAllReflections: Response received', {
    responseLength: text.length,
  });

  // Parse the JSON response
  const parsed = JSON.parse(text) as {
    response: string;
    selectedReflectionIds: string[];
  };

  console.log('[Gemini] generateResponseWithAllReflections: Parsed response', {
    responseText: parsed.response,
    selectedCount: parsed.selectedReflectionIds.length,
    selectedIds: parsed.selectedReflectionIds,
  });

  // Map selected IDs to full reflection references
  const referencedReflections: ReflectionReference[] =
    parsed.selectedReflectionIds
      .map((id, index) => {
        const reflection = allReflections.find((r) => r.id === id);
        if (!reflection) {
          console.warn(
            `[Gemini] generateResponseWithAllReflections: Selected reflection ID ${id} not found`
          );
          return null;
        }
        return {
          id: reflection.id,
          transcript: reflection.transcript,
          audioUrl: reflection.audio_url,
          createdAt: reflection.created_at,
          emotionalTags: reflection.emotional_tags || [],
          themes: reflection.themes || [],
          similarityScore: 1.0, // Not using similarity anymore
          citationIndex: index + 1,
        };
      })
      .filter((r): r is ReflectionReference => r !== null);

  console.log('[Gemini] generateResponseWithAllReflections: Success', {
    referencedReflectionsCount: referencedReflections.length,
  });

  return {
    responseWithCitations: parsed.response,
    cleanText: parsed.response,
    referencedReflections,
  };
}
