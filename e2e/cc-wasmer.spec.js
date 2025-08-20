import { test, expect } from '@playwright/test'

test.describe('CLI /cc Wasmer compile (browser-only)', () => {
  test('compiles a C file using Wasmer SDK mock and downloads wasm', async ({ page }) => {
    // Preload config and a mock Wasmer compile to avoid network/package fetch
    await page.addInitScript(() => {
      localStorage.setItem('chat-github-config', JSON.stringify({
        githubToken: 'ghp_dummy',
        owner: 'user', repo: 'repo', branch: 'main',
        openaiKey: 'sk-dummy',
        path: '', // we pass path explicitly to /cc
        model: 'gpt-4o-mini', temperature: 0.3
      }))
      // Inject mock compiler
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      window.__mockCompileCWithWasmer = async (source, filename) => {
        const enc = new TextEncoder()
        return {
          wasm: enc.encode('wasm-binary-mock'),
          stdout: 'clang mock stdout',
          stderr: ''
        }
      }
    })

    // Mock GitHub getFile for the C source
    await page.route('https://api.github.com/repos/*/*/contents/*.c*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: btoa('int main() { return 0; }'),
          sha: 'mocksha'
        })
      })
    })

    await page.goto('/')
    await page.waitForSelector('.cli-input')

    // Run compile
    await page.fill('.cli-input', '/cc main.c')
    await page.press('.cli-input', 'Enter')

    const history = page.locator('.cli-history')
    await expect(history).toContainText('Using Wasmer SDK')
    await expect(history).toContainText('Downloaded main.wasm')
  })

  test('compiles currently opened C file via /open then /cc (no path)', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('chat-github-config', JSON.stringify({
        githubToken: 'ghp_dummy',
        owner: 'user', repo: 'repo', branch: 'main',
        openaiKey: 'sk-dummy',
        path: '',
        model: 'gpt-4o-mini', temperature: 0.3
      }))
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      window.__mockCompileCWithWasmer = async (source, filename) => {
        const enc = new TextEncoder()
        return { wasm: enc.encode('wasm-binary-mock'), stdout: 'ok', stderr: '' }
      }
    })

    await page.route('https://api.github.com/repos/*/*/contents/main.c*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: btoa('int main(){return 0;}'),
          sha: 'mocksha'
        })
      })
    })

    await page.goto('/')
    await page.waitForSelector('.cli-input')

    // Open file then compile without specifying the path
    await page.fill('.cli-input', '/open main.c')
    await page.press('.cli-input', 'Enter')

    await page.fill('.cli-input', '/cc')
    await page.press('.cli-input', 'Enter')

    const history = page.locator('.cli-history')
    await expect(history).toContainText('Using Wasmer SDK')
    await expect(history).toContainText('Downloaded main.wasm')
  })
})
