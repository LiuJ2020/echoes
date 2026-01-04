# Echoes

> Your past self is listening

## Overview

**Echoes** is an AI-powered personal reflection platform that helps users capture and revisit their thoughts through voice. Users record voice reflections, which are automatically transcribed and analyzed by AI to extract emotional patterns, themes, and insights. Later, users can ask questions and receive personalized audio responses grounded in their past reflections—spoken in their own voice.

## Features

### Voice Recording
Capture personal reflections (up to 3 minutes) through natural voice input. The intuitive interface makes it easy to record thoughts, lessons learned, and insights as they come to you.

### AI-Powered Analysis
Each reflection is automatically analyzed to extract:
- Emotional tags and sentiment scoring
- Life themes and patterns
- Key insights and takeaways
- Semantic embeddings for intelligent search

### Growth Timeline
Visual chronological timeline showing your reflections with emotional and thematic patterns over time. Track your personal growth and see how your thoughts evolve.

### Query Your Past
Ask questions and receive AI-synthesized audio responses in your own voice, citing relevant past reflections. Your past self literally speaks back to you with personalized insights.

## Tech Stack

### Frontend
- **Next.js 15** with React 19 and TypeScript
- **Tailwind CSS** for styling
- **Radix UI** component library
- **Recharts** for data visualization
- **WaveSurfer.js** for audio waveform display
- **Lucide React** for icons

### Backend & Infrastructure
- **Next.js API Routes** (serverless functions)
- **Vercel** hosting
- **Supabase** for authentication, PostgreSQL database, and file storage

### Database
- **Supabase PostgreSQL** with pgvector extension
- **Vector embeddings** (768-dimensional) for semantic search
- **Row-level security** for data privacy

### AI/ML Services
- **ElevenLabs** - Voice transcription and text-to-speech with voice cloning
- **Google Gemini 2.5 Flash** - Transcript analysis, insight extraction, and embeddings generation
- **pgvector** - Vector similarity search for finding relevant reflections

## Architecture

The application follows a serverless architecture with these key patterns:

- **Serverless Backend** - API routes deployed on Vercel
- **Background Processing** - Fire-and-forget async analysis for fast uploads
- **Vector-Based Search** - Semantic search using embeddings for intelligent reflection retrieval
- **Voice Cloning** - Personalized response synthesis in user's own voice
- **Web Audio API** - Browser-based audio recording

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- ElevenLabs API key
- Google Gemini API key

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd echoes
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env.local` file with:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
GEMINI_API_KEY=your_gemini_api_key
```

4. Run the development server
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Application Flow

### Recording Flow
1. User records voice reflection via browser
2. Audio (WebM format) uploaded to Supabase Storage
3. ElevenLabs transcribes the audio
4. Transcript and metadata stored in PostgreSQL
5. Background job triggers Gemini analysis (async)
6. Gemini extracts: emotional tags, themes, key insights, sentiment, and embeddings

### Query Flow
1. User asks voice question on Query page
2. Audio transcribed to text
3. Query text converted to embedding via Gemini
4. Vector similarity search finds 5 most relevant reflections
5. Gemini generates grounded response citing relevant reflections
6. ElevenLabs synthesizes response in user's cloned voice
7. Audio returned with references to source reflections

## License

MIT
