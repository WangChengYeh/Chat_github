import { EditorSelection } from '@codemirror/state'
import { EditorView } from '@codemirror/view'

function isImage(file: File) {
  return file.type.startsWith('image/')
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => resolve(String(reader.result))
    reader.readAsDataURL(file)
  })
}

async function insertImages(view: EditorView, files: File[], pos?: number) {
  const images = files.filter(isImage)
  if (!images.length) return false

  // Limit to a few images per action to avoid huge inserts
  const subset = images.slice(0, 3)

  const parts: string[] = []
  for (const file of subset) {
    try {
      const url = await readFileAsDataURL(file)
      const alt = file.name.replace(/\[(.*?)\]|\(|\)/g, '_')
      parts.push(`![${alt}](${url})`)
    } catch (e) {
      // skip errored files
    }
  }
  if (!parts.length) return false

  const text = (pos != null ? '' : '\n') + parts.join('\n') + '\n'
  if (pos == null) {
    // Insert at current selection head
    const head = view.state.selection.main.head
    view.dispatch({
      changes: { from: head, to: head, insert: text },
      selection: EditorSelection.cursor(head + text.length)
    })
  } else {
    view.dispatch({
      changes: { from: pos, to: pos, insert: text },
      selection: EditorSelection.cursor(pos + text.length)
    })
  }
  return true
}

export function imagePasteDrop() {
  return EditorView.domEventHandlers({
    paste: (event, view) => {
      if (!event.clipboardData) return false
      const files = Array.from(event.clipboardData.files || [])
      if (!files.some(isImage)) return false
      event.preventDefault()
      insertImages(view, files)
      return true
    },
    drop: (event, view) => {
      if (!event.dataTransfer) return false
      const files = Array.from(event.dataTransfer.files || [])
      if (!files.some(isImage)) return false
      event.preventDefault()
      const pos = view.posAtCoords({ x: event.clientX, y: event.clientY }) ?? view.state.selection.main.head
      insertImages(view, files, pos)
      return true
    }
  })
}

