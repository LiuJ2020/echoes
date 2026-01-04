import { format } from 'date-fns';
import { AudioPlayer } from '@/components/voice/AudioPlayer';
import { ReflectionClip } from './ReflectionClip';
import type { ReflectionReference } from '@/types';

interface UserMessageProps {
  content: string;
  timestamp: Date;
}

export function UserMessage({ content, timestamp }: UserMessageProps) {
  return (
    <div className="flex justify-end mb-4">
      <div className="max-w-[80%] space-y-1">
        <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3">
          <p className="text-sm">{content}</p>
        </div>
        <p className="text-xs text-muted-foreground text-right px-2">
          {format(timestamp, 'h:mm a')}
        </p>
      </div>
    </div>
  );
}

interface AssistantMessageProps {
  audioUrl: string;
  referencedReflections: ReflectionReference[];
  timestamp: Date;
}

export function AssistantMessage({
  audioUrl,
  referencedReflections,
  timestamp,
}: AssistantMessageProps) {
  return (
    <div className="flex justify-start mb-6">
      <div className="max-w-[85%] space-y-3">
        {/* Audio player for response */}
        <AudioPlayer
          audioUrl={audioUrl}
          title="Your past self responds"
          autoPlay={true}
        />

        {/* Referenced reflections */}
        {referencedReflections.length > 0 && (
          <div className="space-y-2 mt-4">
            <h4 className="text-sm font-semibold text-muted-foreground px-2">
              Referenced Reflections
            </h4>
            <div className="space-y-3">
              {referencedReflections.map((reflection) => (
                <ReflectionClip key={reflection.id} reflection={reflection} />
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground px-2">
          {format(timestamp, 'h:mm a')}
        </p>
      </div>
    </div>
  );
}
