'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import type { Reflection } from '@/types';
import { CompactAudioPlayer } from '@/components/voice/CompactAudioPlayer';

interface ReflectionCardProps {
  reflection: Reflection;
}

export function ReflectionCard({ reflection }: ReflectionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getSentimentColor = (score: number | null) => {
    if (score === null) return 'bg-muted-foreground';
    if (score > 0.3) return 'bg-primary';
    if (score < -0.3) return 'bg-destructive';
    return 'bg-muted-foreground/70';
  };

  const getSentimentLabel = (score: number | null) => {
    if (score === null) return 'Unknown';
    if (score > 0.3) return 'Positive';
    if (score < -0.3) return 'Negative';
    return 'Neutral';
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {format(new Date(reflection.created_at), 'PPP')}
            </span>
            {reflection.sentiment_score !== null && (
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${getSentimentColor(
                    reflection.sentiment_score
                  )}`}
                />
                <span className="text-xs text-muted-foreground">
                  {getSentimentLabel(reflection.sentiment_score)}
                </span>
              </div>
            )}
          </div>

          {/* Emotional Tags */}
          {reflection.emotional_tags && reflection.emotional_tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {reflection.emotional_tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Themes */}
          {reflection.themes && reflection.themes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {reflection.themes.map((theme) => (
                <Badge key={theme} variant="outline">
                  {theme}
                </Badge>
              ))}
            </div>
          )}

          {/* Transcript Preview/Full */}
          <div className="pt-2">
            <p className="text-sm">
              {isExpanded
                ? reflection.transcript
                : `${reflection.transcript.substring(0, 150)}${
                    reflection.transcript.length > 150 ? '...' : ''
                  }`}
            </p>
          </div>

          {/* Key Insights (when expanded) */}
          {isExpanded &&
            reflection.key_insights &&
            reflection.key_insights.length > 0 && (
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

      {/* Audio Playback */}
      {reflection.audio_url && (
        <div className="pt-2">
          <CompactAudioPlayer audioUrl={reflection.audio_url} />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              Show More
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
