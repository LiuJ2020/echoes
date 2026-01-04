import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { CompactAudioPlayer } from '@/components/voice/CompactAudioPlayer';
import type { ReflectionReference } from '@/types';

interface ReflectionClipProps {
  reflection: ReflectionReference;
}

export function ReflectionClip({ reflection }: ReflectionClipProps) {
  return (
    <div
      id={`reflection-${reflection.id}`}
      className="border-l-2 border-primary pl-4 py-2 space-y-2"
    >
      {/* Citation badge, date, and emotional tags */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className="font-mono">
          [{reflection.citationIndex}]
        </Badge>
        <span className="text-xs text-muted-foreground">
          {format(new Date(reflection.createdAt), 'MMM d, yyyy')}
        </span>
        {reflection.emotionalTags?.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs">
            {tag}
          </Badge>
        ))}
      </div>

      {/* Transcript excerpt */}
      <p className="text-sm text-foreground/80 line-clamp-2">
        {reflection.transcript}
      </p>

      {/* Audio player */}
      <CompactAudioPlayer audioUrl={reflection.audioUrl} />
    </div>
  );
}
