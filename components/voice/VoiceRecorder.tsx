'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, Square, Play, Pause } from 'lucide-react';

interface VoiceRecorderProps {
  onRecordingComplete?: (audioBlob: Blob, duration: number) => void;
  maxDurationSeconds?: number;
}

const thumbStyles = `
  input[type="range"].audio-seeker::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #22c55e;
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }

  input[type="range"].audio-seeker::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #22c55e;
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
`;

export function VoiceRecorder({
  onRecordingComplete,
  maxDurationSeconds = 180, // 3 minutes default
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        if (onRecordingComplete) {
          onRecordingComplete(blob, duration);
        }

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 1;

          // Auto-stop at max duration
          if (newDuration >= maxDurationSeconds) {
            stopRecording();
            return maxDurationSeconds;
          }

          return newDuration;
        });
      }, 1000);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to access microphone. Please grant permission and try again.');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);

      // Restart timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 1;
          if (newDuration >= maxDurationSeconds) {
            stopRecording();
            return maxDurationSeconds;
          }
          return newDuration;
        });
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const time = parseFloat(e.target.value);
    audio.currentTime = time;
    setPlaybackTime(time);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    const updateTime = () => setPlaybackTime(audio.currentTime);
    const updateDuration = () => setPlaybackDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatMaxTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins}min`;
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: thumbStyles }} />
      <Card className="p-6 space-y-4">
        <div className="flex flex-col items-center space-y-4">
        {/* Timer Display */}
        <div className="text-4xl font-mono font-bold">
          {formatTime(duration)}
          <span className="text-sm text-muted-foreground ml-2">
            / {formatMaxTime(maxDurationSeconds)}
          </span>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-sm text-red-500 text-center">{error}</div>
        )}

        {/* Recording Controls */}
        {!isRecording && !audioUrl && (
          <Button
            onClick={startRecording}
            size="lg"
            className="w-32 h-32 rounded-full"
            variant="default"
          >
            <Mic className="h-12 w-12" />
          </Button>
        )}

        {isRecording && (
          <div className="flex gap-4">
            {!isPaused ? (
              <>
                <Button
                  onClick={pauseRecording}
                  size="lg"
                  variant="outline"
                  className="rounded-full"
                >
                  <Pause className="h-6 w-6" />
                </Button>
                <Button
                  onClick={stopRecording}
                  size="lg"
                  variant="destructive"
                  className="rounded-full"
                >
                  <Square className="h-6 w-6" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={resumeRecording}
                  size="lg"
                  variant="default"
                  className="rounded-full"
                >
                  <Play className="h-6 w-6" />
                </Button>
                <Button
                  onClick={stopRecording}
                  size="lg"
                  variant="destructive"
                  className="rounded-full"
                >
                  <Square className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>
        )}

        {/* Playback Controls */}
        {audioUrl && !isRecording && (
          <div className="w-full space-y-4">
            <audio
              ref={audioRef}
              src={audioUrl}
              className="hidden"
            />

            <div className="flex flex-col items-center gap-4 w-full">
              {/* Play/Pause Button */}
              <div className="flex justify-center">
                {!isPlaying ? (
                  <Button
                    onClick={playAudio}
                    size="lg"
                    variant="outline"
                    className="rounded-full"
                  >
                    <Play className="h-6 w-6" />
                  </Button>
                ) : (
                  <Button
                    onClick={pauseAudio}
                    size="lg"
                    variant="outline"
                    className="rounded-full"
                  >
                    <Pause className="h-6 w-6" />
                  </Button>
                )}
              </div>

              {/* Progress Bar */}
              <div className="w-full space-y-2">
                <input
                  type="range"
                  min="0"
                  max={playbackDuration || 0}
                  step="0.01"
                  value={playbackTime}
                  onChange={handleSeek}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 audio-seeker"
                  style={{
                    background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${
                      (playbackTime / playbackDuration) * 100
                    }%, hsl(var(--muted)) ${
                      (playbackTime / playbackDuration) * 100
                    }%, hsl(var(--muted)) 100%)`,
                  }}
                />

                {/* Time Display */}
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatTime(playbackTime)}</span>
                  <span>{formatTime(playbackDuration)}</span>
                </div>
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              Recording complete
            </div>
          </div>
        )}

        {/* Status Text */}
        <div className="text-sm text-center text-muted-foreground">
          {!isRecording && !audioUrl && 'Click to start recording your reflection'}
          {isRecording && !isPaused && 'Recording... Click pause or stop'}
          {isRecording && isPaused && 'Paused - Click to resume'}
          {audioUrl && !isRecording && 'Play your recording or submit below'}
        </div>
      </div>
    </Card>
    </>
  );
}
