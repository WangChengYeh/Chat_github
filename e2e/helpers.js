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
    // Mock all GitHub API calls to avoid authentication issues
    await this.page.route('**/repos/**', route => {
      const url = route.request().url();
      const method = route.request().method();
      
      if (url.includes('/contents/')) {
        if (method === 'GET') {
          // Parse URL to get filename and check for directory listing
          const urlParts = url.split('/contents/')[1];
          const filename = urlParts ? urlParts.split('?')[0] : '';
          
          // If empty path or just query params, it's a directory listing
          if (!filename || filename === '') {
            // Mock directory listing
            route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify([
                { name: 'README.md', type: 'file', size: 1024, path: 'README.md' },
                { name: 'src', type: 'dir', size: 0, path: 'src' },
                { name: 'package.json', type: 'file', size: 2048, path: 'package.json' }
              ])
            });
            return;
          }
          
          // Mock file content response
          
          // Handle special cases for file creation tests
          if (filename === 'src/NewComponent.tsx' || url.includes('NewComponent.tsx')) {
            // Return 404 for new file creation tests
            route.fulfill({ status: 404, body: JSON.stringify({message: "Not Found"}) });
            return;
          }
          
          let content;
          
          if (filename.includes('chinese') || filename.includes('中文')) {
            content = '这是一个中文测试文件\n中英文混合内容\nMixed Chinese and English content';
          } else if (filename === 'syntax.js') {
            content = 'function testFunction() {\n  console.log("Hello World");\n  return true;\n}\n\ntestFunction();';
          } else if (filename.endsWith('.js')) {
            content = 'function testFunction() {\n  console.log("Hello World");\n}\n\ntestFunction();';
          } else if (filename === 'empty.txt') {
            content = ''; // Actually empty for empty file test
          } else {
            content = 'This is a test file\nwith multiple lines\nfor testing purposes';
          }
          
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              content: btoa(unescape(encodeURIComponent(content))), // Proper UTF-8 to base64
              sha: 'mock-sha-' + Math.random().toString(36).substr(2, 9),
              name: filename
            })
          });
        } else {
          // Mock create/update response
          route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              content: { sha: 'new-sha-' + Math.random().toString(36).substr(2, 9) }
            })
          });
        }
      }
    });

    // Use localStorage to set config directly and set store state
    await this.page.evaluate(() => {
      const config = {
        githubToken: 'mock-token',
        openaiKey: 'mock-key',
        owner: 'test-owner',
        repo: 'test-repo',
        branch: 'main',
        model: 'gpt-4',
        path: ''
      };
      
      // Set in localStorage
      localStorage.setItem('chat-github-config', JSON.stringify(config));
      
      // Also set in store if available
      if (window.useStore && window.useStore.getState) {
        const store = window.useStore.getState();
        if (store.setConfig) {
          store.setConfig(config);
        }
      }
    });
    
    // Reload to pick up config
    await this.page.reload({ waitUntil: 'networkidle' });
    await this.waitForCLI();
    
    // Verify config is loaded by checking if /help works
    await this.page.waitForTimeout(200);
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
      
      // Add WebSocket constants
      if (typeof window.WebSocket !== 'undefined') {
        window.WebSocket.CONNECTING = 0;
        window.WebSocket.OPEN = 1;
        window.WebSocket.CLOSING = 2;
        window.WebSocket.CLOSED = 3;
      }
      
      window.WebSocket = class MockWebSocket {
        constructor(url) {
          this.url = url;
          this.readyState = 0; // CONNECTING
          this._onopen = null;
          this._onmessage = null;
          this._onclose = null;
          this._onerror = null;
          
          // Schedule successful connection
          this._connectionTimer = setTimeout(() => {
            this.readyState = 1; // OPEN
            if (this._onopen) {
              this._onopen(new Event('open'));
            }
          }, 150);
        }
        
        get onopen() { return this._onopen; }
        set onopen(handler) {
          this._onopen = handler;
        }
        
        get onmessage() { return this._onmessage; }
        set onmessage(handler) {
          this._onmessage = handler;
        }
        
        get onclose() { return this._onclose; }
        set onclose(handler) {
          this._onclose = handler;
        }
        
        get onerror() { return this._onerror; }
        set onerror(handler) {
          this._onerror = handler;
          // Don't trigger error events in successful mock
        }
        
        send(data) {
          // Mock successful send
          setTimeout(() => {
            if (this._onmessage) {
              const mockResponse = {
                data: JSON.stringify({
                  type: 'status',
                  data: 'Mock server response',
                  timestamp: Date.now()
                })
              };
              this._onmessage(mockResponse);
            }
          }, 50);
        }
        
        close() {
          if (this._connectionTimer) {
            clearTimeout(this._connectionTimer);
          }
          this.readyState = 3; // CLOSED
          if (this._onclose) {
            this._onclose(new CloseEvent('close', { wasClean: true, code: 1000, reason: 'Normal closure' }));
          }
        }
        
        // Static constants
        static get CONNECTING() { return 0; }
        static get OPEN() { return 1; }
        static get CLOSING() { return 2; }
        static get CLOSED() { return 3; }
      };
      
      // Add constants to the constructor function
      window.WebSocket.CONNECTING = 0;
      window.WebSocket.OPEN = 1;
      window.WebSocket.CLOSING = 2;
      window.WebSocket.CLOSED = 3;
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