import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeReflection } from '@/lib/api/gemini';

export async function POST(request: NextRequest) {
  try {
    const { reflectionId } = await request.json();

    if (!reflectionId) {
      return NextResponse.json(
        { error: 'Reflection ID required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get the reflection
    const { data: reflection, error: fetchError } = await supabase
      .from('reflections')
      .select('*')
      .eq('id', reflectionId)
      .single();

    if (fetchError || !reflection) {
      return NextResponse.json(
        { error: 'Reflection not found' },
        { status: 404 }
      );
    }

    // Check if already analyzed
    if (reflection.analyzed_at) {
      return NextResponse.json({
        message: 'Reflection already analyzed',
        analysis: {
          emotional_tags: reflection.emotional_tags,
          themes: reflection.themes,
          key_insights: reflection.key_insights,
          sentiment_score: reflection.sentiment_score,
        },
      });
    }

    // Analyze the transcript
    const analysis = await analyzeReflection(reflection.transcript);

    // Update reflection with analysis
    const { error: updateError } = await supabase
      .from('reflections')
      .update({
        emotional_tags: analysis.emotional_tags,
        themes: analysis.themes,
        key_insights: analysis.key_insights,
        sentiment_score: analysis.sentiment_score,
        embedding: JSON.stringify(analysis.embedding), // Store as JSON
        analyzed_at: new Date().toISOString(),
      })
      .eq('id', reflectionId);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to save analysis' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Analysis complete',
      analysis: {
        emotional_tags: analysis.emotional_tags,
        themes: analysis.themes,
        key_insights: analysis.key_insights,
        sentiment_score: analysis.sentiment_score,
      },
    });
  } catch (error) {
    console.error('Analyze route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
