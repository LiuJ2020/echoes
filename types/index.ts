// Core data types for Echoes

export interface Reflection {
  id: string;
  user_id: string;
  audio_url: string;
  transcript: string;
  duration_seconds: number | null;
  created_at: string;

  // Analysis fields
  emotional_tags: string[] | null;
  themes: string[] | null;
  key_insights: string[] | null;
  sentiment_score: number | null;
  embedding: number[] | null;

  // Metadata
  analyzed_at: string | null;
  analysis_version: string | null;
}

export interface VoiceProfile {
  id: string;
  user_id: string;
  elevenlabs_voice_id: string;
  sample_audio_urls: string[];
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface AnalysisResult {
  emotional_tags: string[];
  themes: string[];
  key_insights: string[];
  sentiment_score: number;
  embedding: number[];
}

export interface QueryResult {
  reflection: Reflection;
  similarity_score: number;
  relevance_reason?: string;
}

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
}

export interface VoiceCloneProgress {
  stage: 'collecting' | 'uploading' | 'processing' | 'completed' | 'error';
  samplesCollected: number;
  totalSamples: number;
  voiceId?: string;
  error?: string;
}
