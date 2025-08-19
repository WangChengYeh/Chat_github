// Experimental: Compile C to WebAssembly in-browser using @wasmer/sdk and the LLVM/Clang package.
// This requires network access to fetch the package from Wasmer's registry at runtime.

export interface WasmerCompileResult {
  wasm: Uint8Array
  stdout: string
  stderr: string
}

export async function compileCWithWasmer(source: string, filename = 'program.c'): Promise<WasmerCompileResult> {
  // Test hook: allow Playwright to inject a mock compiler to avoid network
  if (typeof window !== 'undefined' && (window as any).__mockCompileCWithWasmer) {
    const res = await (window as any).__mockCompileCWithWasmer(source, filename)
    return res as WasmerCompileResult
  }
  // Lazy-load the SDK to avoid increasing initial bundle size
  // Avoid bundler resolution by computing module specifier at runtime
  async function dynImport(spec: string) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      return await (new Function('m', 'return import(m)'))(spec)
    } catch {
      return null
    }
  }
  let sdk: any = null
  // Try local module resolution first (if installed)
  sdk = await dynImport('@wasmer/sdk')
  // Fallback to ESM CDNs in browser
  if (!sdk && typeof window !== 'undefined') {
    sdk = await dynImport('https://esm.sh/@wasmer/sdk')
      || await dynImport('https://cdn.skypack.dev/@wasmer/sdk')
      || await dynImport('https://esm.run/@wasmer/sdk')
  }
  if (!sdk) {
    throw new Error('Wasmer SDK not available. Check network access; falling back failed.')
  }
  const { Wasmer } = sdk
  // Initialize SDK (uses default registry https://registry.wasmer.io)
  await Wasmer.init()

  // Create a virtual filesystem and write source
  const fs = await Wasmer.createFs()
  await fs.writeFile(`/work/${filename}`, new TextEncoder().encode(source))

  // Choose a clang package (adjust version as available)
  // Use newest stable clang package from Wasmer registry
  const clangPkg = 'wasmer/clang:latest'

  // Compile to standalone wasm. For clang in Wasmer, --target=wasm32-wasi with no entry can be used,
  // but we default to exporting main; users may add their own flags later.
  const outName = filename.replace(/\.c$/i, '.wasm')
  const args = [
    `--target=wasm32-wasi`, `-O3`, `-Wl,--export-all`, `-Wl,--no-entry`,
    `-o`, `/work/${outName}`, `/work/${filename}`
  ]

  const result = await Wasmer.runPackage(clangPkg, {
    args,
    mount: { '/work': fs },
    env: {}
  })

  // Read outputs
  let stdout = ''
  let stderr = ''
  try { stdout = new TextDecoder().decode(await result.stdout?.bytes()) } catch {}
  try { stderr = new TextDecoder().decode(await result.stderr?.bytes()) } catch {}

  const wasm = await fs.readFile(`/work/${outName}`)
  if (!wasm || !(wasm instanceof Uint8Array)) {
    throw new Error(`Wasmer compile failed: output file missing. Stderr: ${stderr}`)
  }
  return { wasm, stdout, stderr }
}
