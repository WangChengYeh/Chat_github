// Lightweight Pyodide loader + runner with stdout/stderr capture.
// Uses CDN by default but will work offline after /preload python warmed the cache.

export interface PythonRunResult {
  stdout: string
  stderr: string
  result?: any
}

let pyodideReady: Promise<any> | null = null

async function injectScript(src: string): Promise<void> {
  if (document.querySelector(`script[data-pyodide-src="${src}"]`)) return
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = src
    s.async = true
    s.dataset.pyodideSrc = src
    s.onload = () => resolve()
    s.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(s)
  })
}

export async function loadPython(): Promise<any> {
  if (pyodideReady) return pyodideReady
  pyodideReady = (async () => {
    const base = (window as any).__PYODIDE_BASE || 'https://cdn.jsdelivr.net/npm/pyodide@0.24.1/full'
    if (!(window as any).loadPyodide) {
      await injectScript(`${base}/pyodide.js`)
    }
    const loadPyodideFn = (window as any).loadPyodide
    if (typeof loadPyodideFn !== 'function') {
      throw new Error('Pyodide loader not available after script load')
    }
    const pyodide = await loadPyodideFn({ indexURL: base })
    return pyodide
  })()
  return pyodideReady
}

export async function runPythonCode(code: string): Promise<PythonRunResult> {
  const pyodide = await loadPython()
  let outBuf = ''
  let errBuf = ''
  const origOut = pyodide.stdout_callback
  const origErr = pyodide.stderr_callback
  pyodide.setStdout((s: string) => { outBuf += s })
  pyodide.setStderr((s: string) => { errBuf += s })
  try {
    // runPython is sync; for long tasks you may switch to runPythonAsync
    const result = pyodide.runPython(code)
    return { stdout: outBuf, stderr: errBuf, result }
  } finally {
    // restore callbacks
    pyodide.setStdout(origOut)
    pyodide.setStderr(origErr)
  }
}

