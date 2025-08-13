import React, { useEffect } from 'react'
import { useStore } from './store'
import { CLI } from './components/CLI'
import { Editor } from './components/Editor'
import { ConfigOverlay } from './components/ConfigOverlay'
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

  return (
    <div className="app">
      {mode === 'cli' ? <CLI /> : <Editor />}
      <ConfigOverlay />
    </div>
  )
}

export default App