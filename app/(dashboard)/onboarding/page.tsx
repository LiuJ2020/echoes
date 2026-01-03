'use client';

import { useState } from 'react';
import { VoiceRecorder } from '@/components/voice/VoiceRecorder';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2 } from 'lucide-react';

const REQUIRED_SAMPLES = 3;
const SAMPLE_PROMPTS = [
  "Tell me about your day and what made you smile.",
  "Describe a challenge you're facing and how you're thinking about it.",
  "Share something you're grateful for and why it matters to you.",
  "Talk about a recent learning or realization you've had.",
  "Reflect on a goal you're working toward and how you feel about it.",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentSample, setCurrentSample] = useState(0);
  const [samples, setSamples] = useState<Blob[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const handleRecordingComplete = (blob: Blob) => {
    setSamples((prev) => [...prev, blob]);
    if (currentSample < REQUIRED_SAMPLES - 1) {
      setCurrentSample((prev) => prev + 1);
    }
  };

  const handleSubmit = async () => {
    if (samples.length < REQUIRED_SAMPLES) {
      setError(`Please record at least ${REQUIRED_SAMPLES} samples`);
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      samples.forEach((sample, index) => {
        formData.append(`sample_${index}`, sample, `sample_${index}.webm`);
      });

      const response = await fetch('/api/voice/clone', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Voice cloning failed');
      }

      setCompleted(true);
    } catch (err) {
      console.error('Voice clone error:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to create voice profile'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const progress = ((samples.length) / REQUIRED_SAMPLES) * 100;

  if (completed) {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <Card className="p-8 space-y-6">
          <div className="text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold">Voice Profile Created!</h2>
            <p className="text-muted-foreground">
              Your voice has been cloned successfully. You can now hear your past
              reflections in your own voice.
            </p>
          </div>

          <div className="flex justify-center gap-4">
            <Button onClick={() => router.push('/record')}>
              Record a Reflection
            </Button>
            <Button onClick={() => router.push('/timeline')} variant="outline">
              View Timeline
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">Create Your Voice Profile</h1>
        <p className="text-muted-foreground">
          Record {REQUIRED_SAMPLES} voice samples to hear your reflections in your
          own voice
        </p>
      </div>

      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">
              Sample {samples.length + 1} of {REQUIRED_SAMPLES}
            </span>
            <span className="text-muted-foreground">
              {Math.round(progress)}% complete
            </span>
          </div>
          <Progress value={progress} />
        </div>

        {samples.length < REQUIRED_SAMPLES && (
          <>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Sample {currentSample + 1} Prompt:</p>
              <p className="text-sm text-muted-foreground">
                {SAMPLE_PROMPTS[currentSample]}
              </p>
            </div>

            <VoiceRecorder
              onRecordingComplete={handleRecordingComplete}
              maxDurationSeconds={parseInt(
                process.env.NEXT_PUBLIC_MIN_VOICE_SAMPLE_SECONDS || '60'
              )}
            />
          </>
        )}

        {samples.length >= REQUIRED_SAMPLES && (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400 text-center">
                ✓ All samples recorded! Ready to create your voice profile.
              </p>
            </div>

            <div className="flex justify-center gap-4">
              <Button
                onClick={() => {
                  setSamples([]);
                  setCurrentSample(0);
                }}
                variant="outline"
              >
                Start Over
              </Button>
              <Button onClick={handleSubmit} disabled={isUploading} size="lg">
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Voice Profile...
                  </>
                ) : (
                  'Create Voice Profile'
                )}
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400 text-center">
              {error}
            </p>
          </div>
        )}
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        <p>
          Note: You can skip this step and use a default narrator voice instead.
        </p>
        <Button
          variant="link"
          onClick={() => router.push('/record')}
          className="mt-2"
        >
          Skip for now
        </Button>
      </div>
    </div>
  );
}
