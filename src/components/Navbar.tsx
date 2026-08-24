'use client';

import React from 'react';
import {
  BrainCircuit,
  RotateCcw,
  Moon,
  Sun,
  History,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useTheme } from 'next-themes';

export interface NavbarProps {
  onResetAll?: () => void;
  onOpenHistory?: () => void;
  hasActiveDocument?: boolean;
}

export function Navbar({ onResetAll, onOpenHistory, hasActiveDocument = false }: NavbarProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    if (resolvedTheme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70 transition-all shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 text-white shadow-md shadow-emerald-500/20 ring-1 ring-white/20 transition-transform hover:scale-105">
            <BrainCircuit className="h-5 w-5" />
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 ring-2 ring-background"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
                DocuSense AI
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground hidden sm:flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-emerald-500" />
              Document Intelligence & Multi-Tier OCR Studio
            </p>
          </div>
        </div>

        {/* Status Indicator & Header Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Pipeline Status Pill */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Multi-Tier OCR Active</span>
          </div>

          {/* History Vault Trigger */}
          {onOpenHistory && (
            <button
              onClick={onOpenHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/80 bg-card/60 hover:bg-muted text-xs font-semibold text-foreground transition-all shadow-2xs cursor-pointer hover:border-primary/40"
              title="Open Local History Vault"
            >
              <History className="h-3.5 w-3.5 text-emerald-500" />
              <span>History</span>
            </button>
          )}

          {/* Reset App State Trigger (if document loaded) */}
          {hasActiveDocument && onResetAll && (
            <button
              onClick={onResetAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 text-xs font-semibold text-destructive transition-all shadow-2xs cursor-pointer"
              title="Reset current session"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>New Analysis</span>
            </button>
          )}

          {/* Theme Toggle Button */}
          {mounted && (
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-border/80 bg-card/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all shadow-2xs cursor-pointer"
              aria-label="Toggle color theme"
              title="Toggle theme"
            >
              {resolvedTheme === 'dark' ? <Sun className="h-4 w-4 text-amber-400 transition-transform rotate-0 hover:rotate-90" /> : <Moon className="h-4 w-4 text-indigo-500 transition-transform rotate-0 hover:-rotate-12" />}
            </button>
          )}

          {/* GitHub Repo Link */}
          <a
            href="https://github.com/AdvaitVarhade/docusense-ai"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/80 bg-card/60 hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-all shadow-2xs"
          >
            <span>GitHub</span>
            <ExternalLink className="h-3 w-3 opacity-60" />
          </a>
        </div>
      </div>
    </header>
  );
}
