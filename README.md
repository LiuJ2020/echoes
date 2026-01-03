# Echoes — A Voice Bridge Between Past and Present Selves

Echoes lets you speak to your past self through emotionally intelligent, voice-based AI. Record reflections, ask questions, and hear your own wisdom in your own voice.

## 🌟 Features

- **Voice Recording**: Capture reflections through natural voice recordings
- **AI Analysis**: Gemini AI extracts emotional patterns, themes, and key insights
- **Semantic Search**: Query your past reflections with natural language
- **Voice Synthesis**: Hear your reflections in your own voice using ElevenLabs
- **Timeline View**: See your growth over time with emotional trends
- **Privacy-First**: All data is stored securely with Row Level Security

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Supabase (PostgreSQL + Storage)
- **AI**: Google Gemini (transcription, analysis, embeddings), pgvector (semantic search)
- **Voice**: ElevenLabs (voice cloning & text-to-speech)

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 20+ installed
- A Supabase account (free tier works)
- A Google Gemini API key ([Get it here](https://aistudio.google.com/apikey))
- An ElevenLabs API key ([Get it here](https://elevenlabs.io/app/settings/api-keys))

## 🚀 Quick Start

### 1. Clone and Install

\`\`\`bash
git clone <your-repo-url>
cd echoes
npm install
\`\`\`

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Project Settings > API** and copy:
   - Project URL
   - Anon/Public key

### 3. Run Database Migration

1. Go to your Supabase dashboard → **SQL Editor**
2. Open \`supabase-migration.sql\` from this project
3. Copy and paste the entire contents
4. Click **Run** to create all tables, indexes, storage buckets, and functions

This migration creates:
- `reflections` table (voice recordings + analysis)
- `voice_profiles` table (ElevenLabs voice IDs)
- Storage buckets for audio files
- Vector similarity search function
- Row Level Security policies

### 4. Configure Environment Variables

Your \`.env.local\` should already have the Supabase credentials. Ensure it looks like this:

### 5. Run the Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 📖 User Flow

### First Time Setup

1. **Sign Up**: Create an account at `/auth/sign-up`
2. **Voice Onboarding** (Optional): Record 3-5 voice samples at `/onboarding` to clone your voice
   - You can skip this and use a default narrator voice instead
3. **Record First Reflection**: Go to `/record` and speak your first reflection

### Daily Usage

1. **Record Reflections**: Visit `/record` anytime to capture thoughts
   - Speak naturally for up to 3 minutes
   - Transcription and analysis happen automatically
2. **View Timeline**: See all reflections at `/timeline`
   - Filter by emotion or theme
   - See emotional trends over time
3. **Ask Your Past Self**: Query reflections at `/query`
   - Ask questions like "What have I learned about productivity?"
   - Hear relevant past reflections in your own voice

## 🏗️ Project Structure

\`\`\`
echoes/
├── app/
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── layout.tsx           # Dashboard navigation
│   │   ├── record/page.tsx      # Voice recording page
│   │   ├── timeline/page.tsx    # Reflection timeline
│   │   ├── query/page.tsx       # Ask past self
│   │   └── onboarding/page.tsx  # Voice profile setup
│   ├── api/
│   │   ├── reflections/
│   │   │   ├── upload/route.ts  # Upload + transcribe
│   │   │   ├── analyze/route.ts # Gemini analysis
│   │   │   ├── list/route.ts    # Fetch reflections
│   │   │   └── query/route.ts   # Semantic search
│   │   └── voice/
│   │       ├── clone/route.ts   # Voice cloning
│   │       └── synthesize/route.ts # TTS generation
│   ├── auth/                     # Supabase auth pages
│   └── page.tsx                  # Homepage
├── components/
│   ├── voice/
│   │   ├── VoiceRecorder.tsx    # Recording UI
│   │   └── AudioPlayer.tsx      # Playback UI
│   ├── reflections/
│   │   ├── ReflectionCard.tsx   # Single reflection
│   │   └── ReflectionTimeline.tsx # Timeline view
│   └── query/
│       ├── QueryInterface.tsx    # Search input
│       └── ReflectionResponse.tsx # Search results
├── lib/
│   ├── api/
│   │   ├── gemini.ts            # Gemini client
│   │   └── elevenlabs.ts        # ElevenLabs client
│   └── supabase/                # Supabase clients
├── types/
│   └── index.ts                  # TypeScript types
└── supabase-migration.sql       # Database schema
\`\`\`

## 🔑 Key Technical Decisions

### 1. Transcription: Gemini Audio Understanding
- **Why**: Single API for transcription + analysis, simpler architecture
- **Trade-off**: Slightly less accurate than Whisper, but sufficient for MVP

### 2. Voice Cloning: ElevenLabs
- **Why**: Best quality, authentic "past self" experience
- **Trade-off**: Takes 5-10 minutes to process, but worth it for demo impact

### 3. Vector Search: pgvector in Supabase
- **Why**: Native PostgreSQL, no external service, fast for <1000 reflections
- **Trade-off**: Manual index management, but simple for MVP scale

### 4. Recording: Client-side MediaRecorder API
- **Why**: No streaming infrastructure, works in all browsers
- **Trade-off**: Limited audio format control, but webm is acceptable

## 🐛 Troubleshooting

### Microphone Permission Denied
- Check browser permissions (usually top-left in address bar)
- Try Chrome or Edge if using Safari

### Voice Cloning Fails
- Ensure you recorded at least 3 samples (1 minute each)
- Check ElevenLabs account quota
- Fallback to default narrator voice is automatic

### Transcription Errors
- Gemini works best with clear audio
- Avoid background noise when recording
- Check Gemini API quota

### Vector Search Not Working
- Ensure you ran the full database migration
- Check that `pgvector` extension is enabled in Supabase
- Verify the `match_reflections` function was created

## 🎯 Demo Tips

### For Hackathon Judges

1. **Pre-populate Data**: Record 3-5 reflections before the demo
2. **Voice Clone Ready**: Have voice profile already created
3. **The Wow Moment**: Query "What have I learned?" and play the voice response
4. **Show Timeline**: Display emotional trends and themes

### Demo Script (2 Minutes)

1. **Login** (5 sec) — Show existing timeline
2. **Record reflection** (30 sec) — "Today I realized..."
3. **Show transcript** (5 sec) — Appears automatically
4. **Navigate to query** (10 sec) — Click "Ask Past Self"
5. **Ask question** (20 sec) — "What did I learn about...?"
6. **THE MOMENT** (60 sec) — Past reflection plays in user's voice
   - *This is when judges feel something*

## 📝 License

MIT

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [Google Gemini](https://ai.google.dev/)
- [ElevenLabs](https://elevenlabs.io/)
- [shadcn/ui](https://ui.shadcn.com/)

---

**Echoes** — Where your past self becomes your wisest guide
