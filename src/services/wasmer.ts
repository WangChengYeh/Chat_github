// Experimental: Compile C to WebAssembly in-browser using @wasmer/sdk and the LLVM/Clang package.
// This requires network access to fetch the package from Wasmer's registry at runtime.

export interface WasmerCompileResult {
  wasm: Uint8Array
  stdout: string
  stderr: string
}

export async function compileCWithWasmer(source: string, filename = 'program.c'): Promise<WasmerCompileResult> {
  // Lazy-load the SDK to avoid increasing initial bundle size
  // Avoid bundler resolution by computing module specifier at runtime
  const mod = '@wasmer' + '/sdk'
  let sdk: any
  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    sdk = await (new Function('m', 'return import(m)'))(mod)
  } catch (e) {
    throw new Error('Wasmer SDK not available. Please ensure @wasmer/sdk is installed and network access is allowed to fetch packages.')
  }
  const { Wasmer } = sdk
  // Initialize SDK (uses default registry https://registry.wasmer.io)
  await Wasmer.init()

  // Create a virtual filesystem and write source
  const fs = await Wasmer.createFs()
  await fs.writeFile(`/work/${filename}`, new TextEncoder().encode(source))

  // Choose a clang package (adjust version as available)
  const clangPkg = 'wasmer/clang:16'

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
