'use client';

import { useEffect, useState } from 'react';
import { ReflectionTimeline } from '@/components/reflections/ReflectionTimeline';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { Reflection } from '@/types';
import Link from 'next/link';

export default function TimelinePage() {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReflections();
  }, []);

  const fetchReflections = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/reflections/list');

      if (!response.ok) {
        throw new Error('Failed to fetch reflections');
      }

      const data = await response.json();
      setReflections(data.reflections);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load reflections');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-red-500">{error}</p>
        <Button onClick={fetchReflections}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold">Your Timeline</h1>
          <p className="text-muted-foreground">
            {reflections.length === 0
              ? 'No reflections yet'
              : `${reflections.length} reflection${
                  reflections.length === 1 ? '' : 's'
                }`}
          </p>
        </div>
        <Link href="/record">
          <Button>Record New Reflection</Button>
        </Link>
      </div>

      {reflections.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <p className="text-lg text-muted-foreground">
            No reflections yet. Start recording your first one!
          </p>
          <Link href="/record">
            <Button size="lg">Record Your First Reflection</Button>
          </Link>
        </div>
      ) : (
        <ReflectionTimeline reflections={reflections} />
      )}
    </div>
  );
}
