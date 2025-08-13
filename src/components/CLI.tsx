import React, { useState, useRef, useEffect } from 'react'
import { useStore } from '../store'
import { GitHubService } from '../services/github'
import { AIService } from '../services/ai'
import { DiffService } from '../services/diff'

const getDefaultFileContent = (path: string): string => {
  const ext = path.split('.').pop()?.toLowerCase()
  const filename = path.split('/').pop() || 'file'
  
  switch (ext) {
    case 'md':
    case 'markdown':
      return `# ${filename.replace(/\.(md|markdown)$/, '')}\n\nAdd your content here...\n`
    case 'js':
      return `// ${filename}\n\nconsole.log('Hello from ${filename}');\n`
    case 'jsx':
      return `// ${filename}\nimport React from 'react';\n\nconst Component = () => {\n  return (\n    <div>\n      <h1>New Component</h1>\n    </div>\n  );\n};\n\nexport default Component;\n`
    case 'ts':
      return `// ${filename}\n\ninterface Config {\n  message: string;\n}\n\nconst config: Config = {\n  message: 'Hello from ${filename}'\n};\n\nconsole.log(config.message);\n`
    case 'tsx':
      return `// ${filename}\nimport React from 'react';\n\ninterface Props {\n  title?: string;\n}\n\nconst Component: React.FC<Props> = ({ title = 'New Component' }) => {\n  return (\n    <div>\n      <h1>{title}</h1>\n    </div>\n  );\n};\n\nexport default Component;\n`
    case 'json':
      return `{\n  "name": "${filename.replace(/\.json$/, '')}",\n  "version": "1.0.0",\n  "description": "Add description here"\n}\n`
    case 'css':
      return `/* ${filename} */\n\n.container {\n  display: flex;\n  flex-direction: column;\n  gap: 1rem;\n}\n`
    case 'html':
      return `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>${filename.replace(/\.html$/, '')}</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>\n`
    case 'py':
      return `# ${filename}\n\ndef main():\n    print("Hello from ${filename}")\n\nif __name__ == "__main__":\n    main()\n`
    case 'txt':
      return `${filename}\n${'='.repeat(filename.length)}\n\nAdd your text content here...\n`
    default:
      return `# ${filename}\n\n# Add your content here...\n`
  }
}

