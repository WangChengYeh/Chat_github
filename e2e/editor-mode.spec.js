import { test, expect } from '@playwright/test';
import { PWATestHelpers } from './helpers.js';

test.describe('Editor Mode', () => {
  let helpers;

  test.beforeEach(async ({ page }) => {
    helpers = new PWATestHelpers(page);
    await page.goto('/');
    await helpers.waitForCLI();
    await helpers.setupConfig();
  });

  test('should switch to editor mode and display editor interface', async ({ page }) => {
    await helpers.switchToEditor();
    
    // Verify editor components
    await expect(page.locator('.editor-container')).toBeVisible();
    await expect(page.locator('.editor-status-bar')).toBeVisible();
    await expect(page.locator('.editor-content')).toBeVisible();
    await expect(page.locator('.cm-editor')).toBeVisible();
    
    // Verify status bar elements
    await expect(page.locator('.status-left')).toBeVisible();
    await expect(page.locator('.status-center')).toBeVisible();
    await expect(page.locator('.status-right')).toBeVisible();
  });

  test('should handle diff mode cycling', async ({ page }) => {
    const mockContent = helpers.createTestFileContent('text');
    
    await page.route('**/repos/*/contents/test.txt**', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          content: btoa(mockContent),
          sha: 'test-sha'
        })
      });
    });

    // Load a file first
    await helpers.executeCommand('/open test.txt');
    await helpers.switchToEditor();
    
    // Test diff mode button
    const diffButton = page.locator('.diff-mode-btn');
    await expect(diffButton).toContainText('Modified');
    
    // Cycle through modes
    await diffButton.click();
    await expect(diffButton).toContainText('Diff');
    
    await diffButton.click();
    await expect(diffButton).toContainText('Original');
    
    await diffButton.click();
    await expect(diffButton).toContainText('Modified');
  });

  test('should handle theme toggling', async ({ page }) => {
    await helpers.switchToEditor();
    
    const themeButton = page.locator('.theme-btn');
    await expect(themeButton).toBeVisible();
    
    // Toggle theme
    await themeButton.click();
    // Note: Theme changes are visual, hard to test directly
    await expect(themeButton).toBeVisible(); // Just verify it's still there
  });

  test('should show file status information', async ({ page }) => {
    const mockContent = helpers.createTestFileContent('javascript');
    
    await page.route('**/repos/*/contents/test.js**', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          content: btoa(mockContent),
          sha: 'js-file-sha'
        })
      });
    });

    await helpers.executeCommand('/open test.js');
    await helpers.switchToEditor();
    
    // Verify status bar shows file info
    await expect(page.locator('.status-left')).toContainText('main'); // branch
    await expect(page.locator('.path-info')).toContainText('test.js');
  });

  test('should handle text editing and mark as dirty', async ({ page }) => {
    const mockContent = helpers.createTestFileContent('text');
    
    await page.route('**/repos/*/contents/editable.txt**', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          content: btoa(mockContent),
          sha: 'editable-sha'
        })
      });
    });

    await helpers.executeCommand('/open editable.txt');
    await helpers.switchToEditor();
    
    // Edit content in CodeMirror
    await page.click('.cm-editor');
    await page.keyboard.press('End');
    await page.keyboard.type('\nAdded new line');
    
    // Check if marked as dirty (should show *)
    await expect(page.locator('.dirty-flag')).toBeVisible();
    await expect(page.locator('.dirty-flag')).toContainText('*');
  });

  test('should handle Chinese text input and display', async ({ page }) => {
    const chineseContent = helpers.createTestFileContent('chinese');
    
    await page.route('**/repos/*/contents/chinese.md**', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          content: btoa(chineseContent),
          sha: 'chinese-sha'
        })
      });
    });

    await helpers.executeCommand('/open chinese.md');
    await helpers.switchToEditor();
    
    // Verify Chinese text is displayed correctly
    await expect(page.locator('.cm-editor')).toContainText('这是一个中文测试文件');
    await expect(page.locator('.cm-editor')).toContainText('中英文混合内容');
    
    // Test Chinese input
    await page.click('.cm-editor');
    await page.keyboard.press('End');
    await page.keyboard.type('\n添加中文内容');
    
    // Verify Chinese input works
    await expect(page.locator('.cm-editor')).toContainText('添加中文内容');
  });

  test('should handle syntax highlighting for different file types', async ({ page }) => {
    const jsContent = helpers.createTestFileContent('javascript');
    
    await page.route('**/repos/*/contents/syntax.js**', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          content: btoa(jsContent),
          sha: 'syntax-sha'
        })
      });
    });

    await helpers.executeCommand('/open syntax.js');
    await helpers.switchToEditor();
    
    // Verify syntax highlighting elements exist
    await expect(page.locator('.cm-editor .ͼ1')).toBeVisible(); // CodeMirror syntax classes
    await expect(page.locator('.cm-content')).toContainText('function');
    await expect(page.locator('.cm-content')).toContainText('console.log');
  });

  test('should return to CLI mode from editor', async ({ page }) => {
    await helpers.switchToEditor();
    
    // Click CLI mode button
    await page.click('.mode-btn');
    
    // Verify back in CLI mode
    await expect(page.locator('.cli-container')).toBeVisible();
    await expect(page.locator('.cli-input')).toBeVisible();
    await expect(page.locator('.editor-container')).not.toBeVisible();
  });

  test('should handle empty file content', async ({ page }) => {
    await page.route('**/repos/*/contents/empty.txt**', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          content: btoa(''),
          sha: 'empty-sha'
        })
      });
    });

    await helpers.executeCommand('/open empty.txt');
    await helpers.switchToEditor();
    
    // Verify editor handles empty content
    await expect(page.locator('.cm-editor')).toBeVisible();
    await expect(page.locator('.cm-editor .cm-line')).toBeVisible();
  });
});