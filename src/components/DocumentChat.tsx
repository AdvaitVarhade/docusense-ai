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
  X,
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
    <div className={`w-full rounded-2xl border border-border bg-card shadow-sm transition-all overflow-hidden ${className}`}>
      {/* Header Bar */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full p-4 flex items-center justify-between bg-card hover:bg-muted/40 transition-colors text-left cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-foreground">Ask DocuSense (Interactive Q&A)</h4>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 uppercase tracking-wider">
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
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
              {messages.length} messages
            </span>
          )}
          {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Expanded Chat Drawer */}
      {isOpen && (
        <div className="border-t border-border p-4 space-y-4 bg-muted/20 animate-in slide-in-from-top-2 duration-200">
          {/* Quick Suggestion Chips (when chat is empty) */}
          {messages.length === 0 && !isStreaming && (
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Quick Questions
              </span>
              <div className="flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(prompt)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-card border border-border text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all text-left cursor-pointer shadow-2xs"
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
                  <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`p-3 rounded-xl max-w-[85%] ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground font-medium rounded-tr-xs'
                      : 'bg-card border border-border text-foreground rounded-tl-xs shadow-xs'
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
                  <div className="h-7 w-7 rounded-lg bg-muted text-muted-foreground border border-border flex items-center justify-center shrink-0 mt-0.5">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {/* Currently Streaming Message Bubble */}
            {isStreaming && currentStreamText && (
              <div className="flex gap-3 text-xs leading-relaxed justify-start">
                <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="p-3 rounded-xl max-w-[85%] bg-card border border-border text-foreground rounded-tl-xs shadow-xs space-y-1">
                  <div className="prose prose-xs dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentStreamText}</ReactMarkdown>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-primary animate-pulse pt-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>Streaming response...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input & Action Bar */}
          <div className="space-y-2 pt-2 border-t border-border">
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
                className="flex-1 px-3.5 py-2 rounded-xl bg-card border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />

              {isStreaming ? (
                <button
                  type="button"
                  onClick={handleStopStreaming}
                  className="px-3 py-2 rounded-xl bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                  Stop
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  Ask
                </button>
              )}
            </form>

            {messages.length > 0 && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleClearChat}
                  className="text-[11px] text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                  Clear conversation
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
