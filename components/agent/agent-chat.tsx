'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { chatAgent } from '@/lib/api';
import type { ChatMessage } from '@/types/agent';
import ChatMessageBubble from '@/components/agent/chat-message';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AgentChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: ChatMessage = { role: 'user', content: text };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await chatAgent(
        text,
        messages.map((m) => ({ role: m.role, content: m.content }))
      );
      setMessages([
        ...nextMessages,
        { role: 'assistant', content: response.content, toolCalls: response.toolCalls },
      ]);
    } catch {
      setMessages([
        ...nextMessages,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col rounded-lg border bg-card">
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <p className="pt-8 text-center text-sm text-muted-foreground">
              Ask me about grievances, trends, wards or categories.
            </p>
          )}
          {messages.map((message, i) => (
            <ChatMessageBubble key={i} message={message} />
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1.5 rounded-lg border bg-muted p-3">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="typing-dot"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 border-t p-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
          placeholder="Type a message…"
          disabled={loading}
        />
        <Button onClick={handleSend} disabled={loading || !input.trim()} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
