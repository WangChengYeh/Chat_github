import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

// iOS Safari specific fixes
if (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) {
  // Prevent zoom on input focus
  const viewportMeta = document.querySelector('meta[name="viewport"]')
  if (viewportMeta) {
    viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no')
  }
  
  // Fix viewport height on iOS
  const setVH = () => {
    const vh = window.innerHeight * 0.01
    document.documentElement.style.setProperty('--vh', `${vh}px`)
  }
  
  setVH()
  window.addEventListener('resize', setVH)
  window.addEventListener('orientationchange', () => {
    setTimeout(setVH, 100) // Delay to ensure orientation change is complete
  })
  
  // Prevent unwanted body scrolling, but allow scrolling in content areas
  document.body.addEventListener('touchmove', (e) => {
    const target = e.target as Element
    if (!target) return
    
    // Allow scrolling in these areas
    const scrollableAreas = [
      '.cli-history', 
      '.editor-content', 
      '.config-content',
      '.tool-section',
      '.log-content',
      '.cm-scroller', // CodeMirror editor
      '.install-prompt' // Install prompt
    ]
    
    // Check if the touch is within any scrollable area
    const isInScrollableArea = scrollableAreas.some(selector => 
      target.closest(selector)
    )
    
    // Only prevent default if NOT in a scrollable area
    if (!isInScrollableArea) {
      e.preventDefault()
    }
  }, { passive: false })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)