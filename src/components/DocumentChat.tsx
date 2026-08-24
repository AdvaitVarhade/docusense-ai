'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  User,
  RotateCcw,
  Square,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ChatMessage } from '@/domain/models/summary';
import { toast } from 'sonner';

export interface DocumentChatProps {
  documentText: string;
  documentName?: string;
  className?: string;
}

const QUICK_PROMPTS = [
  'What are the primary risks and limitations?',
  'Summarize the core quantitative metrics and formulas.',
  'What are the key actionable recommendations?',
  'Explain the methodology in simple terms.',
];

export function DocumentChat({ documentText, documentName = 'Document', className = '' }: DocumentChatProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [currentStreamText, setCurrentStreamText] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, currentStreamText, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query) return;

    if (!documentText || documentText.trim().length === 0) {
      toast.error('No document text loaded to query.');
      return;
    }

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsStreaming(true);
    setCurrentStreamText('');

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText,
          question: query,
          history: messages,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Chat request failed with status ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body stream missing.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        const lines = chunkText.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') break;

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.chunk) {
                accumulated += parsed.chunk;
                setCurrentStreamText(accumulated);
              }
            } catch {
              // Ignore partial JSON
            }
          }
        }
      }

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: accumulated || 'No response generated.',
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') {
        console.error('[DocumentChat] Query error:', err);
        toast.error('Failed to answer question. Please try again.');
      }
    } finally {
      setIsStreaming(false);
      setCurrentStreamText('');
      abortControllerRef.current = null;
    }
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setCurrentStreamText('');
  };

  return (
    <div className={`w-full rounded-3xl border border-border/80 bg-card/70 backdrop-blur-md shadow-sm transition-all overflow-hidden ${className}`}>
      {/* Header Bar */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full p-4 md:p-5 flex items-center justify-between bg-card/80 hover:bg-muted/40 transition-colors text-left cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-2xs">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-foreground tracking-tight">Ask DocuSense (Interactive Q&A)</h4>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 uppercase tracking-wider shadow-2xs">
                Live Chat
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Query clauses, verify metrics, or ask follow-up questions directly on {documentName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-muted border border-border/60 text-muted-foreground font-mono">
              {messages.length} messages
            </span>
          )}
          <div className="p-1 rounded-xl bg-muted/60 text-muted-foreground">
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </button>

      {/* Expanded Chat Drawer */}
      {isOpen && (
        <div className="border-t border-border/60 p-4 md:p-5 space-y-4 bg-muted/20 animate-in slide-in-from-top-2 duration-200">
          {/* Quick Suggestion Chips (when chat is empty) */}
          {messages.length === 0 && !isStreaming && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                Quick Questions
              </span>
              <div className="flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(prompt)}
                    className="text-xs px-3.5 py-2 rounded-xl bg-card border border-border/80 text-foreground hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all text-left cursor-pointer shadow-2xs font-medium"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message Stream Scroll Area */}
          <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 text-xs leading-relaxed ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="h-7 w-7 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`p-3.5 rounded-2xl max-w-[85%] ${
                    msg.role === 'user'
                      ? 'bg-emerald-600 text-white font-medium rounded-tr-xs shadow-xs'
                      : 'bg-card border border-border/80 text-foreground rounded-tl-xs shadow-xs'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div className="prose prose-xs dark:prose-invert max-w-none space-y-1">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="h-7 w-7 rounded-xl bg-muted text-muted-foreground border border-border/80 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {/* Currently Streaming Message Bubble */}
            {isStreaming && currentStreamText && (
              <div className="flex gap-3 text-xs leading-relaxed justify-start">
                <div className="h-7 w-7 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Bot className="h-4 w-4 animate-spin" />
                </div>
                <div className="p-3.5 rounded-2xl max-w-[85%] bg-card border border-border/80 text-foreground rounded-tl-xs shadow-xs space-y-1">
                  <div className="prose prose-xs dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentStreamText}</ReactMarkdown>
                  </div>
                  <span className="inline-block w-2 h-3.5 bg-indigo-500 animate-pulse rounded-xs" />
                </div>
              </div>
            )}

            {/* Thinking / Waiting Dots */}
            {isStreaming && !currentStreamText && (
              <div className="flex gap-3 items-center text-xs text-muted-foreground">
                <div className="h-7 w-7 rounded-xl bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="p-3 rounded-2xl bg-card border border-border/80 text-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input & Control Bar */}
          <div className="space-y-2 pt-2 border-t border-border/60">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask a question about the document clauses, data, or findings..."
                disabled={isStreaming}
                className="flex-1 px-4 py-2.5 rounded-2xl bg-card border border-border/80 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all shadow-xs"
              />

              {isStreaming ? (
                <button
                  type="button"
                  onClick={handleStopStreaming}
                  className="px-3.5 py-2.5 rounded-2xl bg-destructive text-destructive-foreground text-xs font-semibold hover:bg-destructive/90 transition-all cursor-pointer shadow-xs flex items-center gap-1"
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5 disabled:cursor-not-allowed"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Ask</span>
                </button>
              )}
            </form>

            {/* Clear Chat Action */}
            {messages.length > 0 && !isStreaming && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleClearChat}
                  className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Clear conversation</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
