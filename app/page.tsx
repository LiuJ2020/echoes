import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, Clock, Sparkles } from "lucide-react";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center gap-12 px-4 py-20">
        <div className="text-center space-y-6 max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            A Voice Bridge Between
            <br />
            <span className="text-primary">Past and Present Selves</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Echoes lets you speak to your past self through emotionally intelligent,
            voice-based AI. Record reflections, ask questions, and hear your own
            wisdom in your own voice.
          </p>

          {user ? (
            <div className="flex gap-4 justify-center pt-4">
              <Link href="/record">
                <Button size="lg" className="text-lg px-8">
                  Record a Reflection
                </Button>
              </Link>
              <Link href="/timeline">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  View Timeline
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex gap-4 justify-center pt-4">
              <Link href="/auth/sign-up">
                <Button size="lg" className="text-lg px-8">
                  Get Started
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Sign In
                </Button>
              </Link>
            </div>
          )}
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
      </div>

      {/* Footer */}
      <footer className="w-full border-t py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            Built with Next.js, Supabase, Gemini AI, and ElevenLabs
          </p>
          <p className="mt-2">
            Echoes — Where your past self becomes your wisest guide
          </p>
        </div>
      </footer>
    </main>
  );
}
