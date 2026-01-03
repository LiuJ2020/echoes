'use client';

import { ReflectionCard } from './ReflectionCard';
import type { Reflection } from '@/types';

interface ReflectionTimelineProps {
  reflections: Reflection[];
}

export function ReflectionTimeline({ reflections }: ReflectionTimelineProps) {
  if (reflections.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-lg text-muted-foreground">
          No reflections yet. Start recording your first one!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reflections.map((reflection) => (
        <div key={reflection.id} className="relative">
          {/* Timeline line */}
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-border" />

          {/* Timeline dot */}
          <div className="absolute left-0 top-6 w-0.5 h-0.5">
            <div className="relative -left-1.5 w-3 h-3 rounded-full bg-primary" />
          </div>

          {/* Content */}
          <div className="ml-8">
            <ReflectionCard reflection={reflection} />
          </div>
        </div>
      ))}
    </div>
  );
}
