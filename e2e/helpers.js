import { expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Test helper functions for PWA testing
 */
export class PWATestHelpers {
  constructor(page) {
    this.page = page;
  }

  /**
   * Wait for CLI to be ready
   */
  async waitForCLI() {
    await this.page.waitForSelector('.cli-container', { timeout: 10000 });
    await this.page.waitForSelector('.cli-input', { timeout: 5000 });
    await expect(this.page.locator('.cli-input')).toBeVisible();
  }

  /**
   * Execute CLI command and wait for result
   */
  async executeCommand(command, expectedText = null) {
    await this.page.fill('.cli-input', command);
    await this.page.press('.cli-input', 'Enter');
    
    // Wait for processing to complete
    try {
      await this.page.waitForSelector('.cli-line.processing', { state: 'detached', timeout: 10000 });
    } catch (e) {
      // Processing selector might not exist, continue
    }
    
    if (expectedText) {
      // Wait a bit for mode switching to complete
      await this.page.waitForTimeout(200);
      
      // Only check history if we're still in CLI mode
      if (await this.page.locator('.cli-history').count() > 0) {
        await expect(this.page.locator('.cli-history')).toContainText(expectedText);
      }
    }
  }

  /**
   * Setup test configuration
   */
  async setupConfig() {
    const configPath = path.join(process.cwd(), 'e2e', 'test-config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    await this.executeCommand('/config');
    
    // Wait for config overlay
    await this.page.waitForSelector('.config-overlay', { timeout: 5000 });
    
    // Fill in configuration
    await this.page.fill('input[placeholder*="ghp_"]', config.githubToken);
    await this.page.fill('input[placeholder*="sk-"]', config.openaiKey);
    await this.page.fill('input[placeholder*="username"]', config.owner);
    await this.page.fill('input[placeholder*="repository"]', config.repo);
    await this.page.selectOption('select', config.model);
    
    // Save configuration
    await this.page.click('button:text("Save")');
    
    // Wait for overlay to close
    await this.page.waitForSelector('.config-overlay', { state: 'hidden', timeout: 5000 });
  }

  /**
   * Switch to editor mode and verify
   */
  async switchToEditor() {
    await this.executeCommand('/editor', 'Switched to editor mode');
    await this.page.waitForSelector('.editor-container', { timeout: 5000 });
    await expect(this.page.locator('.editor-container')).toBeVisible();
  }

  /**
   * Switch to CLI mode and verify
   */
  async switchToCLI() {
    await this.page.click('.mode-btn');
    await this.page.waitForSelector('.cli-container', { timeout: 5000 });
    await expect(this.page.locator('.cli-container')).toBeVisible();
  }

  /**
   * Switch to Tool mode and verify
   */
  async switchToTool() {
    await this.executeCommand('/tool', 'Switched to tool mode');
    await this.page.waitForSelector('.tool-container', { timeout: 5000 });
    await expect(this.page.locator('.tool-container')).toBeVisible();
  }

  /**
   * Clear CLI history
   */
  async clearHistory() {
    await this.executeCommand('/clear');
    const historyItems = await this.page.locator('.cli-line').count();
    expect(historyItems).toBe(0);
  }

  /**
   * Verify PWA features
   */
  async verifyPWAFeatures() {
    // Check for service worker registration
    const hasServiceWorker = await this.page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    expect(hasServiceWorker).toBe(true);

    // Check manifest
    const manifestLink = this.page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute('href', '/manifest.webmanifest');
  }

  /**
   * Test mobile responsiveness
   */
  async testMobileResponsiveness() {
    // Set mobile viewport
    await this.page.setViewportSize({ width: 375, height: 667 });
    
    // Test touch interactions
    await this.page.tap('.cli-input');
    await expect(this.page.locator('.cli-input')).toBeFocused();
    
    // Test mobile UI elements
    await expect(this.page.locator('.cli-container')).toBeVisible();
    
    // Restore desktop viewport
    await this.page.setViewportSize({ width: 1280, height: 720 });
  }

  /**
   * Mock WebSocket server for testing
   */
  async mockWebSocketServer() {
    await this.page.addInitScript(() => {
      // Mock WebSocket for testing
      window.originalWebSocket = window.WebSocket;
      window.WebSocket = class MockWebSocket {
        constructor(url) {
          this.url = url;
          this.readyState = 0; // CONNECTING
          setTimeout(() => {
            this.readyState = 1; // OPEN
            if (this.onopen) this.onopen();
          }, 100);
        }
        
        send(data) {
          // Mock successful send
          setTimeout(() => {
            if (this.onmessage) {
              const mockResponse = {
                data: JSON.stringify({
                  type: 'status',
                  data: 'Mock server response',
                  timestamp: Date.now()
                })
              };
              this.onmessage(mockResponse);
            }
          }, 50);
        }
        
        close() {
          this.readyState = 3; // CLOSED
          if (this.onclose) this.onclose();
        }
      };
    });
  }

  /**
   * Create test file content
   */
  createTestFileContent(fileType = 'text') {
    switch (fileType) {
      case 'text':
        return 'This is a test file for Playwright testing.\nSecond line with content.';
      case 'chinese':
        return '这是一个中文测试文件\nThis is a Chinese test file\n中英文混合内容';
      case 'javascript':
        return 'function testFunction() {\n  console.log("Hello World");\n  return true;\n}';
      case 'markdown':
        return '# Test Markdown\n\n## Section\n\n- List item 1\n- List item 2\n\n**Bold text**';
      default:
        return 'Default test content';
    }
  }

  /**
   * Wait for network idle (useful for API calls)
   */
  async waitForNetworkIdle() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Take screenshot with timestamp
   */
  async takeTimestampedScreenshot(name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await this.page.screenshot({ 
      path: `e2e/screenshots/${name}-${timestamp}.png`,
      fullPage: true 
    });
  }
}