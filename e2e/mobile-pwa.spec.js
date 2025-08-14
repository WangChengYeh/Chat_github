import { test, expect, devices } from '@playwright/test';
import { PWATestHelpers } from './helpers.js';

test.describe('Mobile PWA Features', () => {
  // Only run on mobile browsers or browsers with touch support
  test.describe.configure({ mode: 'parallel' });
  let helpers;

  test.beforeEach(async ({ page }) => {
    helpers = new PWATestHelpers(page);
    await page.goto('/');
    await helpers.waitForCLI();
  });

  test('should load and function on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verify app loads correctly on mobile
    await expect(page.locator('.app')).toBeVisible();
    await expect(page.locator('.cli-container')).toBeVisible();
    await expect(page.locator('.cli-input')).toBeVisible();
    
    // Test mobile interactions
    const hasTouch = await page.evaluate(() => 'ontouchstart' in window);
    if (hasTouch) {
      await page.tap('.cli-input');
    } else {
      await page.click('.cli-input');
    }
    await expect(page.locator('.cli-input')).toBeFocused();
  });

  test('should handle touch interactions in CLI mode', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Test tap to focus input
    const hasTouch = await page.evaluate(() => 'ontouchstart' in window);
    if (hasTouch) {
      await page.tap('.cli-input');
    } else {
      await page.click('.cli-input');
    }
    await expect(page.locator('.cli-input')).toBeFocused();
    
    // Test scrolling in history
    await helpers.executeCommand('/help');
    
    const history = page.locator('.cli-history');
    await expect(history).toBeVisible();
    
    // Test touch scroll (simulate)
    await history.hover();
    await page.mouse.wheel(0, 100);
  });

  test('should handle mobile editor mode', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await helpers.executeCommand('/editor');
    
    // Verify editor is mobile-responsive
    await expect(page.locator('.editor-container')).toBeVisible();
    await expect(page.locator('.editor-status-bar')).toBeVisible();
    
    // Test touch interactions in editor
    const hasTouch = await page.evaluate(() => 'ontouchstart' in window);
    if (hasTouch) {
      await page.tap('.cm-editor');
    } else {
      await page.click('.cm-editor');
    }
    await page.keyboard.type('Mobile test input');
    
    await expect(page.locator('.cm-editor')).toContainText('Mobile test input');
  });

  test('should handle mobile tool mode', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await helpers.executeCommand('/tool');
    
    // Verify tool mode is mobile-responsive
    await expect(page.locator('.tool-container')).toBeVisible();
    await expect(page.locator('.tool-header')).toBeVisible();
    
    // Test mobile mode switching
    const hasTouch = await page.evaluate(() => 'ontouchstart' in window);
    const webSocketMainButton = page.locator('.tool-buttons button:text("WebSocket")').first();
    if (hasTouch) {
      await webSocketMainButton.tap();
    } else {
      await webSocketMainButton.click();
    }
    await expect(webSocketMainButton).toHaveClass(/active/);
  });

  test('should handle PWA manifest', async ({ page }) => {
    // Check manifest link exists
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toBeVisible();
    
    // Fetch and verify manifest
    const manifestResponse = await page.request.get('/manifest.webmanifest');
    expect(manifestResponse.status()).toBe(200);
    
    const manifest = await manifestResponse.json();
    expect(manifest.name).toBe('Chat GitHub');
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.start_url).toBeTruthy();
    expect(manifest.display).toBeTruthy();
    expect(manifest.theme_color).toBeTruthy();
    expect(manifest.background_color).toBeTruthy();
    expect(manifest.icons).toBeTruthy();
  });

  test('should support service worker registration', async ({ page }) => {
    const swRegistered = await page.evaluate(async () => {
      return 'serviceWorker' in navigator;
    });
    
    expect(swRegistered).toBe(true);
    
    // Wait for service worker to register
    await page.waitForFunction(() => {
      return navigator.serviceWorker.ready;
    }, { timeout: 10000 });
  });

  test('should handle Chinese input on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Test Chinese characters in CLI
    const hasTouch = await page.evaluate(() => 'ontouchstart' in window);
    if (hasTouch) {
      await page.tap('.cli-input');
    } else {
      await page.click('.cli-input');
    }
    await page.keyboard.type('/new 中文测试.md');
    await page.keyboard.press('Enter');
    
    await expect(page.locator('.cli-history')).toContainText('中文测试.md');
    
    // Test in editor mode
    await helpers.executeCommand('/editor');
    const hasTouch2 = await page.evaluate(() => 'ontouchstart' in window);
    if (hasTouch2) {
      await page.tap('.cm-editor');
    } else {
      await page.click('.cm-editor');
    }
    await page.keyboard.type('这是中文测试内容');
    
    await expect(page.locator('.cm-editor')).toContainText('这是中文测试内容');
  });

  test('should handle mobile file picker interaction', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await helpers.setupConfig();
    
    // Go to tool mode
    await helpers.executeCommand('/tool');
    
    // Test mobile file picker
    const fileChooserPromise = page.waitForEvent('filechooser');
    const hasTouch = await page.evaluate(() => 'ontouchstart' in window);
    if (hasTouch) {
      await page.tap('.file-input');
    } else {
      await page.click('.file-input');
    }
    const fileChooser = await fileChooserPromise;
    
    expect(fileChooser).toBeTruthy();
  });

  test('should maintain functionality across orientation changes', async ({ page }) => {
    // Start in portrait
    await page.setViewportSize({ width: 375, height: 667 });
    
    await helpers.executeCommand('/help');
    await expect(page.locator('.cli-history')).toContainText('Available commands');
    
    // Switch to landscape
    await page.setViewportSize({ width: 667, height: 375 });
    
    // Verify app still works
    await expect(page.locator('.cli-container')).toBeVisible();
    await helpers.executeCommand('/editor');
    await expect(page.locator('.editor-container')).toBeVisible();
  });

  test('should handle mobile keyboard interactions', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Test virtual keyboard doesn't break layout
    const hasTouch = await page.evaluate(() => 'ontouchstart' in window);
    if (hasTouch) {
      await page.tap('.cli-input');
    } else {
      await page.click('.cli-input');
    }
    await page.keyboard.type('test command');
    
    await expect(page.locator('.cli-input')).toHaveValue('test command');
    
    // Test enter key
    await page.keyboard.press('Enter');
    await expect(page.locator('.cli-history')).toContainText('Unknown command: test');
  });

  test('should be installable as PWA', async ({ page }) => {
    // Check for PWA installation criteria
    const hasManifest = await page.locator('link[rel="manifest"]').count();
    expect(hasManifest).toBeGreaterThan(0);
    
    // Check for HTTPS (in production) or localhost
    const url = page.url();
    expect(url.startsWith('https://') || url.startsWith('http://localhost')).toBe(true);
    
    // Check for service worker
    const hasServiceWorker = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    expect(hasServiceWorker).toBe(true);
  });

  test('should handle offline capability', async ({ page, context }) => {
    // First load the page normally
    await expect(page.locator('.cli-container')).toBeVisible();
    
    // Go offline
    await context.setOffline(true);
    
    // Reload page - should still work from service worker cache
    await page.reload({ waitUntil: 'networkidle' });
    
    // Verify app still loads offline
    await expect(page.locator('.app')).toBeVisible();
    await expect(page.locator('.cli-container')).toBeVisible();
    
    // Go back online
    await context.setOffline(false);
  });
});