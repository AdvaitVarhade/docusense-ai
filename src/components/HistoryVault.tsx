'use client';

import React, { useState, useEffect } from 'react';
import {
  History,
  Trash2,
  ExternalLink,
  FileText,
  Clock,
  Sparkles,
  X,
  Download,
  Calendar,
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

  public static saveEntry(entry: Omit<HistoryEntry, 'id' | 'createdAt'>): HistoryEntry {
    if (typeof window === 'undefined') return { ...entry, id: '', createdAt: '' };
    try {
      const existing = this.getEntries();
      const newEntry: HistoryEntry = {
        ...entry,
        id: `hist-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      // Keep up to 20 recent documents
      const updated = [newEntry, ...existing.filter((e) => e.documentName !== entry.documentName)].slice(0, 20);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return newEntry;
    } catch (e) {
      console.warn('[HistoryVault] Save failed:', e);
      return { ...entry, id: '', createdAt: '' };
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

  const reloadEntries = () => {
    setEntries(HistoryStorage.getEntries());
  };

  useEffect(() => {
    if (isOpen) {
      reloadEntries();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">Local History Vault</h3>
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
                className="px-2.5 py-1 rounded-lg text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
              >
                Clear All
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Entry List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {entries.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="p-3 w-fit mx-auto rounded-full bg-muted text-muted-foreground">
                <History className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-sm text-foreground">No Document Analyses Saved Yet</p>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  When you generate a document summary, it is automatically cached here for offline access.
                </p>
              </div>
            </div>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                onClick={() => handleRestore(entry)}
                className="group p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all flex items-start justify-between gap-4 cursor-pointer shadow-2xs"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <h4 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                      {entry.documentName}
                    </h4>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider shrink-0">
                      {entry.preset}
                    </span>
                    {entry.persona && entry.persona !== 'general' && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 uppercase tracking-wider shrink-0">
                        {entry.persona}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {entry.summaryMarkdown.replace(/#+\s+/g, '').slice(0, 140)}...
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1">
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

                <div className="flex items-center gap-1 shrink-0 pt-1">
                  <button
                    type="button"
                    onClick={(e) => handleDelete(entry.id, e)}
                    title="Delete Entry"
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-semibold text-primary group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    Restore <ExternalLink className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
          <span>{entries.length} stored documents in browser vault</span>
          <span>Privacy: Zero server disk persistence</span>
        </div>
      </div>
    </div>
  );
}
