'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';

interface QueryInterfaceProps {
  onQuery: (query: string) => void;
  isLoading?: boolean;
}

export function QueryInterface({ onQuery, isLoading = false }: QueryInterfaceProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onQuery(query.trim());
    }
  };

  const suggestedQueries = [
    'What have I learned about productivity?',
    'How did I feel about my career?',
    'What insights did I have about relationships?',
    'What was I grateful for?',
  ];

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Ask Your Past Self</h2>
        <p className="text-muted-foreground">
          Ask a question and hear what your past self would say, in their own voice.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="What do you want to know?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !query.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>

      {!isLoading && query.length === 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            Try asking:
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestedQueries.map((suggested) => (
              <Button
                key={suggested}
                variant="outline"
                size="sm"
                onClick={() => setQuery(suggested)}
                className="text-xs"
              >
                {suggested}
              </Button>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
