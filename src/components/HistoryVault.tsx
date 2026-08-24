'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  Trash2,
  ExternalLink,
  FileText,
  X,
  Calendar,
  Search,
} from 'lucide-react';
import { HistoryEntry } from '@/domain/models/history';
import { toast } from 'sonner';

export interface HistoryVaultProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreEntry: (entry: HistoryEntry) => void;
}

const STORAGE_KEY = 'docusense_history_vault_v1';

export class HistoryStorage {
  public static getEntries(): HistoryEntry[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static save(entry: {
    filename: string;
    documentText?: string;
    summaryMarkdown: string;
    preset: string;
    persona?: string;
    keyPoints?: any[];
    suggestions?: any[];
    metadata?: any;
  }): HistoryEntry {
    const fallback: HistoryEntry = {
      id: '',
      documentName: entry.filename,
      documentText: entry.documentText || '',
      documentMeta: entry.metadata || {},
      summaryMarkdown: entry.summaryMarkdown,
      preset: entry.preset as any,
      persona: entry.persona as any,
      keyPoints: entry.keyPoints || [],
      suggestions: entry.suggestions || [],
      createdAt: '',
    };
    if (typeof window === 'undefined') return fallback;
    try {
      const existing = this.getEntries();
      const newEntry: HistoryEntry = {
        id: `hist-${Date.now()}`,
        documentName: entry.filename,
        documentText: entry.documentText || '',
        documentMeta: entry.metadata || {},
        summaryMarkdown: entry.summaryMarkdown,
        preset: entry.preset as any,
        persona: entry.persona as any,
        keyPoints: entry.keyPoints || [],
        suggestions: entry.suggestions || [],
        createdAt: new Date().toISOString(),
      };
      // Keep up to 20 recent documents
      const updated = [newEntry, ...existing.filter((e) => e.documentName !== entry.filename)].slice(0, 20);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return newEntry;
    } catch (e) {
      console.warn('[HistoryVault] Save failed:', e);
      return fallback;
    }
  }

  public static deleteEntry(id: string): void {
    if (typeof window === 'undefined') return;
    try {
      const existing = this.getEntries();
      const updated = existing.filter((e) => e.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('[HistoryVault] Delete failed:', e);
    }
  }

  public static clearAll(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function HistoryVault({ isOpen, onClose, onRestoreEntry }: HistoryVaultProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const reloadEntries = () => {
    setEntries(HistoryStorage.getEntries());
  };

  useEffect(() => {
    if (isOpen) {
      reloadEntries();
      setSearchQuery('');
    }
  }, [isOpen]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    HistoryStorage.deleteEntry(id);
    reloadEntries();
    toast.success('Document analysis removed from History Vault.');
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear your local analysis history?')) {
      HistoryStorage.clearAll();
      reloadEntries();
      toast.success('History Vault cleared.');
    }
  };

  const handleRestore = (entry: HistoryEntry) => {
    onRestoreEntry(entry);
    onClose();
    toast.success(`Restored analysis for "${entry.documentName}".`);
  };

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase();
    return entries.filter(
      (e) =>
        e.documentName.toLowerCase().includes(q) ||
        e.summaryMarkdown.toLowerCase().includes(q) ||
        (e.persona && e.persona.toLowerCase().includes(q)) ||
        e.preset.toLowerCase().includes(q)
    );
  }, [entries, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] rounded-3xl border border-border/80 bg-card/95 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-border/60 flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground tracking-tight">Local History Vault</h3>
              <p className="text-xs text-muted-foreground">
                Client-side encrypted history of recently analyzed documents
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {entries.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="px-3 py-1 rounded-xl text-xs font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
              >
                Clear All
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Search Input Filter */}
        {entries.length > 0 && (
          <div className="p-4 border-b border-border/60 bg-muted/10">
            <div className="relative flex items-center">
              <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search history by document title or content keywords..."
                className="w-full pl-9 pr-8 py-2 rounded-2xl bg-card border border-border/80 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 text-muted-foreground hover:text-foreground text-xs"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Entry List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {filteredEntries.length === 0 ? (
            <div className="py-14 text-center space-y-3">
              <div className="p-4 w-fit mx-auto rounded-3xl bg-muted/60 text-muted-foreground">
                <History className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-sm text-foreground">
                  {searchQuery ? 'No Matching Summaries Found' : 'No Document Analyses Saved Yet'}
                </p>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  {searchQuery
                    ? 'Try searching with a different filename or keyword.'
                    : 'When you generate a document summary, it is automatically cached here for offline access.'}
                </p>
              </div>
            </div>
          ) : (
            filteredEntries.map((entry) => (
              <div
                key={entry.id}
                onClick={() => handleRestore(entry)}
                className="group p-4.5 rounded-2xl border border-border/80 bg-card/80 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all flex items-start justify-between gap-4 cursor-pointer shadow-2xs"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-emerald-500 shrink-0" />
                    <h4 className="font-bold text-sm text-foreground truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {entry.documentName}
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-wider shrink-0 shadow-2xs">
                      {entry.preset}
                    </span>
                    {entry.persona && entry.persona !== 'general' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 uppercase tracking-wider shrink-0 shadow-2xs">
                        {entry.persona}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {entry.summaryMarkdown.replace(/#+\s+/g, '').slice(0, 140)}...
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1 font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(entry.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span>•</span>
                    <span>{entry.keyPoints?.length || 0} takeaways</span>
                    <span>•</span>
                    <span>{entry.suggestions?.length || 0} critiques</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-1">
                  <button
                    type="button"
                    onClick={(e) => handleDelete(entry.id, e)}
                    title="Delete Entry"
                    className="p-1.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    Restore <ExternalLink className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/60 bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
          <span>{entries.length} stored documents in browser vault</span>
          <span>Privacy: Zero server disk persistence</span>
        </div>
      </div>
    </div>
  );
}
