import { test, expect } from '@playwright/test';
import { getAnnotatableId } from './helpers.js';

/**
 * Verify that the span annotation workflow is functional:
 *   - Selecting text in the corrected pane opens SpanPopover
 *   - Each annotation type form renders the correct input fields
 *   - Text inputs (value, normalized, note) accept user input
 *   - Submitting a form closes the popover
 *
 * SpanPopover is teleported to <body> and appears only when frozenAnchorRect is
 * non-null (set when the selection fires useSpanSelection). Once a form type is
 * chosen, the popover freezes its position so that focusing form inputs (which
 * triggers selectionchange and clears correctedEl's selection) does not close it.
 *
 * Form labels use CSS text-transform:uppercase, so Chrome's accessibility tree
 * reports names as "VALUE", "UNIT", etc. — getByLabel('Value') would fail.
 * Use specific CSS attribute selectors (input[type="number"], select, etc.) instead.
 */
test.describe('Span annotation with text inputs', () => {
  let workspaceId: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    workspaceId = await getAnnotatableId(page);
    await page.close();
  });

  async function openWorkspaceAndSelectText(page: Parameters<typeof test>[1]) {
    await page.goto(`/annotate/${workspaceId}`);
    // Wait for the corrected pane to render
    const correctedPane = page.locator('[contenteditable="plaintext-only"]');
    await correctedPane.waitFor({ timeout: 15_000 });

    // Click to focus the pane then Ctrl+A to select all text.
    // This fires a selectionchange event that useSpanSelection picks up,
    // which eventually sets frozenAnchorRect on SpanPopover making it visible.
    await correctedPane.click();
    await page.keyboard.press('Control+a');
  }

  test('selecting text in the corrected pane opens the annotation popover', async ({ page }) => {
    await openWorkspaceAndSelectText(page);
    await expect(page.locator('[role="dialog"][aria-label="Annotate span"]')).toBeVisible({
      timeout: 5_000,
    });
  });

  test('MEASUREMENT form — number input, unit selector, and live normalisation preview', async ({
    page,
  }) => {
    await openWorkspaceAndSelectText(page);

    const popover = page.locator('[role="dialog"][aria-label="Annotate span"]');
    await popover.waitFor({ timeout: 5_000 });

    // Open the Measurement form (hotkey 2, or button click)
    await popover.getByRole('button', { name: /Measurement/i }).click();

    // Value — the only number input in MeasurementForm.
    // (Labels use CSS text-transform:uppercase, making getByLabel unreliable.)
    const valueInput = popover.locator('input[type="number"]');
    await expect(valueInput).toBeVisible();
    await valueInput.fill('1500');

    // Unit — the only <select> in MeasurementForm; verify medical units
    const unitSelect = popover.locator('select');
    await expect(unitSelect).toBeVisible();
    await expect(unitSelect.locator('option[value="mg"]')).toBeAttached();
    await expect(unitSelect.locator('option[value="mmHg"]')).toBeAttached();
    await expect(unitSelect.locator('option[value="IE"]')).toBeAttached();
    await unitSelect.selectOption('mg');

    // Live normalisation preview: 1500 mg → 1.5 g
    await expect(popover.locator('p').filter({ hasText: /Normalised:/ })).toContainText('1.5 g', {
      timeout: 2_000,
    });

    // Submit — scope to popover to avoid any other "Save span" buttons
    await popover.getByRole('button', { name: 'Save span' }).click();
    await expect(popover).not.toBeVisible({ timeout: 5_000 });
  });

  test('NUMBER form — rendering selector and normalised text input', async ({ page }) => {
    await openWorkspaceAndSelectText(page);

    const popover = page.locator('[role="dialog"][aria-label="Annotate span"]');
    await popover.waitFor({ timeout: 5_000 });

    // The popover's @keydown handler only fires when the popover (or a child)
    // holds focus.  Focus it explicitly before pressing the hotkey.
    await popover.focus();
    await page.keyboard.press('3');

    // Rendering selector (digits / words / mixed) — the only <select> in NumberForm
    const renderingSelect = popover.locator('select');
    await expect(renderingSelect).toBeVisible();
    await expect(renderingSelect.locator('option[value="words"]')).toBeAttached();
    await expect(renderingSelect.locator('option[value="digits"]')).toBeAttached();
    await renderingSelect.selectOption('words');

    // Normalised — the only text input in NumberForm
    const normalisedInput = popover.locator('input[type="text"]');
    await expect(normalisedInput).toBeVisible();
    await normalisedInput.fill('6/0');
    await expect(normalisedInput).toHaveValue('6/0');

    await popover.getByRole('button', { name: 'Save span' }).click();
    await expect(popover).not.toBeVisible({ timeout: 5_000 });
  });

  test('MEDICAL_TERM form — category selector and optional note text input', async ({ page }) => {
    await openWorkspaceAndSelectText(page);

    const popover = page.locator('[role="dialog"][aria-label="Annotate span"]');
    await popover.waitFor({ timeout: 5_000 });

    await popover.getByRole('button', { name: /Medical term/i }).click();

    // Category selector — the only <select> in MedicalTermForm
    const categorySelect = popover.locator('select');
    await expect(categorySelect).toBeVisible();
    await expect(categorySelect.locator('option[value="drug"]')).toBeAttached();
    await expect(categorySelect.locator('option[value="anatomy"]')).toBeAttached();
    await categorySelect.selectOption('drug');

    // Note — the only text input in MedicalTermForm
    const noteInput = popover.locator('input[type="text"]');
    await expect(noteInput).toBeVisible();
    await noteInput.fill('antibiotic agent');
    await expect(noteInput).toHaveValue('antibiotic agent');

    await popover.getByRole('button', { name: 'Save span' }).click();
    await expect(popover).not.toBeVisible({ timeout: 5_000 });
  });

  test('Escape key closes the popover without saving', async ({ page }) => {
    await openWorkspaceAndSelectText(page);

    const popover = page.locator('[role="dialog"][aria-label="Annotate span"]');
    await popover.waitFor({ timeout: 5_000 });

    // The @keydown handler lives on the popover div; focus it before sending Escape.
    await popover.focus();
    await page.keyboard.press('Escape');

    await expect(popover).not.toBeVisible({ timeout: 3_000 });
  });
});
