'use client';

import React, { useState, useRef, useCallback } from 'react';
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
          className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 cursor-pointer ${
            isDragOver
              ? 'border-primary bg-primary/5 scale-[1.01] shadow-lg'
              : 'border-border bg-card/50 hover:border-primary/50 hover:bg-card/80'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${
            isExtracting ? 'cursor-wait border-primary/40 bg-muted/30' : ''
          }`}
        >
          {isExtracting ? (
            /* Uploading / Extracting Spinner & Multi-stage Progress */
            <div className="w-full max-w-md space-y-4 py-4">
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="font-semibold text-lg text-foreground">Processing Document...</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden border border-border">
                <div
                  className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span className="font-medium">{progressStatus}</span>
                <span className="font-mono font-semibold">{progress}%</span>
              </div>

              {selectedFile && (
                <p className="text-xs text-muted-foreground font-mono truncate">
                  {selectedFile.name} ({formatBytes(selectedFile.size)})
                </p>
              )}
            </div>
          ) : (
            /* Idle Dropzone Call to Action */
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 rounded-full bg-primary/10 text-primary border border-primary/20 shadow-sm transition-transform hover:scale-105">
                <UploadCloud className="h-10 w-10" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-base md:text-lg text-foreground">
                  Drag & drop your document here, or <span className="text-primary underline">browse</span>
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Supports Digital PDFs, Scanned PDFs, Images (PNG, JPG, WEBP), and Plain Text
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] text-muted-foreground">
                <span className="px-2.5 py-1 rounded-full bg-muted border border-border">Max: 25 MB</span>
                <span className="px-2.5 py-1 rounded-full bg-muted border border-border">Fast In-Memory Extraction</span>
                <span className="px-2.5 py-1 rounded-full bg-muted border border-border">Multi-Tier OCR</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* State 2: Error Alert Banner */}
      {errorMessage && (
        <div className="flex items-start justify-between rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive animate-in fade-in duration-200">
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
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors shadow-sm"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Retry
              </button>
            )}
            <button
              onClick={() => setErrorMessage(null)}
              className="p-1 rounded-md hover:bg-destructive/20 transition-colors"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* State 3: Extraction Result Card & Metadata Inspection */}
      {extractionResult && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5 animate-in fade-in duration-300">
          {/* Header Row: File Identity & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                {selectedFile?.type.includes('image') || metadata?.mimeType.includes('image') ? (
                  <ImageIcon className="h-6 w-6" />
                ) : (
                  <FileText className="h-6 w-6" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-base text-foreground leading-tight">
                  {(metadata as any)?.filename || (metadata as any)?.name || selectedFile?.name || 'Document'}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {formatBytes((metadata as any)?.sizeBytes || (metadata as any)?.size || selectedFile?.size || 0)}
                  </span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground uppercase font-mono">
                    {(metadata as any)?.mimeType?.split('/').pop() || 'PDF'}
                  </span>
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${getEngineBadgeClass(
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {showPreview ? 'Hide Text' : 'View Text'}
              </button>
              <button
                onClick={handleCopyText}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-destructive/30 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Remove
              </button>
            </div>
          </div>

          {/* Stats Badges Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-muted/40 border border-border p-3 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <FileCode className="h-3 w-3" /> Words
              </span>
              <p className="text-xl font-bold text-foreground">{wordCount.toLocaleString()}</p>
            </div>

            <div className="rounded-xl bg-muted/40 border border-border p-3 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Layers className="h-3 w-3" /> Characters
              </span>
              <p className="text-xl font-bold text-foreground">{characterCount.toLocaleString()}</p>
            </div>

            <div className="rounded-xl bg-muted/40 border border-border p-3 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Clock className="h-3 w-3" /> Reading Time
              </span>
              <p className="text-xl font-bold text-foreground">~{readingTime} min</p>
            </div>

            <div className="rounded-xl bg-muted/40 border border-border p-3 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Pages
              </span>
              <p className="text-xl font-bold text-foreground">
                {pageCount ? `${pageCount} pgs` : '1 doc'}
              </p>
            </div>
          </div>

          {/* Collapsible Text Preview */}
          {showPreview && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                <span>Extracted Plain Text Preview</span>
                <span>{extractionResult.text.length.toLocaleString()} characters</span>
              </div>
              <div className="relative rounded-xl border border-border bg-muted/30 p-4 max-h-64 overflow-y-auto font-mono text-xs leading-relaxed text-foreground whitespace-pre-wrap select-text">
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
