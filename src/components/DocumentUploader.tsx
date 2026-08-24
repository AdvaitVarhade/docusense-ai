'use client';

import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  X,
  RotateCcw,
  Copy,
  Check,
  Eye,
  EyeOff,
  Layers,
  Clock,
  FileCode,
  Sparkles,
  Loader2,
  Search,
  CheckCircle2,
  FileCheck2,
} from 'lucide-react';
import { ExtractionResult } from '@/domain/models/document';
import { toast } from 'sonner';

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'text/plain',
  'text/markdown',
];
const ACCEPTED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.txt', '.md'];

export interface DocumentUploaderProps {
  onExtractionComplete?: (result: ExtractionResult) => void;
  onExtractionStart?: () => void;
  onError?: (error: string) => void;
  onReset?: () => void;
  disabled?: boolean;
  className?: string;
}

export function DocumentUploader({
  onExtractionComplete,
  onExtractionStart,
  onError,
  onReset,
  disabled = false,
  className = '',
}: DocumentUploaderProps) {
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Format bytes helper
  const formatBytes = (bytes: number, decimals = 1): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  // Client-side file validation
  const validateFile = (file: File): string | null => {
    if (!file) return 'No file selected';
    if (file.size === 0) return 'The selected file is empty (0 bytes).';
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `File size exceeds 25 MB limit (${formatBytes(file.size)}).`;
    }

    const fileExtension = '.' + (file.name.split('.').pop()?.toLowerCase() || '');
    const isExtensionValid = ACCEPTED_EXTENSIONS.includes(fileExtension);
    const isMimeValid = ACCEPTED_MIME_TYPES.includes(file.type) || file.type === '';

    if (!isExtensionValid && !isMimeValid) {
      return `Unsupported file format. Supported formats: PDF, PNG, JPG, WEBP, TXT, MD.`;
    }
    return null;
  };

  // Server extraction caller with simulated multi-stage progress
  const processExtraction = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setErrorMessage(validationError);
        onError?.(validationError);
        toast.error(validationError);
        return;
      }

      setSelectedFile(file);
      setIsExtracting(true);
      setErrorMessage(null);
      setProgress(15);
      setProgressStatus('Reading document buffer...');
      onExtractionStart?.();

      abortControllerRef.current = new AbortController();
      const formData = new FormData();
      formData.append('file', file);

      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev < 40) {
            setProgressStatus('Detecting layout & routing to extraction engine...');
            return prev + 15;
          } else if (prev < 80) {
            setProgressStatus('Extracting content and normalizing typography...');
            return prev + 10;
          }
          return prev;
        });
      }, 300);

      try {
        const response = await fetch('/api/extract', {
          method: 'POST',
          body: formData,
          signal: abortControllerRef.current.signal,
        });

        clearInterval(progressInterval);

        if (!response.ok) {
          const errorJson = await response.json().catch(() => ({}));
          const errText =
            typeof errorJson.error === 'string'
              ? errorJson.error
              : errorJson.error?.message || `Extraction failed with status ${response.status}`;
          throw new Error(errText);
        }

        const data: ExtractionResult = await response.json();
        setProgress(100);
        setProgressStatus('Extraction complete!');
        setExtractionResult(data);
        onExtractionComplete?.(data);
        toast.success(
          `Successfully extracted ${(data.metadata?.wordCount || data.meta?.wordCount || 0).toLocaleString()} words from ${file.name}`
        );
      } catch (err: unknown) {
        clearInterval(progressInterval);
        const errObj = err as { name?: string; message?: string };
        if (errObj.name === 'AbortError') {
          setErrorMessage('Extraction cancelled by user.');
          toast.info('Extraction cancelled.');
        } else {
          const msg = errObj.message || 'An unexpected error occurred during extraction.';
          setErrorMessage(msg);
          onError?.(msg);
          toast.error(msg);
        }
      } finally {
        setIsExtracting(false);
        abortControllerRef.current = null;
      }
    },
    [onExtractionComplete, onExtractionStart, onError]
  );

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isExtracting) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled || isExtracting) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processExtraction(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processExtraction(file);
    }
  };

  const handleReset = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setSelectedFile(null);
    setExtractionResult(null);
    setErrorMessage(null);
    setProgress(0);
    setProgressStatus('');
    setIsExtracting(false);
    setSearchQuery('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onReset?.();
  };

  const handleRetry = () => {
    if (selectedFile) {
      processExtraction(selectedFile);
    }
  };

  const handleCopyText = async () => {
    if (!extractionResult?.text) return;
    try {
      await navigator.clipboard.writeText(extractionResult.text);
      setCopied(true);
      toast.success('Extracted text copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy text to clipboard.');
    }
  };

  const getEngineBadgeClass = (engine?: string) => {
    switch (engine) {
      case 'unpdf':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'gemini_vlm':
      case 'gemini-vlm':
        return 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20';
      case 'tesseract':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      default:
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    }
  };

  const metadata = extractionResult?.metadata || extractionResult?.meta;
  const wordCount = metadata?.wordCount || 0;
  const characterCount = metadata?.characterCount || extractionResult?.text?.length || 0;
  const pageCount = metadata?.pageCount || 1;
  const engine = metadata?.extractionEngine || 'unpdf';
  const readingTime = metadata?.readingTimeMinutes || Math.max(1, Math.ceil(wordCount / 200));

  // Search in preview
  const searchMatchesCount = useMemo(() => {
    if (!searchQuery.trim() || !extractionResult?.text) return 0;
    try {
      const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = extractionResult.text.match(regex);
      return matches ? matches.length : 0;
    } catch {
      return 0;
    }
  }, [searchQuery, extractionResult?.text]);

  return (
    <div className={`w-full space-y-4 ${className}`}>
      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled || isExtracting}
        aria-label="Upload document file"
      />

      {/* State 1: Dropzone (Active when no file selected or extracting) */}
      {!extractionResult && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isExtracting && !disabled && fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className={`relative overflow-hidden flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 md:p-10 text-center transition-all duration-300 cursor-pointer ${
            isDragOver
              ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01] shadow-xl shadow-emerald-500/10 ring-4 ring-emerald-500/20'
              : 'border-border/80 bg-card/60 hover:border-emerald-500/50 hover:bg-card/90 shadow-sm'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${
            isExtracting ? 'cursor-wait border-emerald-500/40 bg-card/80' : ''
          }`}
        >
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute inset-0 bg-radial from-emerald-500/5 via-transparent to-transparent pointer-events-none" />

          {isExtracting ? (
            /* Uploading / Extracting Spinner & Multi-stage Progress */
            <div className="relative z-10 w-full max-w-md space-y-5 py-4">
              <div className="flex items-center justify-center gap-3">
                <div className="relative">
                  <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 animate-pulse">
                    <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                  </div>
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-base text-foreground">Processing Document...</h4>
                  <p className="text-xs text-muted-foreground font-mono">{progressStatus}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="w-full bg-muted/80 rounded-full h-2.5 overflow-hidden border border-border/80 p-0.5">
                  <div
                    className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 h-1.5 rounded-full transition-all duration-300 ease-out shadow-xs"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span className="font-medium flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-emerald-500" />
                    In-Memory Pipeline
                  </span>
                  <span className="font-mono font-bold text-foreground">{progress}%</span>
                </div>
              </div>

              {selectedFile && (
                <div className="px-3 py-2 rounded-xl bg-muted/40 border border-border/60 text-xs text-muted-foreground font-mono truncate flex items-center justify-center gap-2">
                  <FileCheck2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate">{selectedFile.name}</span>
                  <span className="shrink-0 text-muted-foreground/70">({formatBytes(selectedFile.size)})</span>
                </div>
              )}
            </div>
          ) : (
            /* Idle Dropzone Call to Action */
            <div className="relative z-10 flex flex-col items-center space-y-4 max-w-lg">
              <div className="relative p-4 rounded-3xl bg-gradient-to-tr from-emerald-500/15 via-teal-500/10 to-cyan-500/5 text-emerald-500 border border-emerald-500/25 shadow-md shadow-emerald-500/10 transition-transform duration-300 hover:scale-110">
                <UploadCloud className="h-10 w-10" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-lg text-foreground tracking-tight">
                  Drag & drop your document here, or <span className="text-emerald-500 underline underline-offset-4 decoration-emerald-500/40 hover:decoration-emerald-500">browse</span>
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                  Fast in-memory parsing for digital PDFs, scanned receipts, contracts, and images
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] font-medium text-muted-foreground">
                <span className="px-3 py-1 rounded-full bg-card border border-border/80 shadow-2xs">PDF, PNG, JPG, WEBP, TXT</span>
                <span className="px-3 py-1 rounded-full bg-card border border-border/80 shadow-2xs">Max: 25 MB</span>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Tri-Tier OCR
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* State 2: Error Alert Banner */}
      {errorMessage && (
        <div className="flex items-start justify-between rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-destructive animate-in fade-in duration-200 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <h4 className="font-semibold text-sm">Extraction Anomaly Detected</h4>
              <p className="text-xs text-destructive/90">{errorMessage}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedFile && (
              <button
                onClick={handleRetry}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors shadow-sm cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Retry
              </button>
            )}
            <button
              onClick={() => setErrorMessage(null)}
              className="p-1 rounded-lg hover:bg-destructive/20 transition-colors cursor-pointer"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* State 3: Extraction Result Card & Metadata Inspection */}
      {extractionResult && (
        <div className="rounded-3xl border border-border/80 bg-card/80 backdrop-blur-md p-6 shadow-sm space-y-5 animate-in fade-in duration-300">
          {/* Header Row: File Identity & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border/60">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs">
                {selectedFile?.type.includes('image') || metadata?.mimeType.includes('image') ? (
                  <ImageIcon className="h-6 w-6" />
                ) : (
                  <FileText className="h-6 w-6" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground leading-tight">
                  {(metadata as any)?.filename || (metadata as any)?.name || selectedFile?.name || 'Document'}
                </h3>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs text-muted-foreground font-mono">
                    {formatBytes((metadata as any)?.sizeBytes || (metadata as any)?.size || selectedFile?.size || 0)}
                  </span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground uppercase font-mono">
                    {(metadata as any)?.mimeType?.split('/').pop() || 'PDF'}
                  </span>
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border shadow-2xs ${getEngineBadgeClass(
                      engine
                    )}`}
                  >
                    Tier: {engine}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/80 bg-card/60 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all shadow-2xs cursor-pointer"
              >
                {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {showPreview ? 'Hide Text' : 'View Text'}
              </button>
              <button
                onClick={handleCopyText}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/80 bg-card/60 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all shadow-2xs cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-destructive/30 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-all shadow-2xs cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
                Remove
              </button>
            </div>
          </div>

          {/* Stats Badges Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-muted/40 border border-border/60 p-3.5 space-y-1 transition-all hover:bg-muted/60">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <FileCode className="h-3.5 w-3.5 text-emerald-500" /> Words
              </span>
              <p className="text-xl font-extrabold text-foreground tracking-tight">{wordCount.toLocaleString()}</p>
            </div>

            <div className="rounded-2xl bg-muted/40 border border-border/60 p-3.5 space-y-1 transition-all hover:bg-muted/60">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-teal-500" /> Characters
              </span>
              <p className="text-xl font-extrabold text-foreground tracking-tight">{characterCount.toLocaleString()}</p>
            </div>

            <div className="rounded-2xl bg-muted/40 border border-border/60 p-3.5 space-y-1 transition-all hover:bg-muted/60">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-cyan-500" /> Reading Time
              </span>
              <p className="text-xl font-extrabold text-foreground tracking-tight">~{readingTime} min</p>
            </div>

            <div className="rounded-2xl bg-muted/40 border border-border/60 p-3.5 space-y-1 transition-all hover:bg-muted/60">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500" /> Pages
              </span>
              <p className="text-xl font-extrabold text-foreground tracking-tight">
                {pageCount ? `${pageCount} pgs` : '1 doc'}
              </p>
            </div>
          </div>

          {/* Collapsible Text Preview with Search Filter */}
          {showPreview && (
            <div className="space-y-2.5 pt-2 border-t border-border/50">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                  <span>Extracted Plain Text Preview</span>
                  <span className="px-2 py-0.5 rounded-full bg-muted text-[11px] font-mono">
                    {extractionResult.text.length.toLocaleString()} characters
                  </span>
                </div>

                {/* Inline Keyword Filter */}
                <div className="relative flex items-center max-w-xs">
                  <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search in text..."
                    className="pl-8 pr-7 py-1 rounded-xl bg-card border border-border/80 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all w-44 focus:w-56"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              {searchQuery && (
                <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 px-1">
                  <span className="font-semibold text-foreground">{searchMatchesCount}</span> matches found for &quot;{searchQuery}&quot;
                </div>
              )}

              <div className="relative rounded-2xl border border-border/80 bg-muted/25 p-4 max-h-64 overflow-y-auto font-mono text-xs leading-relaxed text-foreground whitespace-pre-wrap select-text shadow-inner">
                {extractionResult.text.slice(0, 3000)}
                {extractionResult.text.length > 3000 && (
                  <span className="text-muted-foreground italic block mt-2">
                    ... [Truncated preview: Showing first 3,000 of{' '}
                    {extractionResult.text.length.toLocaleString()} characters]
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
