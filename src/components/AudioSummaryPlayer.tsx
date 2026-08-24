'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Pause, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export interface AudioSummaryPlayerProps {
  text: string;
  className?: string;
}

export function AudioSummaryPlayer({ text, className = '' }: AudioSummaryPlayerProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSupported(false);
      return;
    }

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      // Prefer natural English voices
      const naturalVoice = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Premium'))
      ) || voices.find((v) => v.lang.startsWith('en')) || voices[0];

      if (naturalVoice) {
        setSelectedVoice(naturalVoice);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const cleanTextForSpeech = (markdown: string): string => {
    return markdown
      .replace(/#+\s+/g, '') // remove headings
      .replace(/[*_`~[\]]/g, '') // remove markdown symbols
      .replace(/<[^>]*>/g, '') // remove HTML
      .replace(/https?:\/\/\S+/g, '') // remove URLs
      .replace(/\|\s*[-:]+\s*\|/g, '') // remove table borders
      .replace(/\|/g, ', ') // replace table pipes with commas
      .trim();
  };

  const handlePlay = () => {
    if (!text || text.trim().length === 0) {
      toast.error('No summary text available to play.');
      return;
    }

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast.error('Speech synthesis is not supported on this browser.');
      return;
    }

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    window.speechSynthesis.cancel();

    const spokenText = cleanTextForSpeech(text);
    const utterance = new SpeechSynthesisUtterance(spokenText);
    utteranceRef.current = utterance;

    utterance.rate = playbackRate;
    utterance.pitch = 1.0;
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = (e) => {
      if (e.error !== 'canceled') {
        console.warn('[AudioSummaryPlayer] Speech error:', e);
      }
      setIsPlaying(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handlePause = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
      setIsPaused(true);
    }
  };

  const handleStop = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  const toggleRate = () => {
    const rates = [1.0, 1.25, 1.5, 2.0];
    const nextIndex = (rates.indexOf(playbackRate) + 1) % rates.length;
    const newRate = rates[nextIndex];
    setPlaybackRate(newRate);

    if (isPlaying) {
      handleStop();
      setTimeout(handlePlay, 100);
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className={`inline-flex items-center gap-1.5 p-1 rounded-2xl bg-card/80 backdrop-blur-md border border-border/80 text-xs shadow-2xs ${className}`}>
      {isPlaying ? (
        <button
          type="button"
          onClick={handlePause}
          title="Pause Audio Briefing"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition-all cursor-pointer shadow-xs"
        >
          <Pause className="h-3.5 w-3.5" />
          <span>Pause</span>
          {/* Animated waveform bars */}
          <span className="flex items-end gap-0.5 h-3.5 ml-0.5">
            <span className="w-0.5 bg-white rounded-full animate-[bounce_0.8s_infinite] h-2"></span>
            <span className="w-0.5 bg-white rounded-full animate-[bounce_0.6s_infinite_0.2s] h-3.5"></span>
            <span className="w-0.5 bg-white rounded-full animate-[bounce_0.9s_infinite_0.4s] h-2.5"></span>
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handlePlay}
          title="Listen to Summary (Web Speech Audio Briefing)"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 font-semibold transition-all cursor-pointer border border-emerald-500/20 shadow-2xs"
        >
          <Volume2 className="h-3.5 w-3.5 text-emerald-500" />
          <span>{isPaused ? 'Resume' : 'Listen'}</span>
        </button>
      )}

      {(isPlaying || isPaused) && (
        <button
          type="button"
          onClick={handleStop}
          title="Stop Playback"
          className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          <VolumeX className="h-3.5 w-3.5" />
        </button>
      )}

      <button
        type="button"
        onClick={toggleRate}
        title="Playback Speed"
        className="px-2 py-1 rounded-xl font-mono text-[11px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer border border-transparent hover:border-border/60"
      >
        {playbackRate}x
      </button>
    </div>
  );
}
