import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { useMapStore } from './stores/mapStore'

// Initialize store
useMapStore.getState().setActiveLayer('satellite')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
