'use client';

import { useState } from 'react';
import { VoiceRecorder } from '@/components/voice/VoiceRecorder';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2 } from 'lucide-react';

export default function RecordPage() {
  const router = useRouter();
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [reflectionId, setReflectionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRecordingComplete = (blob: Blob, durationSeconds: number) => {
    setAudioBlob(blob);
    setDuration(durationSeconds);
    setTranscript(null);
    setReflectionId(null);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!audioBlob) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'reflection.webm');
      formData.append('duration', duration.toString());

      const response = await fetch('/api/reflections/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      setTranscript(data.transcript);
      setReflectionId(data.reflectionId);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload reflection');
    } finally {
      setIsUploading(false);
    }
  };

  const handleViewTimeline = () => {
    router.push('/timeline');
  };

  const handleRecordAnother = () => {
    setAudioBlob(null);
    setTranscript(null);
    setReflectionId(null);
    setError(null);
    window.location.reload();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">Record a Reflection</h1>
        <p className="text-muted-foreground">
          Share your thoughts, insights, or lessons learned. Your past self is listening.
        </p>
      </div>

      {!reflectionId ? (
        <>
          <VoiceRecorder
            onRecordingComplete={handleRecordingComplete}
            maxDurationSeconds={
              parseInt(process.env.NEXT_PUBLIC_MAX_RECORDING_SECONDS || '180')
            }
          />

          {audioBlob && !transcript && (
            <Card className="p-6">
              <div className="space-y-4">
                <p className="text-center text-sm text-muted-foreground">
                  Recording ready to upload. We'll transcribe and analyze your reflection.
                </p>
                <div className="flex justify-center gap-4">
                  <Button
                    onClick={handleSubmit}
                    disabled={isUploading}
                    size="lg"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Submit Reflection'
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {error && (
            <Card className="p-6 border-red-500 bg-red-50 dark:bg-red-950">
              <p className="text-sm text-red-600 dark:text-red-400 text-center">
                {error}
              </p>
            </Card>
          )}
        </>
      ) : (
        <Card className="p-8 space-y-6">
          <div className="text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold">Reflection Saved!</h2>
            <p className="text-muted-foreground">
              Your reflection has been transcribed and is being analyzed.
            </p>
          </div>

          {transcript && (
            <div className="space-y-2">
              <h3 className="font-semibold">Transcript:</h3>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">{transcript}</p>
              </div>
            </div>
          )}

          <div className="flex justify-center gap-4">
            <Button onClick={handleRecordAnother} variant="outline">
              Record Another
            </Button>
            <Button onClick={handleViewTimeline}>View Timeline</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
