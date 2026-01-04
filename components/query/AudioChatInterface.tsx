'use client';

import { useState, useRef, useEffect } from 'react';
import { UserMessage, AssistantMessage } from './ChatMessage';
import { ChatVoiceRecorder } from './ChatVoiceRecorder';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { ChatMessage } from '@/types';

type ProcessingStage = 'transcribing' | 'thinking' | 'synthesizing';

export function AudioChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<ProcessingStage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const generateId = () => Math.random().toString(36).substring(7);

  const handleRecordingComplete = async (audioBlob: Blob, duration: number) => {
    setIsProcessing(true);
    setError(null);
    setProcessingStage('transcribing');

    try {
      // Create FormData with audio
      const formData = new FormData();
      formData.append('audio', audioBlob, 'query.webm');
      formData.append('duration', duration.toString());

      // Call API
      setProcessingStage('thinking');
      const response = await fetch('/api/query/audio', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process query');
      }

      const data = await response.json();

      setProcessingStage('synthesizing');

      // Add user message
      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: data.queryTranscript,
        timestamp: new Date(),
      };

      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: '', // No text content - audio only
        audioUrl: data.responseAudioUrl,
        referencedReflections: data.referencedReflections,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
    } catch (err) {
      console.error('Query error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to process your question. Please try again.'
      );
    } finally {
      setIsProcessing(false);
      setProcessingStage(null);
    }
  };

  const getProcessingMessage = () => {
    switch (processingStage) {
      case 'transcribing':
        return 'Transcribing your question...';
      case 'thinking':
        return 'Searching your reflections...';
      case 'synthesizing':
        return 'Creating voice response...';
      default:
        return 'Processing...';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && !isProcessing && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg mb-2">Start a conversation</p>
            <p className="text-sm">
              Record a question to search through your reflections and hear what
              your past self would say.
            </p>
          </div>
        )}

        {messages.map((message) =>
          message.role === 'user' ? (
            <UserMessage
              key={message.id}
              content={message.content}
              timestamp={message.timestamp}
            />
          ) : (
            <AssistantMessage
              key={message.id}
              audioUrl={message.audioUrl!}
              referencedReflections={message.referencedReflections || []}
              timestamp={message.timestamp}
            />
          )
        )}

        {/* Processing indicator */}
        {isProcessing && (
          <div className="flex justify-center py-6">
            <Card className="px-6 py-4 bg-muted/50">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  {getProcessingMessage()}
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="flex justify-center py-4">
            <Card className="px-6 py-4 bg-destructive/10 border-destructive">
              <p className="text-sm text-destructive">{error}</p>
            </Card>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Recording input - fixed at bottom */}
      <div className="border-t bg-background px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <ChatVoiceRecorder
            onRecordingComplete={handleRecordingComplete}
            disabled={isProcessing}
          />
        </div>
      </div>
    </div>
  );
}
