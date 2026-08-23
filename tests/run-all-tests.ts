/**
 * TypeScript Test Runner Entrypoint for DocuSense AI
 */
import "./fixtures";
import "./e2e/extraction.test";
import "./e2e/summarization.test";
import "./e2e/export.test";
import "./e2e/workflow.test";
import "./e2e/git_and_docs.test";

export const SUITE_MANIFEST = {
  suites: [
    "tests/e2e/extraction.test.ts",
    "tests/e2e/summarization.test.ts",
    "tests/e2e/export.test.ts",
    "tests/e2e/workflow.test.ts",
    "tests/e2e/git_and_docs.test.ts",
  ],
  fixturesDir: "tests/fixtures",
};
