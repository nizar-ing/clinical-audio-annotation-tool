import { test, expect } from '@playwright/test';
import { getAnnotatableId } from './helpers.js';

const VIEWPORTS = [
  { label: 'mobile',  width: 375,  height: 812 },
  { label: 'tablet',  width: 768,  height: 1024 },
  { label: 'desktop', width: 1280, height: 800 },
];

for (const vp of VIEWPORTS) {
  test.describe(`responsive – ${vp.label} (${vp.width}×${vp.height})`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test('queue page: no horizontal overflow, nav and content visible', async ({ page }) => {
      await page.goto('/queue');

      await expect(page.locator('nav')).toBeVisible();
      await expect(page.locator('.nav-pill').first()).toBeVisible();
      await expect(page.locator('h1').filter({ hasText: 'Annotation Queue' })).toBeVisible();

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(overflow, `horizontal overflow on queue page at ${vp.width}px`).toBe(false);
    });

    test('ingest page: no horizontal overflow, all sections visible', async ({ page }) => {
      await page.goto('/ingest');

      await expect(page.locator('h1').filter({ hasText: 'Ingest Recordings' })).toBeVisible();
      await expect(page.locator('h2').filter({ hasText: 'Upload Audio' })).toBeVisible();
      await expect(page.locator('h2').filter({ hasText: 'Import Transcripts' })).toBeVisible();
      await expect(page.locator('h2').filter({ hasText: 'Pairing Review' })).toBeVisible();

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(overflow, `horizontal overflow on ingest page at ${vp.width}px`).toBe(false);
    });

    test('workspace page: no horizontal overflow, nav and back button visible', async ({ page }) => {
      const id = await getAnnotatableId(page);
      await page.goto(`/annotate/${id}`);

      await expect(page.locator('nav')).toBeVisible();
      await expect(page.locator('button').filter({ hasText: 'Queue' }).first()).toBeVisible();

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(overflow, `horizontal overflow on workspace page at ${vp.width}px`).toBe(false);
    });

    // On mobile the nav pill label is hidden; on sm+ it is visible.
    test('nav pill label visibility matches breakpoint', async ({ page }) => {
      await page.goto('/queue');

      const label = page.locator('.nav-pill-label').first();
      await expect(label).toBeAttached();

      if (vp.width < 640) {
        await expect(label).toBeHidden();
      } else {
        await expect(label).toBeVisible();
      }
    });

    // Queue table hides secondary columns on narrow viewports.
    test('queue table column visibility matches breakpoint', async ({ page }) => {
      await page.goto('/queue');

      const durationHeader = page.locator('th').filter({ hasText: 'Duration' });
      const annotatorHeader = page.locator('th').filter({ hasText: 'Annotator' });

      if (vp.width < 640) {
        await expect(durationHeader).toBeHidden();
      } else {
        await expect(durationHeader).toBeVisible();
      }

      if (vp.width < 1024) {
        await expect(annotatorHeader).toBeHidden();
      } else {
        await expect(annotatorHeader).toBeVisible();
      }
    });
  });
}
