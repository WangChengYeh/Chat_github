import { useEffect } from 'react'
import { useStore } from './store'
import { CLI } from './components/CLI'
import { Editor } from './components/Editor'
import { Tool } from './components/Tool'
import { ConfigOverlay } from './components/ConfigOverlay'
import { InstallPrompt } from './components/InstallPrompt'
import './App.css'

function App() {
  const { mode, setConfig } = useStore()

  useEffect(() => {
    const savedConfig = localStorage.getItem('chat-github-config')
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig)
        setConfig(parsedConfig)
      } catch (error) {
        console.error('Failed to load saved config:', error)
      }
    }
  }, [setConfig])

  const renderCurrentMode = () => {
    switch (mode) {
      case 'cli':
        return <CLI />
      case 'editor':
        return <Editor />
      case 'tool':
        return <Tool />
      default:
        return <CLI />
    }
  }

  return (
    <div className="app">
      {renderCurrentMode()}
      <ConfigOverlay />
      <InstallPrompt />
    </div>
  )
}

export default App