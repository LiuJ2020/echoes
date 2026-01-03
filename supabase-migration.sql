-- Echoes Database Migration
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. Enable pgvector extension for embeddings
-- ============================================
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- 2. Create reflections table
-- ============================================
CREATE TABLE IF NOT EXISTS reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  audio_url TEXT NOT NULL,
  transcript TEXT NOT NULL,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Gemini Analysis Fields
  emotional_tags TEXT[], -- ["hopeful", "anxious", "grateful"]
  themes TEXT[],         -- ["career", "relationships", "self-improvement"]
  key_insights TEXT[],   -- Extracted lessons/realizations
  sentiment_score FLOAT, -- -1.0 to 1.0
  embedding VECTOR(768), -- For semantic search (pgvector extension)

  -- Metadata
  analyzed_at TIMESTAMPTZ,
  analysis_version TEXT DEFAULT 'v1'
);

-- ============================================
-- 3. Create indexes for reflections
-- ============================================
CREATE INDEX IF NOT EXISTS idx_reflections_user_id ON reflections(user_id);
CREATE INDEX IF NOT EXISTS idx_reflections_created_at ON reflections(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reflections_themes ON reflections USING GIN(themes);
CREATE INDEX IF NOT EXISTS idx_reflections_emotional_tags ON reflections USING GIN(emotional_tags);

-- Vector similarity search index (for faster nearest neighbor queries)
CREATE INDEX IF NOT EXISTS idx_reflections_embedding ON reflections USING ivfflat (embedding vector_cosine_ops);

-- ============================================
-- 4. Enable RLS for reflections
-- ============================================
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reflections
CREATE POLICY "Users can view their own reflections"
  ON reflections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reflections"
  ON reflections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reflections"
  ON reflections FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- 5. Create voice_profiles table
-- ============================================
CREATE TABLE IF NOT EXISTS voice_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  elevenlabs_voice_id TEXT NOT NULL,
  sample_audio_urls TEXT[], -- URLs of voice samples used
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================
-- 6. Enable RLS for voice_profiles
-- ============================================
ALTER TABLE voice_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for voice_profiles
CREATE POLICY "Users can view their own voice profile"
  ON voice_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own voice profile"
  ON voice_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice profile"
  ON voice_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- 7. Create storage buckets
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('reflections', 'reflections', false),
  ('voice-samples', 'voice-samples', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 8. Storage RLS policies for reflections bucket
-- ============================================
CREATE POLICY "Users can upload their own reflections"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'reflections' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own reflections"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'reflections' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own reflections"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'reflections' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================
-- 9. Storage RLS policies for voice-samples bucket
-- ============================================
CREATE POLICY "Users can upload their voice samples"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'voice-samples' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their voice samples"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'voice-samples' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their voice samples"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'voice-samples' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================
-- 10. Create vector similarity search function
-- ============================================
CREATE OR REPLACE FUNCTION match_reflections (
  query_embedding VECTOR(768),
  match_threshold FLOAT,
  match_count INT,
  user_id UUID
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  audio_url TEXT,
  transcript TEXT,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ,
  emotional_tags TEXT[],
  themes TEXT[],
  key_insights TEXT[],
  sentiment_score FLOAT,
  embedding VECTOR(768),
  analyzed_at TIMESTAMPTZ,
  analysis_version TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    reflections.id,
    reflections.user_id,
    reflections.audio_url,
    reflections.transcript,
    reflections.duration_seconds,
    reflections.created_at,
    reflections.emotional_tags,
    reflections.themes,
    reflections.key_insights,
    reflections.sentiment_score,
    reflections.embedding,
    reflections.analyzed_at,
    reflections.analysis_version,
    1 - (reflections.embedding <=> query_embedding) AS similarity
  FROM reflections
  WHERE reflections.user_id = match_reflections.user_id
    AND reflections.embedding IS NOT NULL
    AND 1 - (reflections.embedding <=> query_embedding) > match_threshold
  ORDER BY reflections.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
