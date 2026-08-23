import path from "path";
import fs from "fs";
import {
  generateSyntheticPdfBuffer,
  generateValidPngBuffer,
  generateValidJpegBuffer,
  generateValidWebpBuffer,
  generateEmptyBuffer,
  generateCorruptedPdfBuffer,
  generateOversizedBuffer,
  generateUnsupportedBuffer,
  SAMPLE_ACADEMIC_RESEARCH_TEXT,
  SAMPLE_BUSINESS_PROPOSAL_TEXT,
} from "./fixture-generator";

export const FIXTURES_DIR = __dirname;

export const FIXTURE_PATHS = {
  sampleDigitalPdf: path.join(FIXTURES_DIR, "sample-digital.pdf"),
  sampleMultipagePdf: path.join(FIXTURES_DIR, "sample-multipage.pdf"),
  samplePng: path.join(FIXTURES_DIR, "sample-image.png"),
  sampleJpeg: path.join(FIXTURES_DIR, "sample-scanned.jpg"),
  sampleWebp: path.join(FIXTURES_DIR, "sample-image.webp"),
  emptyFilePdf: path.join(FIXTURES_DIR, "empty-file.pdf"),
  corruptedPdf: path.join(FIXTURES_DIR, "corrupted-file.pdf"),
  unsupportedExe: path.join(FIXTURES_DIR, "unsupported-file.exe"),
  realProjectPdf: path.join(process.cwd(), "Copy of Document Summary Assistant- Assignment 3 (5) (1) (1).pdf"),
};

/**
 * Initializes and materializes static binary fixtures on disk if they don't already exist.
 */
export function ensureFixturesMaterialized(): void {
  if (!fs.existsSync(FIXTURES_DIR)) {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });
  }

  if (!fs.existsSync(FIXTURE_PATHS.sampleDigitalPdf)) {
    fs.writeFileSync(FIXTURE_PATHS.sampleDigitalPdf, generateSyntheticPdfBuffer("DocuSense AI Digital PDF Extraction Test Payload."));
  }

  if (!fs.existsSync(FIXTURE_PATHS.sampleMultipagePdf)) {
    fs.writeFileSync(FIXTURE_PATHS.sampleMultipagePdf, generateSyntheticPdfBuffer(SAMPLE_ACADEMIC_RESEARCH_TEXT));
  }

  if (!fs.existsSync(FIXTURE_PATHS.samplePng)) {
    fs.writeFileSync(FIXTURE_PATHS.samplePng, generateValidPngBuffer());
  }

  if (!fs.existsSync(FIXTURE_PATHS.sampleJpeg)) {
    fs.writeFileSync(FIXTURE_PATHS.sampleJpeg, generateValidJpegBuffer());
  }

  if (!fs.existsSync(FIXTURE_PATHS.sampleWebp)) {
    fs.writeFileSync(FIXTURE_PATHS.sampleWebp, generateValidWebpBuffer());
  }

  if (!fs.existsSync(FIXTURE_PATHS.emptyFilePdf)) {
    fs.writeFileSync(FIXTURE_PATHS.emptyFilePdf, generateEmptyBuffer());
  }

  if (!fs.existsSync(FIXTURE_PATHS.corruptedPdf)) {
    fs.writeFileSync(FIXTURE_PATHS.corruptedPdf, generateCorruptedPdfBuffer());
  }

  if (!fs.existsSync(FIXTURE_PATHS.unsupportedExe)) {
    fs.writeFileSync(FIXTURE_PATHS.unsupportedExe, generateUnsupportedBuffer());
  }
}

export * from "./fixture-generator";
