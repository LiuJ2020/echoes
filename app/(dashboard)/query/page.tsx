'use client';

import { useState } from 'react';
import { QueryInterface } from '@/components/query/QueryInterface';
import { ReflectionResponse } from '@/components/query/ReflectionResponse';
import type { QueryResult } from '@/types';

export default function QueryPage() {
  const [results, setResults] = useState<QueryResult[]>([]);
  const [isQuerying, setIsQuerying] = useState(false);
  const [synthesizedAudios, setSynthesizedAudios] = useState<
    Record<string, string>
  >({});
  const [synthesizingIds, setSynthesizingIds] = useState<Set<string>>(
    new Set()
  );
  const [error, setError] = useState<string | null>(null);

  const handleQuery = async (query: string) => {
    try {
      setIsQuerying(true);
      setError(null);

      const response = await fetch('/api/reflections/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit: 3 }),
      });

      if (!response.ok) {
        throw new Error('Query failed');
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      console.error('Query error:', err);
      setError(err instanceof Error ? err.message : 'Failed to query reflections');
    } finally {
      setIsQuerying(false);
    }
  };

  const handlePlayVoice = async (reflectionId: string) => {
    try {
      setSynthesizingIds((prev) => new Set(prev).add(reflectionId));

      const response = await fetch('/api/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reflectionId }),
      });

      if (!response.ok) {
        throw new Error('Voice synthesis failed');
      }

      const data = await response.json();
      setSynthesizedAudios((prev) => ({
        ...prev,
        [reflectionId]: data.audioUrl,
      }));
    } catch (err) {
      console.error('Synthesis error:', err);
      setError('Failed to generate voice. Using default narrator.');
      // TODO: Could add fallback to default narrator voice here
    } finally {
      setSynthesizingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(reflectionId);
        return newSet;
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">Ask Your Past Self</h1>
        <p className="text-muted-foreground">
          Search through your reflections and hear what your past self would say.
        </p>
      </div>

      <QueryInterface onQuery={handleQuery} isLoading={isQuerying} />

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">
            {results.length} reflection{results.length === 1 ? '' : 's'} found
          </h2>

          {results.map((result) => (
            <ReflectionResponse
              key={result.reflection.id}
              result={result}
              onPlayVoice={handlePlayVoice}
              synthesizedAudio={synthesizedAudios[result.reflection.id]}
              isSynthesizing={synthesizingIds.has(result.reflection.id)}
            />
          ))}
        </div>
      )}

      {!isQuerying && results.length === 0 && !error && (
        <div className="text-center py-12 text-muted-foreground">
          Ask a question to search through your reflections.
        </div>
      )}
    </div>
  );
}
