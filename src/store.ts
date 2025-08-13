import { create } from 'zustand'

export interface FileState {
  original: string
  current: string
  sha: string
  dirty: boolean
}

export interface AIState {
  lastInstruction: string
  lastAIContent: string
  pending: boolean
}

export interface ConfigState {
  githubToken: string
  openaiKey: string
  owner: string
  repo: string
  branch: string
  path: string
  model: string
  temperature: number
}

export interface AppState {
  mode: 'cli' | 'editor'
  file: FileState
  ai: AIState
  config: ConfigState
  history: string[]
  showConfig: boolean
}

interface AppStore extends AppState {
  setMode: (mode: 'cli' | 'editor') => void
  setFile: (file: Partial<FileState>) => void
  setAI: (ai: Partial<AIState>) => void
  setConfig: (config: Partial<ConfigState>) => void
  addHistory: (message: string) => void
  clearHistory: () => void
  setShowConfig: (show: boolean) => void
  resetFile: () => void
}

const initialFile: FileState = {
  original: '',
  current: '',
  sha: '',
  dirty: false
}

const initialAI: AIState = {
  lastInstruction: '',
  lastAIContent: '',
  pending: false
}

const initialConfig: ConfigState = {
  githubToken: '',
  openaiKey: '',
  owner: '',
  repo: '',
  branch: 'main',
  path: '',
  model: 'gpt-4o-mini',
  temperature: 0.3
}

export const useStore = create<AppStore>((set, get) => ({
  mode: 'cli',
  file: initialFile,
  ai: initialAI,
  config: initialConfig,
  history: [],
  showConfig: false,

  setMode: (mode) => set({ mode }),
  
  setFile: (file) => set((state) => ({
    file: { ...state.file, ...file }
  })),
  
  setAI: (ai) => set((state) => ({
    ai: { ...state.ai, ...ai }
  })),
  
  setConfig: (config) => set((state) => ({
    config: { ...state.config, ...config }
  })),
  
  addHistory: (message) => set((state) => ({
    history: [...state.history, message]
  })),
  
  clearHistory: () => set({ history: [] }),
  
  setShowConfig: (show) => set({ showConfig: show }),
  
  resetFile: () => set({
    file: initialFile
  })
}))