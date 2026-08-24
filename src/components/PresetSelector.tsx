'use client';

import React from 'react';
import { SummaryPreset, SummaryPersona } from '@/domain/models/summary';
import {
  Zap,
  Layers,
  BookOpen,
  Check,
  Sparkles,
  Lightbulb,
  Scale,
  DollarSign,
  GraduationCap,
  Briefcase,
  SlidersHorizontal,
} from 'lucide-react';

export interface PresetSelectorProps {
  value: SummaryPreset;
  onChange: (preset: SummaryPreset) => void;
  persona?: SummaryPersona;
  onPersonaChange?: (persona: SummaryPersona) => void;
  disabled?: boolean;
  className?: string;
  extractKeyPoints?: boolean;
  onExtractKeyPointsChange?: (val: boolean) => void;
  extractSuggestions?: boolean;
  onExtractSuggestionsChange?: (val: boolean) => void;
  showToggles?: boolean;
}

interface PresetOption {
  id: SummaryPreset;
  name: string;
  badge: string;
  wordCount: string;
  description: string;
  icon: React.ElementType;
  accentColor: string;
  densityPercent: string;
}

interface PersonaOption {
  id: SummaryPersona;
  label: string;
  sublabel: string;
  icon: React.ElementType;
}

const PRESET_OPTIONS: PresetOption[] = [
  {
    id: 'short',
    name: 'Short',
    badge: '~150 words',
    wordCount: 'TL;DR',
    description: 'Concise bullet points with core thesis & essential takeaways.',
    icon: Zap,
    accentColor: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    densityPercent: 'w-1/4 bg-amber-500',
  },
  {
    id: 'medium',
    name: 'Medium',
    badge: '~400 words',
    wordCount: 'Executive Synthesis',
    description: 'Structured summary covering context, methodology & strategic insights.',
    icon: Layers,
    accentColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    densityPercent: 'w-2/4 bg-emerald-500',
  },
  {
    id: 'long',
    name: 'Long',
    badge: '~900 words',
    wordCount: 'Deep-Dive',
    description: 'Comprehensive analytical breakdown with deep context & risk assessment.',
    icon: BookOpen,
    accentColor: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    densityPercent: 'w-full bg-indigo-500',
  },
];

const PERSONA_OPTIONS: PersonaOption[] = [
  {
    id: 'general',
    label: 'Executive',
    sublabel: 'Strategic & General',
    icon: Briefcase,
  },
  {
    id: 'legal',
    label: 'Legal',
    sublabel: 'Contracts & Liabilities',
    icon: Scale,
  },
  {
    id: 'financial',
    label: 'Financial',
    sublabel: 'Earnings & Quantitative',
    icon: DollarSign,
  },
  {
    id: 'academic',
    label: 'Academic',
    sublabel: 'Research & Methodology',
    icon: GraduationCap,
  },
];

export function PresetSelector({
  value,
  onChange,
  persona = 'general',
  onPersonaChange,
  disabled = false,
  className = '',
  extractKeyPoints = true,
  onExtractKeyPointsChange,
  extractSuggestions = true,
  onExtractSuggestionsChange,
  showToggles = true,
}: PresetSelectorProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Persona Specialization Chips */}
      {onPersonaChange && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
              Domain Persona Focus
            </span>
            <span className="text-[11px] text-muted-foreground">Customized AI analytical lens</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {PERSONA_OPTIONS.map((p) => {
              const isSelected = persona === p.id;
              const Icon = p.icon;

              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => onPersonaChange(p.id)}
                  className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'border-emerald-500/80 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20 shadow-xs font-bold'
                      : 'border-border/80 bg-card/60 text-muted-foreground hover:text-foreground hover:bg-card/90 hover:border-border'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div
                    className={`p-2 rounded-xl shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'bg-muted/80 text-muted-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate">{p.label}</div>
                    <div className="text-[10px] text-muted-foreground truncate leading-tight font-normal">
                      {p.sublabel}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Preset Cards Grid */}
      <div
        role="radiogroup"
        aria-label="Summary length preset selector"
        className="grid grid-cols-1 sm:grid-cols-3 gap-3"
      >
        {PRESET_OPTIONS.map((option) => {
          const isSelected = value === option.id;
          const Icon = option.icon;

          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => onChange(option.id)}
              className={`relative flex flex-col items-start p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer overflow-hidden ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-500/5 ring-2 ring-emerald-500/20 shadow-md shadow-emerald-500/5'
                  : 'border-border/80 bg-card/60 hover:border-emerald-500/40 hover:bg-card/90'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {/* Top Badge & Active Indicator */}
              <div className="w-full flex items-center justify-between gap-2 mb-3">
                <div
                  className={`p-2 rounded-xl border ${
                    isSelected ? option.accentColor : 'text-muted-foreground bg-muted/60 border-border/80'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-muted/80 border border-border/80 text-muted-foreground font-mono">
                    {option.badge}
                  </span>
                  {isSelected && (
                    <div className="p-0.5 rounded-full bg-emerald-500 text-white shadow-2xs">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                  )}
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="space-y-1 w-full">
                <div className="flex items-center gap-1.5">
                  <h4 className={`text-sm font-bold ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                    {option.name}
                  </h4>
                  <span className="text-xs text-muted-foreground font-medium">• {option.wordCount}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {option.description}
                </p>
              </div>

              {/* Density Bar */}
              <div className="w-full bg-muted/60 rounded-full h-1 mt-3 overflow-hidden">
                <div className={`h-1 rounded-full ${option.densityPercent} transition-all duration-300`} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Feature Toggles: Key Takeaways & Improvement Suggestions */}
      {showToggles && (
        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
          {onExtractKeyPointsChange && (
            <label
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border transition-all cursor-pointer select-none shadow-2xs ${
                extractKeyPoints
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold'
                  : 'border-border/80 bg-card/60 text-muted-foreground hover:border-border'
              } ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
            >
              <input
                type="checkbox"
                checked={extractKeyPoints}
                onChange={(e) => onExtractKeyPointsChange(e.target.checked)}
                disabled={disabled}
                className="rounded border-border text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
              />
              <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
              <span>Include Key Takeaways</span>
            </label>
          )}

          {onExtractSuggestionsChange && (
            <label
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border transition-all cursor-pointer select-none shadow-2xs ${
                extractSuggestions
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold'
                  : 'border-border/80 bg-card/60 text-muted-foreground hover:border-border'
              } ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
            >
              <input
                type="checkbox"
                checked={extractSuggestions}
                onChange={(e) => onExtractSuggestionsChange(e.target.checked)}
                disabled={disabled}
                className="rounded border-border text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
              />
              <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
              <span>Include Improvement Suggestions</span>
            </label>
          )}
        </div>
      )}
    </div>
  );
}
