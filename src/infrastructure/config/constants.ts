/**
 * src/infrastructure/config/constants.ts
 * Application-wide constants, limits, and presets.
 */

export const APP_CONSTANTS = {
  NAME: 'DocuSense AI',
  VERSION: '1.0.0',
  DESCRIPTION: 'Intelligent Document Summary & Critique Assistant',
  MAX_FILE_SIZE_BYTES: 25 * 1024 * 1024, // 25MB
  SUPPORTED_MIME_TYPES: [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/tiff',
    'text/plain',
    'text/markdown',
  ] as const,
  SUPPORTED_EXTENSIONS: ['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.tiff', '.txt', '.md'] as const,
  DEFAULT_LANGUAGE: 'eng',
  SUMMARY_PRESETS: {
    short: {
      label: 'Short',
      targetWords: 150,
      description: 'Quick TL;DR executive summary with main thesis',
    },
    medium: {
      label: 'Medium',
      targetWords: 400,
      description: 'Balanced synthesis with structured takeaways',
    },
    long: {
      label: 'Long',
      targetWords: 900,
      description: 'In-depth comprehensive breakdown and nuanced critique',
    },
  } as const,
};
