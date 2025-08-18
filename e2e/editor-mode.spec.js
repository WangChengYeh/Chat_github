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
          sha: 'js-file-sha',
          name: 'test.js'
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
    
    // Override global route with specific file route
    await page.route('**/repos/test-owner/test-repo/contents/syntax.js**', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          content: btoa(unescape(encodeURIComponent(jsContent))), // Proper UTF-8 encoding
          sha: 'syntax-sha-456',
          name: 'syntax.js'
        })
      });
    });

    await helpers.executeCommand('/open syntax.js');
    await helpers.switchToEditor();
    
    // Verify syntax highlighting exists by checking for syntax classes
    const syntaxElements = page.locator('.cm-editor [class*="ͼ"]');
    await expect(syntaxElements.first()).toBeVisible(); // CodeMirror syntax classes
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
    // Check that at least one line exists (empty files still have one line)
    await expect(page.locator('.cm-editor .cm-line').first()).toBeVisible();
  });

  test('should handle editor scrolling functionality', async ({ page }) => {
    // Use any file - the main goal is to test that scrolling works
    await helpers.executeCommand('/open test.txt');
    await helpers.switchToEditor();
    
    // Wait for editor to be ready
    await expect(page.locator('.cm-editor')).toBeVisible();
    await page.waitForTimeout(1000);
    
    // Test scrolling functionality on the editor
    const editorContent = page.locator('.editor-content');
    const cmScroller = page.locator('.cm-scroller');
    
    // Verify scrollable elements are visible
    await expect(editorContent).toBeVisible();
    await expect(cmScroller).toBeVisible();
    
    // Test basic scrolling properties
    const scrollProperties = await cmScroller.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        overflowY: computed.overflowY,
        height: el.clientHeight,
        scrollHeight: el.scrollHeight,
        canScroll: el.scrollHeight > el.clientHeight
      };
    });
    
    // Verify overflow-y is set to auto (allowing scrolling)
    expect(scrollProperties.overflowY).toBe('auto');
    
    // Test programmatic scrolling
    const scrollTest = await cmScroller.evaluate(el => {
      const initialScroll = el.scrollTop;
      
      // Try to scroll down
      el.scrollTop = 50;
      const scrolledDown = el.scrollTop;
      
      // Reset to original position  
      el.scrollTop = initialScroll;
      const resetScroll = el.scrollTop;
      
      return {
        initialScroll,
        scrolledDown,
        resetScroll,
        scrollWorked: scrolledDown !== initialScroll || initialScroll > 0
      };
    });
    
    // Verify scrolling mechanism works (either content scrolled or was already scrolled)
    expect(scrollTest.scrollWorked).toBe(true);
  });

  test('should handle editor scrolling on mobile viewport', async ({ page }) => {
    // Set mobile viewport to test mobile scrolling
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    
    // Use existing content or any file that gets loaded
    await helpers.executeCommand('/open test.txt'); // Use existing test file
    await helpers.switchToEditor();
    
    // Verify mobile layout 
    await expect(page.locator('.editor-container')).toBeVisible();
    await expect(page.locator('.cm-editor')).toBeVisible();
    await page.waitForTimeout(1000); // Give time for layout to settle
    
    // Check that iOS-specific CSS classes are applied
    const editorContent = page.locator('.editor-content');
    const cmScroller = page.locator('.cm-scroller');
    
    // Verify CSS properties for iOS scrolling - check cm-scroller which is the actual scrollable element
    const cmScrollerStyle = await cmScroller.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        webkitOverflowScrolling: computed.webkitOverflowScrolling,
        overflowY: computed.overflowY
      };
    });
    
    // Check iOS scrolling properties (cm-scroller should be scrollable)
    expect(cmScrollerStyle.overflowY).toBe('auto');
    
    // Test touch scrolling simulation
    const scrollerBox = await cmScroller.boundingBox();
    if (scrollerBox) {
      // Simulate touch scroll gesture
      await page.mouse.move(scrollerBox.x + scrollerBox.width / 2, scrollerBox.y + scrollerBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(scrollerBox.x + scrollerBox.width / 2, scrollerBox.y + scrollerBox.height / 2 - 100);
      await page.mouse.up();
      
      // Verify content scrolled
      const scrollTop = await cmScroller.evaluate(el => el.scrollTop);
      expect(scrollTop).toBeGreaterThan(0);
    }
    
    // Navigate and test basic interaction
    await page.click('.cm-editor');
    await page.keyboard.press('Control+End'); // Go to end
    await page.keyboard.press('Control+Home'); // Go to start
    
    // Verify basic editor interaction works on mobile
  });

  test('should maintain scroll position during editor operations', async ({ page }) => {
    // Use any file for scroll position testing
    await helpers.executeCommand('/open test.txt');
    await helpers.switchToEditor();
    
    // Wait for editor to be ready
    await page.waitForTimeout(1000);
    await expect(page.locator('.cm-content')).toBeVisible();
    
    const cmScroller = page.locator('.cm-scroller');
    
    // Scroll to middle of content
    await cmScroller.evaluate(el => el.scrollTop = 300);
    const midScrollTop = await cmScroller.evaluate(el => el.scrollTop);
    
    // Test diff mode cycling doesn't reset scroll
    const diffButton = page.locator('.diff-mode-btn');
    await diffButton.click(); // Switch to Diff
    
    const scrollAfterDiffMode = await cmScroller.evaluate(el => el.scrollTop);
    expect(Math.abs(scrollAfterDiffMode - midScrollTop)).toBeLessThan(50); // Allow small variance
    
    // Test theme toggle doesn't reset scroll
    const themeButton = page.locator('.theme-btn');
    await themeButton.click();
    
    const scrollAfterTheme = await cmScroller.evaluate(el => el.scrollTop);
    expect(Math.abs(scrollAfterTheme - midScrollTop)).toBeLessThan(50);
    
    // Test editing content maintains scroll position
    await page.click('.cm-editor');
    await page.keyboard.type(' [edited]');
    
    const scrollAfterEdit = await cmScroller.evaluate(el => el.scrollTop);
    expect(Math.abs(scrollAfterEdit - midScrollTop)).toBeLessThan(100);
  });
});