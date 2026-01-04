import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateQueryEmbedding } from '@/lib/api/gemini';

export async function POST(request: NextRequest) {
  try {
    const { query, limit = 5 } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate embedding for the query
    const queryEmbedding = await generateQueryEmbedding(query);

    // Perform vector similarity search
    // Note: This uses Supabase's pgvector extension
    // We'll use RPC function for cosine similarity
    const { data: results, error: searchError } = await supabase.rpc(
      'match_reflections',
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.5,
        match_count: limit,
        p_user_id: user.id,
      }
    );

    if (searchError) {
      console.error('Search error:', searchError);

      // Fallback: If RPC function doesn't exist, do a simple text search
      const { data: fallbackResults, error: fallbackError } = await supabase
        .from('reflections')
        .select('*')
        .eq('user_id', user.id)
        .or(
          `transcript.ilike.%${query}%,key_insights.cs.{${query}},themes.cs.{${query}}`
        )
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fallbackError) {
        console.error('Fallback search error:', fallbackError);
        return NextResponse.json(
          { error: 'Failed to search reflections' },
          { status: 500 }
        );
      }

      // Return fallback results without similarity scores
      const formattedResults = fallbackResults.map((reflection) => ({
        reflection,
        similarity_score: 0.8, // Default score for text match
        relevance_reason: 'Text match found in reflection',
      }));

      return NextResponse.json({ results: formattedResults });
    }

    // Format results with similarity scores
    const formattedResults = results.map((result: any) => ({
      reflection: result,
      similarity_score: result.similarity || 0,
      relevance_reason:
        result.similarity > 0.8
          ? 'Highly relevant match'
          : result.similarity > 0.6
          ? 'Moderately relevant match'
          : 'Potentially relevant match',
    }));

    return NextResponse.json({ results: formattedResults });
  } catch (error) {
    console.error('Query route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
