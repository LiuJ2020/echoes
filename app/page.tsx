import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, Clock, Sparkles } from "lucide-react";

// Async child component that fetches the current user on the server.
async function UserDependentHero() {
  const supabase = await createClient();
  const res = await supabase.auth.getUser();
  const user = res?.data?.user ?? null;

  return (
    <>
      {/* Interactive Microphone */}
      <div className="relative">
        {/* Breathing rings */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-48 h-48 rounded-full bg-primary/10 animate-breathe" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-64 h-64 rounded-full bg-primary/5 animate-breathe-slow" />
        </div>

        {/* Central microphone button */}
        <div className="relative z-10 flex items-center justify-center">
          {user ? (
            <Link href="/record">
              <div className="w-40 h-40 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-2xl hover:shadow-3xl transition-all hover:scale-105 cursor-pointer group">
                <Mic className="h-20 w-20 text-primary-foreground group-hover:scale-110 transition-transform" />
              </div>
            </Link>
          ) : (
            <Link href="/auth/sign-up">
              <div className="w-40 h-40 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-2xl hover:shadow-3xl transition-all hover:scale-105 cursor-pointer group">
                <Mic className="h-20 w-20 text-primary-foreground group-hover:scale-110 transition-transform" />
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Minimal prompt text */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Say what's on your mind
        </h1>
        <p className="text-lg text-muted-foreground">Your past self is listening</p>
      </div>

      {/* Action buttons */}
      {user ? (
        <div className="flex gap-4 justify-center">
          <Link href="/timeline">
            <Button variant="outline" className="text-base">
              View Your Reflections
            </Button>
          </Link>
          <Link href="/query">
            <Button variant="outline" className="text-base">
              Ask Past Self
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link href="/auth/sign-up">
            <Button size="lg" className="text-base px-8">
              Start Recording
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button size="lg" variant="ghost" className="text-base">
              Sign In
            </Button>
          </Link>
        </div>
      )}

      {/* How It Works */}
      {!user && (
        <div className="max-w-3xl w-full pt-12 space-y-6">
          <h2 className="text-3xl font-bold text-center">How It Works</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold mb-1">Record Your Reflections</h4>
                <p className="text-muted-foreground text-sm">
                  Speak naturally about your experiences, insights, and lessons learned.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold mb-1">AI Analyzes & Learns</h4>
                <p className="text-muted-foreground text-sm">
                  Gemini AI extracts emotional patterns, themes, and key insights from
                  your voice.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold mb-1">Ask & Listen</h4>
                <p className="text-muted-foreground text-sm">
                  Query your past reflections and hear them played back in your own
                  voice with ElevenLabs.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function UserSkeleton() {
  return (
    <>
      <div className="relative">
        <div className="w-40 h-40 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 animate-pulse" />
      </div>
      <div className="text-center space-y-3">
        <div className="h-6 bg-muted-foreground/10 rounded w-48 mx-auto animate-pulse" />
        <div className="h-4 bg-muted-foreground/10 rounded w-32 mx-auto animate-pulse" />
      </div>
      <div className="flex gap-4 justify-center mt-4">
        <div className="h-10 w-40 bg-muted-foreground/10 rounded animate-pulse" />
        <div className="h-10 w-40 bg-muted-foreground/10 rounded animate-pulse" />
      </div>
    </>
  );
}

export default async function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
        <div className="w-full max-w-7xl flex justify-between items-center p-3 px-5 text-sm">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            Echoes
          </Link>
          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            <Suspense>
              <AuthButton />
            </Suspense>
          </div>
        </div>
      </nav>

      {/* Hero Section - Interactive Recording Experience */}
      <div className="flex-1 flex flex-col items-center justify-center gap-12 px-4 py-20">
        <div className="flex flex-col items-center space-y-8 max-w-2xl">
          <Suspense fallback={<UserSkeleton />}>
            <UserDependentHero />
          </Suspense>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl w-full pt-12">
          <Card className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Mic className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Record Voice Reflections</h3>
            <p className="text-muted-foreground">
              Capture your thoughts, lessons, and insights through natural voice
              recordings. No typing required.
            </p>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Timeline of Growth</h3>
            <p className="text-muted-foreground">
              See your reflections organized over time with emotional patterns and
              themes automatically detected.
            </p>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Ask Your Past Self</h3>
            <p className="text-muted-foreground">
              Query your reflections and hear relevant insights played back in your
              own voice. AI-powered, grounded in your truth.
            </p>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full border-t py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Built with Next.js, Supabase, Gemini AI, and ElevenLabs</p>
          <p className="mt-2">Echoes — Where your past self becomes your wisest guide</p>
        </div>
      </footer>
    </main>
  );
}
