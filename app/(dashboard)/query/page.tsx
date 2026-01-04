'use client';

import { AudioChatInterface } from '@/components/query/AudioChatInterface';

export default function QueryPage() {
  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <div className="text-center space-y-2 mb-6 flex-shrink-0">
        <h1 className="text-4xl font-bold">Ask Your Past Self</h1>
        <p className="text-muted-foreground">
          Record your question and hear what your past self would say.
        </p>
      </div>

      <AudioChatInterface />
    </div>
  );
}
