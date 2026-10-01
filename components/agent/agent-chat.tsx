'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Send, Sparkles, User, Bot } from 'lucide-react';
import { chatAgent } from '@/lib/api';
import type { ChatMessage } from '@/types/agent';
import { useGeography } from '@/lib/ward-context';
import { useI18n } from '@/lib/i18n-context';

export default function AgentChat() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q');
  const { geoBreadcrumb } = useGeography();
  const { t } = useI18n();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const scopeLabel = geoBreadcrumb.map((b) => b.name).join(' / ');

  const handleSend = async (messageText?: string) => {
    const text = (messageText ?? input).trim();
    if (!text || loading) return;

    const userMessage: ChatMessage = { role: 'user', content: text };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    if (!messageText) setInput('');
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
          content: 'Unable to reach the civic intelligence assistant. Please ensure your query is formulated clearly or retry shortly.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // If initial query from voice or URL
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      handleSend(initialQuery.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  return (
    <div className="civic-panel flex h-[calc(100vh-14rem)] min-h-[480px] flex-col p-0 overflow-hidden">
      {/* Scope Context Header */}
      <div className="flex items-center justify-between border-b border-[#E8EAED] bg-[#F8FAFC] px-4 py-2.5 text-xs text-[#5F6368]">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-[#1A73E8]" />
          <span>Grounded Database Context: <strong className="text-[#202124]">{scopeLabel}</strong></span>
        </div>
        <span className="rounded bg-[#E8F0FE] px-2 py-0.5 text-[11px] font-semibold text-[#1967D2]">
          Gemini 2.0 Flash
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="py-16 text-center text-xs text-[#5F6368] space-y-3">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#E8F0FE] text-[#1A73E8]">
              <Sparkles size={20} />
            </div>
            <p className="text-sm font-semibold text-[#202124]">
              UrbanMind AI Assistant
            </p>
            <p className="max-w-md mx-auto leading-relaxed">
              Ask about localized water contamination, priority road projects, grievance volume in Chennai or Mumbai, or JJM infrastructure gaps.
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {[
                'Which wards have critical water complaints?',
                'Summarize sanitation infrastructure gaps',
                'What are the top 3 road repair priorities?',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSend(suggestion)}
                  className="rounded-full border border-[#DADCE0] bg-white px-3 py-1 text-[11px] text-[#202124] hover:border-[#1A73E8] hover:bg-[#E8F0FE]"
                >
                  &ldquo;{suggestion}&rdquo;
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, i) => {
          const isUser = message.role === 'user';
          return (
            <div
              key={i}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E8F0FE] text-[#1A73E8]">
                  <Bot size={15} />
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-xl px-4 py-2.5 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-[#1A73E8] text-white'
                    : 'border border-[#E8EAED] bg-[#F8FAFC] text-[#202124]'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
              </div>
              {isUser && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1A73E8] text-white text-xs font-semibold">
                  <User size={14} />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-[#5F6368]">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E8F0FE] text-[#1A73E8]">
              <Bot size={15} />
            </div>
            <span className="animate-pulse">Thinking with grounding data…</span>
          </div>
        )}
      </div>

      {/* Input Row */}
      <div className="border-t border-[#E8EAED] p-3 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about citizen complaints or development priorities…"
            disabled={loading}
            className="flex-1 text-xs"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn-primary"
            aria-label="Send message"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
