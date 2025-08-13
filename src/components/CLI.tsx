import React, { useState, useRef, useEffect } from 'react'
import { useStore } from '../store'
import { GitHubService } from '../services/github'
import { AIService } from '../services/ai'
import { DiffService } from '../services/diff'

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
      if (command.startsWith(':')) {
        await handleColonCommand(command.slice(1))
      } else {
        await handleAIInstruction(command)
      }
    } catch (error) {
      addHistory(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setProcessing(false)
    }
  }

  const handleColonCommand = async (cmd: string) => {
    const [command, ...args] = cmd.split(' ')
    const arg = args.join(' ')

    switch (command) {
      case 'open':
        await openFile(arg)
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
      addHistory('OpenAI API key not configured. Use :config to set it up.')
      return
    }

    if (!file.current) {
      addHistory('No file loaded. Use :open <path> to load a file first.')
      return
    }

    setAI({ lastInstruction: instruction, pending: true })
    addHistory(`AI instruction: ${instruction}`)

    try {
      const aiService = new AIService(config.openaiKey, config.model, config.temperature)
      const result = await aiService.transformFile(instruction, file.current)
      
      setAI({ lastAIContent: result, pending: false })
      addHistory('AI transformation completed. Use :apply to apply changes.')
    } catch (error) {
      setAI({ pending: false })
      throw error
    }
  }

  const openFile = async (path: string) => {
    if (!path) {
      addHistory('Usage: :open <path>')
      return
    }

    if (!config.githubToken || !config.owner || !config.repo) {
      addHistory('GitHub configuration missing. Use :config to set up.')
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
      addHistory('Usage: :commit "commit message"')
      return
    }

    if (!file.current || !file.sha) {
      addHistory('No file loaded or no changes to commit')
      return
    }

    if (!config.githubToken || !config.owner || !config.repo) {
      addHistory('GitHub configuration missing')
      return
    }

    try {
      const github = new GitHubService(config.githubToken, config.owner, config.repo)
      const newSha = await github.updateFile(
        config.path, 
        file.current, 
        file.sha, 
        message, 
        config.branch
      )
      
      setFile({
        original: file.current,
        sha: newSha,
        dirty: false
      })
      
      addHistory(`Committed: ${message} (sha: ${newSha.substring(0, 7)})`)
    } catch (error) {
      throw new Error(`Commit failed: ${error}`)
    }
  }

  const switchBranch = async (branch: string) => {
    if (!branch) {
      addHistory('Usage: :branch <branch-name>')
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
      ':open <path> - Load file from GitHub',
      ':apply - Apply AI changes to editor',
      ':diff - Show differences',
      ':revert - Revert to original',
      ':commit "msg" - Commit changes',
      ':branch <name> - Switch branch',
      ':model <id> - Switch AI model',
      ':config - Open configuration',
      ':save - Save draft locally',
      ':tokens - Estimate token usage',
      ':editor - Switch to editor',
      ':clear - Clear history',
      ':help - Show this help'
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
          placeholder="輸入指令或AI指示... / Enter command or AI instruction..."
          autoComplete="off"
          lang="zh-TW"
          spellCheck={false}
        />
      </form>
    </div>
  )
}