export const CLI: React.FC = () => {
  const [input, setInput] = useState('')
  const [processing, setProcessing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const historyRef = useRef<HTMLDivElement>(null)
  
  const {
    history,
    addHistory,
    clearHistory,
    file,
    setFile,
    ai,
    setAI,
    config,
    setMode,
    setShowConfig
  } = useStore()

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight
    }
  }, [history])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const executeCommand = async (command: string) => {
    if (!command.trim()) return
    
    addHistory(`> ${command}`)
    setProcessing(true)

    try {
      if (command.startsWith('/')) {
        await handleSlashCommand(command.slice(1))
      } else {
        await handleAIInstruction(command)
      }
    } catch (error) {
      addHistory(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setProcessing(false)
    }
  }

  const handleSlashCommand = async (cmd: string) => {
    const [command, ...args] = cmd.split(' ')
    const arg = args.join(' ')

    switch (command) {
      case 'open':
        await openFile(arg)
        break
      case 'new':
        await createNewFile(arg)
        break
      case 'ls':
        await listFiles(arg || '')
        break
      case 'cat':
        await showFileContent(arg)
        break
      case 'apply':
        applyAIChanges()
        break
      case 'diff':
        showDiff()
        break
      case 'revert':
        revertChanges()
        break
      case 'commit':
        await commitChanges(arg.replace(/^["']|["']$/g, ''))
        break
      case 'branch':
        await switchBranch(arg)
        break
      case 'model':
        switchModel(arg)
        break
      case 'config':
        setShowConfig(true)
        addHistory('Configuration overlay opened')
        break
      case 'save':
        saveLocal()
        break
      case 'tokens':
        await estimateTokens()
        break
      case 'help':
        showHelp()
        break
      case 'editor':
        setMode('editor')
        addHistory('Switched to editor mode')
        break
      case 'cli':
        addHistory('Already in CLI mode')
        break
      case 'clear':
        clearHistory()
        break
      case 'ai':
        await handleAIInstruction(arg)
        break
      default:
        addHistory(`Unknown command: ${command}`)
    }
  }

  const handleAIInstruction = async (instruction: string) => {
    if (!instruction.trim()) {
      addHistory('Please provide an instruction')
      return
    }

    if (!config.openaiKey) {
      addHistory('OpenAI API key not configured. Use /config to set it up.')
      return
    }

    if (!file.current) {
      addHistory('No file loaded. Use /open <path> to load a file first.')
      return
    }

    setAI({ lastInstruction: instruction, pending: true })
    addHistory(`AI instruction: ${instruction}`)

    try {
      const aiService = new AIService(config.openaiKey, config.model, config.temperature)
      const result = await aiService.transformFile(instruction, file.current)
      
      setAI({ lastAIContent: result, pending: false })
      addHistory('AI transformation completed. Use /apply to apply changes.')
    } catch (error) {
      setAI({ pending: false })
      throw error
    }
  }

  const openFile = async (path: string) => {
    if (!path) {
      addHistory('Usage: /open <path>')
      return
    }

    if (!config.githubToken || !config.owner || !config.repo) {
      addHistory('GitHub configuration missing. Use /config to set up.')
      return
    }

    try {
      const github = new GitHubService(config.githubToken, config.owner, config.repo)
      const { content, sha } = await github.getFile(path, config.branch)
      
      setFile({
        original: content,
        current: content,
        sha,
        dirty: false
      })
      
      addHistory(`Opened ${path} (sha: ${sha.substring(0, 7)})`)
    } catch (error) {
      throw new Error(`Failed to open file: ${error}`)
    }
  }

  const createNewFile = async (path: string) => {
    if (!path) {
      addHistory('Usage: /new <path>')
      return
    }

    if (!config.githubToken || !config.owner || !config.repo) {
      addHistory('GitHub configuration missing. Use /config to set up.')
      return
    }

    try {
      // Check if file already exists
      const github = new GitHubService(config.githubToken, config.owner, config.repo)
      
      try {
        await github.getFile(path, config.branch)
        addHistory(`File ${path} already exists. Use /open to edit it.`)
        return
      } catch (error) {
        // File doesn't exist, which is what we want for creating new file
      }

      // Create new file with default content based on extension
      const defaultContent = getDefaultFileContent(path)
      
      setFile({
        original: '',
        current: defaultContent,
        sha: '',
        dirty: true
      })
      
      // Update config path for this session
      setConfig({ path })
      
      addHistory(`Created new file: ${path}`)
      addHistory('File is ready for editing. Use /commit to save it to GitHub.')
    } catch (error) {
      throw new Error(`Failed to create file: ${error}`)
    }
  }

  const listFiles = async (path: string) => {
    if (!config.githubToken || !config.owner || !config.repo) {
      addHistory('GitHub configuration missing. Use /config to set up.')
      return
    }

    try {
      const github = new GitHubService(config.githubToken, config.owner, config.repo)
      const items = await github.listDirectory(path, config.branch)
      
      addHistory(`Contents of ${path || 'root'}:`)
      
      // Sort directories first, then files
      const sorted = items.sort((a, b) => {
        if (a.type === b.type) {
          return a.name.localeCompare(b.name)
        }
        return a.type === 'dir' ? -1 : 1
      })
      
      sorted.forEach(item => {
        const icon = item.type === 'dir' ? '📁' : '📄'
        const size = item.size ? ` (${formatFileSize(item.size)})` : ''
        addHistory(`${icon} ${item.name}${size}`)
      })
      
      addHistory(`\nFound ${items.length} items`)
    } catch (error) {
      throw new Error(`Failed to list files: ${error}`)
    }
  }

  const showFileContent = async (path: string) => {
    if (!path) {
      addHistory('Usage: /cat <path>')
      return
    }

    if (!config.githubToken || !config.owner || !config.repo) {
      addHistory('GitHub configuration missing. Use /config to set up.')
      return
    }

    try {
      const github = new GitHubService(config.githubToken, config.owner, config.repo)
      const { content } = await github.getFile(path, config.branch)
      
      addHistory(`Content of ${path}:`)
      addHistory('─'.repeat(50))
      
      // Limit content display to prevent overwhelming the CLI
      const lines = content.split('\n')
      if (lines.length > 50) {
        lines.slice(0, 50).forEach(line => addHistory(line))
        addHistory('─'.repeat(50))
        addHistory(`... (showing first 50 lines of ${lines.length})`)
        addHistory('Use /open to load the full file for editing')
      } else {
        lines.forEach(line => addHistory(line))
        addHistory('─'.repeat(50))
      }
      
    } catch (error) {
      throw new Error(`Failed to show file content: ${error}`)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const applyAIChanges = () => {
    if (!ai.lastAIContent) {
      addHistory('No AI changes to apply')
      return
    }

    setFile({
      current: ai.lastAIContent,
      dirty: true
    })
    
    addHistory('AI changes applied to editor')
  }

  const showDiff = () => {
    if (!file.original || !file.current) {
      addHistory('No file loaded to show diff')
      return
    }

    if (!DiffService.hasChanges(file.original, file.current)) {
      addHistory('No changes to show')
      return
    }

    const diffText = DiffService.formatDiffText(file.original, file.current)
    addHistory('Diff:')
    addHistory(diffText)
  }

  const revertChanges = () => {
    if (!file.original) {
      addHistory('No original content to revert to')
      return
    }

    setFile({
      current: file.original,
      dirty: false
    })
    
    addHistory('Changes reverted to original content')
  }

  const commitChanges = async (message: string) => {
    if (!message) {
      addHistory('Usage: /commit "commit message"')
      return
    }

    if (!file.current) {
      addHistory('No content to commit')
      return
    }

    if (!config.path) {
      addHistory('No file path set. Use /open or /new first.')
      return
    }

    if (!config.githubToken || !config.owner || !config.repo) {
      addHistory('GitHub configuration missing')
      return
    }

    try {
      const github = new GitHubService(config.githubToken, config.owner, config.repo)
      
      let newSha: string
      
      if (file.sha) {
        // Updating existing file
        newSha = await github.updateFile(
          config.path, 
          file.current, 
          file.sha, 
          message, 
          config.branch
        )
        addHistory(`Updated: ${message} (sha: ${newSha.substring(0, 7)})`)
      } else {
        // Creating new file
        newSha = await github.createFile(
          config.path, 
          file.current, 
          message, 
          config.branch
        )
        addHistory(`Created: ${message} (sha: ${newSha.substring(0, 7)})`)
      }
      
      setFile({
        original: file.current,
        sha: newSha,
        dirty: false
      })
      
    } catch (error) {
      throw new Error(`Commit failed: ${error}`)
    }
  }

  const switchBranch = async (branch: string) => {
    if (!branch) {
      addHistory('Usage: /branch <branch-name>')
      return
    }

    addHistory(`Switched to branch: ${branch}`)
    // Note: Branch switching would need additional GitHub API calls to check if branch exists
  }

  const switchModel = (model: string) => {
    if (!model) {
      addHistory(`Current model: ${config.model}`)
      return
    }

    addHistory(`Switched to model: ${model}`)
  }

  const saveLocal = () => {
    localStorage.setItem('chat-github-draft', JSON.stringify({
      content: file.current,
      timestamp: Date.now()
    }))
    addHistory('Content saved to local storage')
  }

  const estimateTokens = async () => {
    if (!file.current) {
      addHistory('No file loaded')
      return
    }

    if (!config.openaiKey) {
      addHistory('OpenAI API key needed for token estimation')
      return
    }

    const aiService = new AIService(config.openaiKey)
    const tokens = await aiService.estimateTokens(file.current)
    addHistory(`Estimated tokens: ${tokens}`)
  }

  const showHelp = () => {
    const commands = [
      '/open <path> - Load file from GitHub',
      '/new <path> - Create new file with template',
      '/ls [path] - List files in directory',
      '/cat <path> - Show file contents',
      '/apply - Apply AI changes to editor',
      '/diff - Show differences',
      '/revert - Revert to original',
      '/commit "msg" - Commit changes',
      '/branch <name> - Switch branch',
      '/model <id> - Switch AI model',
      '/config - Open configuration',
      '/save - Save draft locally',
      '/tokens - Estimate token usage',
      '/editor - Switch to editor',
      '/clear - Clear history',
      '/help - Show this help'
    ]
    
    addHistory('Available commands:')
    commands.forEach(cmd => addHistory(cmd))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || processing) return
    
    executeCommand(input)
    setInput('')
  }

  return (
    <div className="cli-container">
      <div className="cli-history" ref={historyRef}>
        {history.map((line, index) => (
          <div key={index} className="cli-line">
            {line}
          </div>
        ))}
        {processing && <div className="cli-line processing">Processing...</div>}
      </div>
      
      <form onSubmit={handleSubmit} className="cli-input-form">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={processing}
          className="cli-input"
          placeholder="輸入指令或AI指示... (以/開始指令) / Enter command (start with /) or AI instruction..."
          autoComplete="off"
          lang="zh-TW"
          spellCheck={false}
        />
      </form>
    </div>
  )
}