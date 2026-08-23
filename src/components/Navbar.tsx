'use client';

import React from 'react';
import {
  BrainCircuit,
  RotateCcw,
  Moon,
  Sun,
  FileCheck,
} from 'lucide-react';
import { useTheme } from 'next-themes';

export interface NavbarProps {
  onResetAll?: () => void;
  hasActiveDocument?: boolean;
}

export function Navbar({ onResetAll, hasActiveDocument = false }: NavbarProps) {
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
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-tr from-primary to-primary/70 text-primary-foreground shadow-md shadow-primary/20">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
                DocuSense AI
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-primary/10 text-primary border border-primary/20">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              Intelligent Document Summary & Critique Assistant
            </p>
          </div>
        </div>

        {/* Status Indicator & Header Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Pipeline Status Pill */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Multi-Tier OCR Active</span>
          </div>

          {/* Reset App State Trigger (if document loaded) */}
          {hasActiveDocument && onResetAll && (
            <button
              onClick={onResetAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Reset current session"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New Analysis</span>
            </button>
          )}

          {/* Theme Toggle Button */}
          {mounted && (
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Toggle color theme"
              title="Toggle theme"
            >
              {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          )}

          {/* Docs / PRD Badge */}
          <a
            href="/docs/prd/PRD-Document-Summary-Assistant.md"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <FileCheck className="h-3.5 w-3.5" />
            <span>PRD</span>
          </a>
        </div>
      </div>
    </header>
  );
}
