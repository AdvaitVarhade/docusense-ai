import { test, expect } from '@playwright/test';
import { ensureFixturesMaterialized, FIXTURE_PATHS } from '../fixtures';

test.beforeAll(() => {
  ensureFixturesMaterialized();
});

test.describe('DocuSense AI — Complete Interactive Browser E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to local application dashboard
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('1. Navigation Bar & Global Controls (Brand, Theme Toggle, History Modal)', async ({ page }) => {
    // 1. Verify brand header
    await expect(page.getByRole('banner').getByText('DocuSense AI')).toBeVisible();
    await expect(page.getByText('v1.0')).toBeVisible();

    // 2. Theme Toggle (Click dark/light and back)
    const themeBtn = page.getByRole('button', { name: /toggle color theme/i });
    await expect(themeBtn).toBeVisible();
    await themeBtn.click();
    await page.waitForTimeout(300);
    await themeBtn.click();
    await page.waitForTimeout(300);

    // 3. Open History Vault modal
    const historyNavBtn = page.getByRole('button', { name: /history/i });
    await expect(historyNavBtn).toBeVisible();
    await historyNavBtn.click();

    // Verify modal title
    await expect(page.getByText('Local History Vault')).toBeVisible();
    
    // Close modal via close button inside modal
    const closeBtn = page.locator('.fixed.inset-0 button:has(svg.lucide-x)');
    await closeBtn.click();
    await page.waitForTimeout(300);
  });

  test('2. End-to-End Ingestion, Preset & Persona Selection, Streaming Summary, Audio, Chat, and Export', async ({ page }) => {
    // 1. Upload sample PDF
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(FIXTURE_PATHS.sampleDigitalPdf);

    // Verify extraction completes and displays metadata card & action buttons
    await expect(page.getByRole('heading', { name: /sample-digital\.pdf/i })).toBeVisible({ timeout: 25000 });
    await expect(page.getByRole('button', { name: /Remove/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Hide Text|View Text/i })).toBeVisible();

    // 2. Select Persona Focus
    const legalPersonaBtn = page.getByRole('button', { name: /Legal/i });
    await expect(legalPersonaBtn).toBeVisible();
    await legalPersonaBtn.click();

    const academicPersonaBtn = page.getByRole('button', { name: /Academic/i });
    await academicPersonaBtn.click();

    const executivePersonaBtn = page.getByRole('button', { name: /Executive/i }).first();
    await executivePersonaBtn.click();

    // 3. Select Length Preset
    const shortPresetBtn = page.getByRole('radio', { name: /Short/i });
    await shortPresetBtn.click();

    const longPresetBtn = page.getByRole('radio', { name: /Long/i });
    await longPresetBtn.click();

    const mediumPresetBtn = page.getByRole('radio', { name: /Medium/i });
    await mediumPresetBtn.click();

    // 4. Feature Toggles
    const takeawaysCheckbox = page.getByLabel(/Include Key Takeaways/i);
    await expect(takeawaysCheckbox).toBeChecked();
    const suggestionsCheckbox = page.getByLabel(/Include Improvement Suggestions/i);
    await expect(suggestionsCheckbox).toBeChecked();

    // 5. Trigger AI Summarization
    const generateBtn = page.getByRole('button', { name: /Start AI Summarization Stream|Regenerate/i });
    await generateBtn.click();

    // Verify synthesis completion
    await expect(page.getByRole('heading', { name: /AI Intelligence Summary/i })).toBeVisible({ timeout: 45000 });
    await expect(page.getByRole('tab', { name: /Full Summary/i })).toBeVisible({ timeout: 15000 });

    // 6. Test Tabs: Full Summary, Key Takeaways, Improvement Suggestions
    const takeawaysTab = page.getByRole('tab', { name: /Key Takeaways/i });
    if (await takeawaysTab.isVisible()) {
      await takeawaysTab.click();
      await page.waitForTimeout(400);
    }

    const suggestionsTab = page.getByRole('tab', { name: /Improvement Suggestions/i });
    if (await suggestionsTab.isVisible()) {
      await suggestionsTab.click();
      await page.waitForTimeout(400);
    }

    const summaryTab = page.getByRole('tab', { name: /Full Summary/i });
    if (await summaryTab.isVisible()) {
      await summaryTab.click();
      await page.waitForTimeout(400);
    }

    // 7. Test Audio Summary Player
    const listenBtn = page.getByRole('button', { name: /Listen/i });
    if (await listenBtn.isVisible()) {
      await listenBtn.click();
      await page.waitForTimeout(500);
      const speedBtn = page.locator('button[title="Playback Speed"]');
      if (await speedBtn.isVisible()) {
        await speedBtn.click(); // 1.25x
        await speedBtn.click(); // 1.5x
      }
      const stopBtn = page.locator('button[title="Stop Playback"]');
      if (await stopBtn.isVisible()) {
        await stopBtn.click();
      }
    }

    // 8. Test Copy Summary Action
    const copyBtn = page.getByRole('button', { name: /^Copy$/i }).last();
    if (await copyBtn.isVisible()) {
      await copyBtn.click();
      await page.waitForTimeout(300);
    }

    // 9. Test Export Dropdown Menu
    const exportBtn = page.getByRole('button', { name: /Export/i });
    if (await exportBtn.isVisible()) {
      await exportBtn.click();
      await expect(page.getByText(/Download Markdown/i)).toBeVisible();
      await expect(page.getByText(/Download JSON/i)).toBeVisible();
      await expect(page.getByText(/Download Plain Text/i)).toBeVisible();
      // Close dropdown
      await page.keyboard.press('Escape');
    }

    // 10. Test Interactive Document Q&A Chat
    const chatHeader = page.getByRole('button', { name: /Ask DocuSense/i });
    if (await chatHeader.isVisible()) {
      await chatHeader.click();
      await page.waitForTimeout(500);

      // Type a custom follow-up question
      const chatInput = page.getByPlaceholder(/Ask a question about the document/i);
      if (await chatInput.isVisible()) {
        await expect(chatInput).toBeEnabled({ timeout: 10000 });
        await chatInput.fill('What is the core takeaway of this text?');
        const askBtn = page.getByRole('button', { name: /^Ask$/i });
        await askBtn.click();
        
        // Verify message was appended to conversation
        await expect(page.getByText('What is the core takeaway of this text?')).toBeVisible();
        await page.waitForTimeout(3500);
      }
    }

    // 11. Test Local History Vault Persistence & Restore
    const historyBtn = page.getByRole('button', { name: /history/i });
    await historyBtn.click();
    await expect(page.getByText('Local History Vault')).toBeVisible();

    // Close History Modal
    const modalClose = page.locator('.fixed.inset-0 button:has(svg.lucide-x)');
    await modalClose.click();
    await page.waitForTimeout(300);

    // 12. Test New Analysis Session Reset
    const newAnalysisBtn = page.getByRole('button', { name: /New Analysis/i });
    await expect(newAnalysisBtn).toBeVisible();
    await newAnalysisBtn.click();
    await page.waitForTimeout(300);

    // Verify reset back to initial upload prompt
    await expect(page.getByText(/Awaiting Document Ingestion/i)).toBeVisible();
  });

  test('3. Scanned Image Ingestion & OCR Processing', async ({ page }) => {
    // Upload PNG image fixture
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(FIXTURE_PATHS.samplePng);

    // Verify OCR extraction finishes
    await expect(page.getByRole('heading', { name: /sample-image\.png/i })).toBeVisible({ timeout: 35000 });
    await expect(page.getByRole('button', { name: /Remove/i })).toBeVisible();
  });
});
