'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AudioPlayer } from '@/components/voice/AudioPlayer';
import { format } from 'date-fns';
import { Loader2, Sparkles } from 'lucide-react';
import type { QueryResult } from '@/types';

interface ReflectionResponseProps {
  result: QueryResult;
  onPlayVoice: (reflectionId: string) => void;
  synthesizedAudio?: string;
  isSynthesizing?: boolean;
}

export function ReflectionResponse({
  result,
  onPlayVoice,
  synthesizedAudio,
  isSynthesizing = false,
}: ReflectionResponseProps) {
  const { reflection, similarity_score } = result;

  return (
    <div className="space-y-4">
      <Card className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">
                Your past self, from {format(new Date(reflection.created_at), 'PPP')}
              </h3>
            </div>

            {/* Similarity Score */}
            <div className="flex items-center gap-2">
              <Badge variant={similarity_score > 0.7 ? 'default' : 'secondary'}>
                {Math.round(similarity_score * 100)}% match
              </Badge>
              {reflection.emotional_tags && reflection.emotional_tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {reflection.emotional_tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Transcript */}
            <div className="pt-2">
              <p className="text-sm leading-relaxed">{reflection.transcript}</p>
            </div>

            {/* Key Insights */}
            {reflection.key_insights && reflection.key_insights.length > 0 && (
              <div className="pt-2 space-y-2">
                <h4 className="text-sm font-semibold">Key Insights:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {reflection.key_insights.map((insight, index) => (
                    <li key={index} className="text-sm text-muted-foreground">
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Synthesize Voice Button */}
        {!synthesizedAudio && (
          <div className="flex justify-center pt-4">
            <Button
              onClick={() => onPlayVoice(reflection.id)}
              disabled={isSynthesizing}
              size="lg"
            >
              {isSynthesizing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating voice...
                </>
              ) : (
                'Hear in Your Voice'
              )}
            </Button>
          </div>
        )}
      </Card>

      {/* Audio Player (appears after synthesis) */}
      {synthesizedAudio && (
        <AudioPlayer
          audioUrl={synthesizedAudio}
          title="Your past self said..."
          subtitle={format(new Date(reflection.created_at), 'PPP')}
          autoPlay
        />
      )}
    </div>
  );
}
